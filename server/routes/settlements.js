import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { toPaise } from '../services/moneyService.js';

export const settlementsRouter = Router();

settlementsRouter.use(requireAuth);

// Record a settlement / repayment
settlementsRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const {
      groupId,
      fromMemberId,
      toMemberId,
      amount,
      amountPaise: explicitPaise,
      settlementDate,
      paymentMethod = 'upi',
      notes,
    } = req.body;

    if (!groupId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Group ID is required.' },
      });
    }

    // Verify current user belongs to group
    const membershipCheck = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2;',
      [groupId, userId]
    );

    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You must be a member of this group to record a settlement.' },
      });
    }

    if (!fromMemberId || !toMemberId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Both payer and recipient members are required.' },
      });
    }

    if (fromMemberId === toMemberId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Payer and recipient cannot be the same member.' },
      });
    }

    let paise;
    if (explicitPaise !== undefined && explicitPaise !== null) {
      paise = parseInt(explicitPaise, 10);
    } else {
      paise = toPaise(amount);
    }

    // Verify members exist in this group
    const membersRes = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND id IN ($2, $3);',
      [groupId, fromMemberId, toMemberId]
    );

    if (membersRes.rows.length < 2) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'One or both members do not belong to this group.' },
      });
    }

    const dateStr = settlementDate && /^\d{4}-\d{2}-\d{2}$/.test(settlementDate)
      ? settlementDate
      : new Date().toISOString().slice(0, 10);

    const settlementId = `stl_${crypto.randomUUID()}`;

    const insertRes = await query(
      `INSERT INTO settlements (
        id, group_id, from_member_id, to_member_id, amount_paise,
        settlement_date, payment_method, status, notes, recorded_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8, $9)
      RETURNING *;`,
      [
        settlementId,
        groupId,
        fromMemberId,
        toMemberId,
        paise,
        dateStr,
        paymentMethod,
        notes?.trim() || null,
        userId,
      ]
    );

    // Update group updated_at
    await query('UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;', [groupId]);

    res.status(201).json({
      settlement: {
        ...insertRes.rows[0],
        amountPaise: Number(insertRes.rows[0].amount_paise),
      },
    });
  } catch (err) {
    next(err);
  }
});
