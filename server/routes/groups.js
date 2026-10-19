import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { query, withTransaction } from '../db/pool.js';
import { toPaise, splitEqual, formatInr } from '../services/moneyService.js';
import { calculateNetBalances, simplifyDebts } from '../services/debtSimplifier.js';

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

// 1. Create Group (With Dynamic Friends and Manual Members)
groupsRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const {
      name,
      description,
      groupType = 'friends',
      currency = 'INR',
      members = [],
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Group name is required.' },
      });
    }

    const validGroupTypes = ['trip', 'apartment', 'friends', 'family', 'event', 'other'];
    const resolvedType = validGroupTypes.includes(groupType) ? groupType : 'friends';

    const groupId = `grp_${crypto.randomUUID()}`;
    const creatorMemberId = `gm_${crypto.randomUUID()}`;

    // Execute group creation and member insertions atomically
    const createdGroup = await withTransaction(async (client) => {
      // 1. Insert Group
      const groupRes = await client.query(
        `INSERT INTO groups (id, name, description, group_type, currency, created_by_user_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *;`,
        [groupId, name.trim(), description?.trim() || null, resolvedType, currency, userId]
      );

      // 2. Add creator automatically once
      await client.query(
        `INSERT INTO group_members (id, group_id, user_id, role)
         VALUES ($1, $2, $3, 'admin');`,
        [creatorMemberId, groupId, userId]
      );

      // 3. Add other members (friends or manual offline members)
      const seenUserIds = new Set([userId]);
      const seenManualNames = new Set();

      for (const m of members) {
        if (m.type === 'friend' && m.userId) {
          if (!seenUserIds.has(m.userId)) {
            seenUserIds.add(m.userId);
            const mId = `gm_${crypto.randomUUID()}`;
            await client.query(
              `INSERT INTO group_members (id, group_id, user_id, role)
               VALUES ($1, $2, $3, 'member')
               ON CONFLICT DO NOTHING;`,
              [mId, groupId, m.userId]
            );
          }
        } else if (m.type === 'manual' || m.manualName || m.name) {
          const manualName = (m.manualName || m.name || '').trim();
          if (manualName && !seenManualNames.has(manualName.toLowerCase())) {
            seenManualNames.add(manualName.toLowerCase());
            const mId = `gm_${crypto.randomUUID()}`;
            await client.query(
              `INSERT INTO group_members (id, group_id, manual_name, manual_email, manual_upi_id, role)
               VALUES ($1, $2, $3, $4, $5, 'member');`,
              [mId, groupId, manualName, m.email?.trim() || null, m.upiId?.trim() || null]
            );
          }
        }
      }

      return groupRes.rows[0];
    });

    res.status(201).json({ group: createdGroup });
  } catch (err) {
    next(err);
  }
});

// 2. List Groups for Current User
groupsRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;

    // Find all groups where current user is a member
    const groupsRes = await query(
      `SELECT g.id, g.name, g.description, g.group_type, g.currency, g.created_by_user_id, g.created_at,
              gm.id AS current_member_id,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count,
              COALESCE((SELECT SUM(total_amount_paise) FROM shared_expenses WHERE group_id = g.id), 0) AS total_shared_paise
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1
       ORDER BY g.updated_at DESC;`,
      [userId]
    );

    const groupsWithBalances = await Promise.all(
      groupsRes.rows.map(async (grp) => {
        // Compute net balance for current viewer in this group
        const membersRes = await query(
          `SELECT id, user_id, manual_name FROM group_members WHERE group_id = $1;`,
          [grp.id]
        );
        const payersRes = await query(
          `SELECT p.member_id, p.amount_paise
           FROM shared_expense_payers p
           JOIN shared_expenses e ON e.id = p.expense_id
           WHERE e.group_id = $1;`,
          [grp.id]
        );
        const allocsRes = await query(
          `SELECT a.member_id, a.amount_paise
           FROM shared_expense_allocations a
           JOIN shared_expenses e ON e.id = a.expense_id
           WHERE e.group_id = $1;`,
          [grp.id]
        );
        const settlementsRes = await query(
          `SELECT from_member_id, to_member_id, amount_paise, status
           FROM settlements
           WHERE group_id = $1;`,
          [grp.id]
        );

        const netMap = calculateNetBalances(
          membersRes.rows,
          payersRes.rows,
          allocsRes.rows,
          settlementsRes.rows
        );

        const viewerNetPaise = netMap.get(grp.current_member_id) || 0;

        return {
          id: grp.id,
          name: grp.name,
          description: grp.description,
          groupType: grp.group_type,
          currency: grp.currency,
          memberCount: parseInt(grp.member_count, 10),
          totalSharedPaise: Number(grp.total_shared_paise),
          viewerNetPaise,
          viewerBalanceText: viewerNetPaise > 0
            ? `You are owed ${formatInr(viewerNetPaise)}`
            : viewerNetPaise < 0
              ? `You owe ${formatInr(Math.abs(viewerNetPaise))}`
              : 'Settled up',
          createdAt: grp.created_at,
        };
      })
    );

    res.status(200).json({ groups: groupsWithBalances });
  } catch (err) {
    next(err);
  }
});

