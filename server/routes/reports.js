import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { calculateBudgetStatus, calculateNetCashFlow, formatInr } from '../services/moneyService.js';
import { generateCsv } from '../utils/csv.js';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

// 1. Monthly Financial Summary & Analytics
reportsRouter.get('/summary', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);

    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    // Last day of month
    const endOfMonthDate = new Date(year, month, 0);
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonthDate.getDate()).padStart(2, '0')}`;

    // 1. Get user profile for budget
    const userRes = await query(
      'SELECT monthly_budget_paise FROM users WHERE id = $1;',
      [userId]
    );
    const budgetPaise = userRes.rows[0]?.monthly_budget_paise !== null
      ? Number(userRes.rows[0]?.monthly_budget_paise)
      : null;

    // 2. Completed income & expenses for this month
    const totalsRes = await query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END), 0) AS completed_expense_paise,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END), 0) AS completed_income_paise
       FROM personal_transactions
       WHERE user_id = $1 AND status = 'completed'
         AND transaction_date >= $2 AND transaction_date <= $3;`,
      [userId, startOfMonth, endOfMonth]
    );

    const completedExpensePaise = Number(totalsRes.rows[0].completed_expense_paise) || 0;
    const completedIncomePaise = Number(totalsRes.rows[0].completed_income_paise) || 0;

    const netCashFlowPaise = calculateNetCashFlow(completedIncomePaise, completedExpensePaise);
    const budgetStatus = calculateBudgetStatus(budgetPaise, completedExpensePaise);

    // 3. Category Breakdown for this month (expenses only)
    const categoryRes = await query(
      `SELECT category_name, COALESCE(SUM(amount_paise), 0) AS amount_paise
       FROM personal_transactions
       WHERE user_id = $1 AND status = 'completed' AND type = 'expense'
         AND transaction_date >= $2 AND transaction_date <= $3
       GROUP BY category_name
       ORDER BY amount_paise DESC;`,
      [userId, startOfMonth, endOfMonth]
    );

    const categoryBreakdown = categoryRes.rows.map((row) => {
      const amount = Number(row.amount_paise);
      const percentage = completedExpensePaise > 0
        ? Math.round((amount / completedExpensePaise) * 1000) / 10
        : 0;
      return {
        categoryName: row.category_name,
        amountPaise: amount,
        percentage,
      };
    });

    // 4. Six-Month Trend (expenses & income for past 6 months)
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

    res.status(200).json({
      month,
      year,
      completedExpensePaise,
      completedIncomePaise,
      netCashFlowPaise,
      monthlyBudgetPaise: budgetPaise,
      remainingBudgetPaise: budgetStatus.remainingPaise,
      isOverspent: budgetStatus.isOverspent,
      budgetUtilizationPercent: budgetStatus.utilizationPercent,
      categoryBreakdown,
      sixMonthTrend: trendRes.rows.map((r) => ({
        monthKey: r.month_key,
        expensePaise: Number(r.expense_paise),
        incomePaise: Number(r.income_paise),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// 2. Export Sanitized CSV
reportsRouter.get('/export-csv', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { startDate, endDate } = req.query;

    const conditions = ['user_id = $1', "status = 'completed'"];
    const params = [userId];
    let pIdx = 2;

    if (startDate && typeof startDate === 'string') {
      conditions.push(`transaction_date >= $${pIdx}`);
      params.push(startDate);
      pIdx++;
    }
    if (endDate && typeof endDate === 'string') {
      conditions.push(`transaction_date <= $${pIdx}`);
      params.push(endDate);
      pIdx++;
    }

    const txRes = await query(
      `SELECT transaction_date, type, description, category_name, payment_method, recipient_or_merchant, amount_paise, notes
       FROM personal_transactions
       WHERE ${conditions.join(' AND ')}
       ORDER BY transaction_date DESC, created_at DESC;`,
      params
    );

    const headers = [
      'Date',
      'Type',
      'Description',
      'Category',
      'Payment Method',
      'Merchant / Payee',
      'Amount (INR)',
      'Notes',
    ];

    const rows = txRes.rows.map((r) => [
      r.transaction_date instanceof Date ? r.transaction_date.toISOString().slice(0, 10) : String(r.transaction_date).slice(0, 10),
      r.type.toUpperCase(),
      r.description,
      r.category_name,
      r.payment_method === 'upi_instant' ? 'UPI Instant' : r.payment_method === 'cash' ? 'Cash' : 'Other',
      r.recipient_or_merchant || '',
      formatInr(Number(r.amount_paise), false),
      r.notes || '',
    ]);

    const csvContent = generateCsv(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="paylog_transactions.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});
