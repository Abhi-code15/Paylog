import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { calculateBudgetStatus, calculateNetCashFlow, formatInr } from '../services/moneyService.js';
import { calculateNetBalances } from '../services/debtSimplifier.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonthDate = new Date(year, month, 0);
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonthDate.getDate()).padStart(2, '0')}`;

    // 1. User Profile / Budget
    const userRes = await query('SELECT monthly_budget_paise, name FROM users WHERE id = $1;', [userId]);
    const budgetPaise = userRes.rows[0]?.monthly_budget_paise !== null
      ? Number(userRes.rows[0]?.monthly_budget_paise)
      : null;

    // 2. Completed Spend & Income for Current Month
    const totalsRes = await query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END), 0) AS completed_expense_paise,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END), 0) AS completed_income_paise
       FROM personal_transactions
       WHERE user_id = $1 AND status = 'completed'
         AND transaction_date >= $2 AND transaction_date <= $3;`,
      [userId, startOfMonth, endOfMonth]
    );

    const monthSpentPaise = Number(totalsRes.rows[0].completed_expense_paise) || 0;
    const monthIncomePaise = Number(totalsRes.rows[0].completed_income_paise) || 0;

    const budgetStatus = calculateBudgetStatus(budgetPaise, monthSpentPaise);
    const netCashFlowPaise = calculateNetCashFlow(monthIncomePaise, monthSpentPaise);

    // 3. Category Breakdown for Current Month
    const categoryRes = await query(
      `SELECT category_name, COALESCE(SUM(amount_paise), 0) AS amount_paise
       FROM personal_transactions
       WHERE user_id = $1 AND status = 'completed' AND type = 'expense'
         AND transaction_date >= $2 AND transaction_date <= $3
       GROUP BY category_name
       ORDER BY amount_paise DESC
       LIMIT 6;`,
      [userId, startOfMonth, endOfMonth]
    );

    const categoryBreakdown = categoryRes.rows.map((row) => ({
      categoryName: row.category_name,
      amountPaise: Number(row.amount_paise),
      percentage: monthSpentPaise > 0
        ? Math.round((Number(row.amount_paise) / monthSpentPaise) * 1000) / 10
        : 0,
    }));

    // 4. Six-Month Trend
    const trendRes = await query(
      `SELECT
        TO_CHAR(transaction_date, 'YYYY-MM') AS month_key,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END), 0) AS expense_paise,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END), 0) AS income_paise
       FROM personal_transactions
       WHERE user_id = $1 AND status = 'completed'
         AND transaction_date >= CURRENT_DATE - INTERVAL '5 months'
       GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
       ORDER BY month_key ASC;`,
      [userId]
    );

    // 5. Recent 5 Transactions
    const recentRes = await query(
      `SELECT id, amount_paise, type, description, category_name, transaction_date, payment_method, status
       FROM personal_transactions
       WHERE user_id = $1
       ORDER BY transaction_date DESC, created_at DESC
       LIMIT 5;`,
      [userId]
    );

    // 6. Unresolved Pending Payments Count
    const pendingRes = await query(
      `SELECT COUNT(*) AS pending_count
       FROM payment_intents
       WHERE user_id = $1 AND status IN ('created', 'pending');`,
      [userId]
    );
    const pendingCount = parseInt(pendingRes.rows[0].pending_count, 10) || 0;

    // 7. Aggregated Shared Group Balance
    const userGroupsRes = await query(
      `SELECT g.id, gm.id AS member_id
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = $1;`,
      [userId]
    );

    let totalGroupNetPaise = 0;
    for (const ug of userGroupsRes.rows) {
      const membersRes = await query('SELECT id FROM group_members WHERE group_id = $1;', [ug.id]);
      const payersRes = await query(
        `SELECT p.member_id, p.amount_paise
         FROM shared_expense_payers p
         JOIN shared_expenses e ON e.id = p.expense_id
         WHERE e.group_id = $1;`,
        [ug.id]
      );
      const allocsRes = await query(
        `SELECT a.member_id, a.amount_paise
         FROM shared_expense_allocations a
         JOIN shared_expenses e ON e.id = a.expense_id
         WHERE e.group_id = $1;`,
        [ug.id]
      );
      const settlementsRes = await query(
        `SELECT from_member_id, to_member_id, amount_paise, status
         FROM settlements
         WHERE group_id = $1;`,
        [ug.id]
      );

      const netMap = calculateNetBalances(
        membersRes.rows,
        payersRes.rows,
        allocsRes.rows,
        settlementsRes.rows
      );
      totalGroupNetPaise += netMap.get(ug.member_id) || 0;
    }

    const sharedGroupText = totalGroupNetPaise > 0
      ? `You are owed ${formatInr(totalGroupNetPaise)}`
      : totalGroupNetPaise < 0
        ? `You owe ${formatInr(Math.abs(totalGroupNetPaise))}`
        : 'All groups settled up';

    res.status(200).json({
      monthSpentPaise,
      monthIncomePaise,
      netCashFlowPaise,
      monthlyBudgetPaise: budgetPaise,
      remainingBudgetPaise: budgetStatus.remainingPaise,
      isOverspent: budgetStatus.isOverspent,
      budgetUtilizationPercent: budgetStatus.utilizationPercent,
      sharedGroupNetPaise: totalGroupNetPaise,
      sharedGroupText,
      categoryBreakdown,
      sixMonthTrend: trendRes.rows.map((r) => ({
        monthKey: r.month_key,
        expensePaise: Number(r.expense_paise),
        incomePaise: Number(r.income_paise),
      })),
      recentTransactions: recentRes.rows.map((r) => ({
        id: r.id,
        amountPaise: Number(r.amount_paise),
        type: r.type,
        description: r.description,
        categoryName: r.category_name,
        transactionDate: r.transaction_date instanceof Date ? r.transaction_date.toISOString().slice(0, 10) : String(r.transaction_date).slice(0, 10),
        paymentMethod: r.payment_method,
        status: r.status,
      })),
      pendingPaymentsCount: pendingCount,
    });
  } catch (err) {
    next(err);
  }
});