// 3. Get Group Details with Balances and Debt Simplification
groupsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    // Verify current user is authorized member of this group
    const membershipCheck = await query(
      `SELECT id, role FROM group_members WHERE group_id = $1 AND user_id = $2;`,
      [id, userId]
    );

    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You are not a member of this group.' },
      });
    }

    const currentMemberId = membershipCheck.rows[0].id;

    // Fetch Group
    const groupRes = await query('SELECT * FROM groups WHERE id = $1;', [id]);
    if (groupRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Group not found.' },
      });
    }
    const group = groupRes.rows[0];

    // Fetch Members with joined User details
    const membersRes = await query(
      `SELECT gm.id, gm.user_id, gm.manual_name, gm.manual_email, gm.manual_upi_id, gm.role,
              u.name AS user_name, u.email AS user_email, u.upi_id AS user_upi_id
       FROM group_members gm
       LEFT JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at ASC;`,
      [id]
    );

    const members = membersRes.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.user_id ? (row.user_name || 'Paylog User') : row.manual_name,
      email: row.user_id ? row.user_email : row.manual_email,
      upiId: row.user_id ? row.user_upi_id : row.manual_upi_id,
      role: row.role,
      isCurrentUser: row.id === currentMemberId,
      isManual: !row.user_id,
    }));

    const memberNamesMap = new Map(members.map((m) => [m.id, m.name]));

    // Fetch Shared Expenses with Payers & Allocations
    const expensesRes = await query(
      `SELECT e.id, e.title, e.total_amount_paise, e.category_id, e.category_name,
              e.expense_date, e.created_by_user_id, e.split_method, e.created_at,
              u.name AS created_by_name,
              p.member_id AS payer_member_id
       FROM shared_expenses e
       LEFT JOIN users u ON u.id = e.created_by_user_id
       LEFT JOIN shared_expense_payers p ON p.expense_id = e.id
       WHERE e.group_id = $1
       ORDER BY e.expense_date DESC, e.created_at DESC;`,
      [id]
    );

    // Fetch allocations for all expenses
    const allocationsRes = await query(
      `SELECT a.expense_id, a.member_id, a.amount_paise
       FROM shared_expense_allocations a
       JOIN shared_expenses e ON e.id = a.expense_id
       WHERE e.group_id = $1;`,
      [id]
    );

    // Group allocations by expense_id
    const allocationsByExpense = new Map();
    for (const alloc of allocationsRes.rows) {
      if (!allocationsByExpense.has(alloc.expense_id)) {
        allocationsByExpense.set(alloc.expense_id, []);
      }
      allocationsByExpense.get(alloc.expense_id).push({
        memberId: alloc.member_id,
        memberName: memberNamesMap.get(alloc.member_id) || 'Unknown',
        amountPaise: Number(alloc.amount_paise),
      });
    }

    const expenses = expensesRes.rows.map((exp) => ({
      id: exp.id,
      title: exp.title,
      totalAmountPaise: Number(exp.total_amount_paise),
      categoryId: exp.category_id,
      categoryName: exp.category_name,
      expenseDate: exp.expense_date instanceof Date
        ? exp.expense_date.toISOString().slice(0, 10)
        : String(exp.expense_date).slice(0, 10),
      createdByName: exp.created_by_name,
      payerMemberId: exp.payer_member_id,
      payerName: memberNamesMap.get(exp.payer_member_id) || 'Unknown',
      splitMethod: exp.split_method,
      participants: allocationsByExpense.get(exp.id) || [],
      createdAt: exp.created_at,
    }));

    // Fetch Settlements
    const settlementsRes = await query(
      `SELECT s.id, s.from_member_id, s.to_member_id, s.amount_paise, s.settlement_date,
              s.payment_method, s.status, s.notes, s.created_at,
              u.name AS recorded_by_name
       FROM settlements s
       LEFT JOIN users u ON u.id = s.recorded_by_user_id
       WHERE s.group_id = $1
       ORDER BY s.settlement_date DESC, s.created_at DESC;`,
      [id]
    );

    const settlements = settlementsRes.rows.map((s) => ({
      id: s.id,
      fromMemberId: s.from_member_id,
      fromName: memberNamesMap.get(s.from_member_id) || 'Unknown',
      toMemberId: s.to_member_id,
      toName: memberNamesMap.get(s.to_member_id) || 'Unknown',
      amountPaise: Number(s.amount_paise),
      settlementDate: s.settlement_date instanceof Date
        ? s.settlement_date.toISOString().slice(0, 10)
        : String(s.settlement_date).slice(0, 10),
      paymentMethod: s.payment_method,
      status: s.status,
      notes: s.notes,
      recordedByName: s.recorded_by_name,
      createdAt: s.created_at,
    }));

    // Calculate Net Balances
    const payersRes = await query(
      `SELECT p.member_id, p.amount_paise
       FROM shared_expense_payers p
       JOIN shared_expenses e ON e.id = p.expense_id
       WHERE e.group_id = $1;`,
      [id]
    );

    const netMap = calculateNetBalances(
      members,
      payersRes.rows,
      allocationsRes.rows,
      settlementsRes.rows
    );

    const netBalances = members.map((m) => {
      const netPaise = netMap.get(m.id) || 0;
      return {
        memberId: m.id,
        name: m.name,
        netPaise,
        isCurrentUser: m.id === currentMemberId,
        text: netPaise > 0
          ? `is owed ${formatInr(netPaise)}`
          : netPaise < 0
            ? `owes ${formatInr(Math.abs(netPaise))}`
            : 'settled',
      };
    });

    const viewerNetPaise = netMap.get(currentMemberId) || 0;
    const viewerBalance = {
      netPaise: viewerNetPaise,
      text: viewerNetPaise > 0
        ? `You are owed ${formatInr(viewerNetPaise)}`
        : viewerNetPaise < 0
          ? `You owe ${formatInr(Math.abs(viewerNetPaise))}`
          : 'You are all settled up',
    };

    // Calculate Simplified Debts
    const simplifiedDebts = simplifyDebts(new Map(netMap), memberNamesMap);

    const totalSharedPaise = expenses.reduce((sum, e) => sum + e.totalAmountPaise, 0);

    res.status(200).json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        groupType: group.group_type,
        currency: group.currency,
        createdAt: group.created_at,
      },
      currentMemberId,
      members,
      expenses,
      settlements,
      netBalances,
      viewerBalance,
      simplifiedDebts,
      totalSharedPaise,
    });
  } catch (err) {
    next(err);
  }
});

