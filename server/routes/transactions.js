import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { toPaise } from '../services/moneyService.js';

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

// 1. List Transactions with search, filter, and aggregate totals
transactionsRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const {
      search,
      type,
      categoryId,
      paymentMethod,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    const conditions = ['user_id = $1'];
    const params = [userId];
    let paramIndex = 2;

    if (search && typeof search === 'string' && search.trim()) {
      conditions.push(`(description ILIKE $${paramIndex} OR recipient_or_merchant ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (type && (type === 'expense' || type === 'income')) {
      conditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (categoryId && typeof categoryId === 'string' && categoryId.trim()) {
      conditions.push(`category_id = $${paramIndex}`);
      params.push(categoryId.trim());
      paramIndex++;
    }

    if (paymentMethod && ['upi_instant', 'cash', 'other'].includes(paymentMethod)) {
      conditions.push(`payment_method = $${paramIndex}`);
      params.push(paymentMethod);
      paramIndex++;
    }

    if (status && ['completed', 'pending', 'failed', 'cancelled'].includes(status)) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (startDate && typeof startDate === 'string') {
      conditions.push(`transaction_date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate && typeof endDate === 'string') {
      conditions.push(`transaction_date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Query 1: Get aggregated completed totals for this filtered query
    const totalsQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'completed' THEN amount_paise ELSE 0 END), 0) AS completed_expense_paise,
        COALESCE(SUM(CASE WHEN type = 'income' AND status = 'completed' THEN amount_paise ELSE 0 END), 0) AS completed_income_paise,
        COUNT(*) AS total_count
      FROM personal_transactions
      WHERE ${whereClause};
    `;
    const totalsRes = await query(totalsQuery, params);

    // Query 2: Get paginated transaction list
    const listParams = [...params, parseInt(limit, 10) || 50, parseInt(offset, 10) || 0];
    const listQuery = `
      SELECT
        id, amount_paise, type, description, category_id, category_name,
        transaction_date, payment_method, recipient_or_merchant, notes,
        status, confirmation_source, payment_intent_id, created_at
      FROM personal_transactions
      WHERE ${whereClause}
      ORDER BY transaction_date DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    const listRes = await query(listQuery, listParams);

    const totals = totalsRes.rows[0];

    res.status(200).json({
      transactions: listRes.rows.map((row) => ({
        id: row.id,
        amountPaise: Number(row.amount_paise),
        type: row.type,
        description: row.description,
        categoryId: row.category_id,
        categoryName: row.category_name,
        transactionDate: row.transaction_date instanceof Date
          ? row.transaction_date.toISOString().slice(0, 10)
          : String(row.transaction_date).slice(0, 10),
        paymentMethod: row.payment_method,
        recipientOrMerchant: row.recipient_or_merchant,
        notes: row.notes,
        status: row.status,
        confirmationSource: row.confirmation_source,
        paymentIntentId: row.payment_intent_id,
        createdAt: row.created_at,
      })),
      totalCount: parseInt(totals.total_count, 10) || 0,
      completedExpensePaise: Number(totals.completed_expense_paise) || 0,
      completedIncomePaise: Number(totals.completed_income_paise) || 0,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Create Personal Transaction
transactionsRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const {
      amount,
      amountPaise: explicitPaise,
      type = 'expense',
      description,
      categoryId,
      categoryName,
      transactionDate,
      paymentMethod = 'cash',
      recipientOrMerchant,
      notes,
      confirmationSource = 'manual',
      paymentIntentId,
    } = req.body;

    let paise;
    if (explicitPaise !== undefined && explicitPaise !== null) {
      paise = parseInt(explicitPaise, 10);
      if (!Number.isInteger(paise) || paise <= 0) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Amount in paise must be a positive integer.' },
        });
      }
    } else {
      paise = toPaise(amount);
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Description is required.' },
      });
    }

    const validTypes = ['expense', 'income'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Type must be either expense or income.' },
      });
    }

    const validMethods = ['upi_instant', 'cash', 'other'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Payment method must be upi_instant, cash, or other.' },
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const dateStr = transactionDate && dateRegex.test(transactionDate)
      ? transactionDate
      : new Date().toISOString().slice(0, 10);

    // Resolve category name if missing
    let resolvedCategoryName = categoryName || 'Other';
    if (categoryId && (!categoryName || categoryName === 'Other')) {
      const catRes = await query('SELECT name FROM categories WHERE id = $1;', [categoryId]);
      if (catRes.rows.length > 0) {
        resolvedCategoryName = catRes.rows[0].name;
      }
    }

    const txId = `tx_${crypto.randomUUID()}`;

    const insertRes = await query(
      `INSERT INTO personal_transactions (
        id, user_id, amount_paise, type, description, category_id, category_name,
        transaction_date, payment_method, recipient_or_merchant, notes,
        status, confirmation_source, payment_intent_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'completed', $12, $13)
      RETURNING *;`,
      [
        txId,
        userId,
        paise,
        type,
        description.trim(),
        categoryId || null,
        resolvedCategoryName,
        dateStr,
        paymentMethod,
        recipientOrMerchant?.trim() || null,
        notes?.trim() || null,
        confirmationSource,
        paymentIntentId || null,
      ]
    );

    const row = insertRes.rows[0];

    res.status(201).json({
      transaction: {
        id: row.id,
        amountPaise: Number(row.amount_paise),
        type: row.type,
        description: row.description,
        categoryId: row.category_id,
        categoryName: row.category_name,
        transactionDate: row.transaction_date instanceof Date
          ? row.transaction_date.toISOString().slice(0, 10)
          : String(row.transaction_date).slice(0, 10),
        paymentMethod: row.payment_method,
        recipientOrMerchant: row.recipient_or_merchant,
        notes: row.notes,
        status: row.status,
        confirmationSource: row.confirmation_source,
        paymentIntentId: row.payment_intent_id,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 3. Delete Personal Transaction
transactionsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const delRes = await query(
      'DELETE FROM personal_transactions WHERE id = $1 AND user_id = $2 RETURNING id;',
      [id, userId]
    );

    if (delRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Transaction not found or not authorized.' },
      });
    }

    res.status(200).json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (err) {
    next(err);
  }
});