// 4. Add Shared Expense to Group
groupsRouter.post('/:id/expenses', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const {
      title,
      amount,
      amountPaise: explicitPaise,
      categoryId,
      categoryName = 'Other',
      expenseDate,
      payerMemberId,
      participantMemberIds = [],
    } = req.body;

    // Check membership
    const membershipCheck = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2;',
      [id, userId]
    );

    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You must be a member of this group to record an expense.' },
      });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Expense title is required.' },
      });
    }

    let paise;
    if (explicitPaise !== undefined && explicitPaise !== null) {
      paise = parseInt(explicitPaise, 10);
    } else {
      paise = toPaise(amount);
    }

    if (!payerMemberId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Payer member is required.' },
      });
    }

    if (!Array.isArray(participantMemberIds) || participantMemberIds.length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'At least one participant must be included in the split.' },
      });
    }

    // Verify all participants and payer exist in group
    const groupMembersRes = await query(
      'SELECT id FROM group_members WHERE group_id = $1;',
      [id]
    );
    const validMemberIds = new Set(groupMembersRes.rows.map((r) => r.id));

    if (!validMemberIds.has(payerMemberId)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Specified payer is not a member of this group.' },
      });
    }

    for (const pId of participantMemberIds) {
      if (!validMemberIds.has(pId)) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: `Participant ${pId} is not a member of this group.` },
        });
      }
    }

    // Compute Equal Split with deterministic remainder distribution
    const splitShares = splitEqual(paise, participantMemberIds.length);

    const expenseId = `se_${crypto.randomUUID()}`;
    const dateStr = expenseDate && /^\d{4}-\d{2}-\d{2}$/.test(expenseDate)
      ? expenseDate
      : new Date().toISOString().slice(0, 10);

    let resolvedCategoryName = categoryName;
    if (categoryId) {
      const catRes = await query('SELECT name FROM categories WHERE id = $1;', [categoryId]);
      if (catRes.rows.length > 0) {
        resolvedCategoryName = catRes.rows[0].name;
      }
    }

    // Atomically persist shared expense, payer, and all allocations
    await withTransaction(async (client) => {
      // 1. Insert Shared Expense
      await client.query(
        `INSERT INTO shared_expenses (
          id, group_id, title, total_amount_paise, category_id, category_name,
          expense_date, created_by_user_id, split_method
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'equal');`,
        [expenseId, id, title.trim(), paise, categoryId || null, resolvedCategoryName, dateStr, userId]
      );

      // 2. Insert Payer
      const payerId = `sep_${crypto.randomUUID()}`;
      await client.query(
        `INSERT INTO shared_expense_payers (id, expense_id, member_id, amount_paise)
         VALUES ($1, $2, $3, $4);`,
        [payerId, expenseId, payerMemberId, paise]
      );

      // 3. Insert Allocations
      for (let i = 0; i < participantMemberIds.length; i++) {
        const allocId = `sea_${crypto.randomUUID()}`;
        const pMemberId = participantMemberIds[i];
        const shareAmount = splitShares[i];

        await client.query(
          `INSERT INTO shared_expense_allocations (id, expense_id, member_id, amount_paise)
           VALUES ($1, $2, $3, $4);`,
          [allocId, expenseId, pMemberId, shareAmount]
        );
      }

      // Update group updated_at
      await client.query('UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;', [id]);
    });

    res.status(201).json({
      success: true,
      expenseId,
      message: 'Group expense added successfully.',
    });
  } catch (err) {
    next(err);
  }
});
