import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { query, withTransaction } from '../db/pool.js';
import { toPaise } from '../services/moneyService.js';
import { buildUpiUri, validateUpiId } from '../services/paymentService.js';

export const paymentAttemptsRouter = Router();

paymentAttemptsRouter.use(requireAuth);

// 1. Create Payment Attempt & Build UPI URI
paymentAttemptsRouter.post('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const {
      amount,
      amountPaise: explicitPaise,
      recipientUpiId,
      recipientName,
      note,
      paymentPath = 'upi_intent',
      idempotencyKey,
    } = req.body;

    let paise;
    if (explicitPaise !== undefined && explicitPaise !== null) {
      paise = parseInt(explicitPaise, 10);
    } else {
      paise = toPaise(amount);
    }

    if (!recipientUpiId || !validateUpiId(recipientUpiId)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Valid payee UPI ID is required.' },
      });
    }

    const key = idempotencyKey || `idem_${crypto.randomUUID()}`;

    // Check if this idempotency key was already submitted
    const existing = await query(
      'SELECT * FROM payment_intents WHERE idempotency_key = $1 AND user_id = $2;',
      [key, userId]
    );

    if (existing.rows.length > 0) {
      const existingAttempt = existing.rows[0];
      const uri = buildUpiUri({
        upiId: existingAttempt.recipient_upi_id,
        name: existingAttempt.recipient_name,
        amountPaise: Number(existingAttempt.amount_paise),
        note: existingAttempt.note,
      });

      return res.status(200).json({
        paymentAttempt: {
          id: existingAttempt.id,
          amountPaise: Number(existingAttempt.amount_paise),
          recipientUpiId: existingAttempt.recipient_upi_id,
          recipientName: existingAttempt.recipient_name,
          note: existingAttempt.note,
          status: existingAttempt.status,
          idempotencyKey: existingAttempt.idempotency_key,
          createdAt: existingAttempt.created_at,
        },
        upiUri: uri,
      });
    }

    const attemptId = `pi_${crypto.randomUUID()}`;

    const insertRes = await query(
      `INSERT INTO payment_intents (
        id, user_id, amount_paise, recipient_upi_id, recipient_name,
        note, payment_path, launch_status, status, idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'launched', 'created', $8)
      RETURNING *;`,
      [
        attemptId,
        userId,
        paise,
        recipientUpiId.trim(),
        recipientName?.trim() || 'Payee',
        note?.trim() || '',
        paymentPath,
        key,
      ]
    );

    const row = insertRes.rows[0];
    const upiUri = buildUpiUri({
      upiId: row.recipient_upi_id,
      name: row.recipient_name,
      amountPaise: Number(row.amount_paise),
      note: row.note,
    });

    res.status(201).json({
      paymentAttempt: {
        id: row.id,
        amountPaise: Number(row.amount_paise),
        recipientUpiId: row.recipient_upi_id,
        recipientName: row.recipient_name,
        note: row.note,
        status: row.status,
        idempotencyKey: row.idempotency_key,
        createdAt: row.created_at,
      },
      upiUri,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Report Payment Outcome (Idempotent Resolution)
paymentAttemptsRouter.post('/:id/outcome', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const {
      status, // 'successful' | 'failed_or_cancelled' | 'pending'
      categoryId,
      categoryName = 'Other',
      description = 'UPI Payment',
      transactionDate,
    } = req.body;

    const validStatuses = ['successful', 'failed_or_cancelled', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Status must be successful, failed_or_cancelled, or pending.' },
      });
    }

    const result = await withTransaction(async (client) => {
      // Fetch attempt with lock
      const attemptRes = await client.query(
        'SELECT * FROM payment_intents WHERE id = $1 AND user_id = $2 FOR UPDATE;',
        [id, userId]
      );

      if (attemptRes.rows.length === 0) {
        const err = new Error('Payment attempt not found or not authorized.');
        err.status = 404;
        err.code = 'NOT_FOUND';
        throw err;
      }

      const attempt = attemptRes.rows[0];

      // Idempotency: If already completed, find linked transaction and return it
      if (attempt.status === 'completed') {
        const txRes = await client.query(
          'SELECT * FROM personal_transactions WHERE payment_intent_id = $1;',
          [attempt.id]
        );
        return {
          paymentAttempt: { ...attempt, amount_paise: Number(attempt.amount_paise) },
          transaction: txRes.rows[0] ? {
            ...txRes.rows[0],
            amountPaise: Number(txRes.rows[0].amount_paise),
          } : null,
        };
      }

      let updatedAttemptStatus;
      let createdTransaction = null;

      if (status === 'successful') {
        updatedAttemptStatus = 'completed';

        // Check if transaction already exists for this intent
        const existingTx = await client.query(
          'SELECT * FROM personal_transactions WHERE payment_intent_id = $1;',
          [attempt.id]
        );

        if (existingTx.rows.length > 0) {
          createdTransaction = existingTx.rows[0];
        } else {
          const txId = `tx_${crypto.randomUUID()}`;
          const dateStr = transactionDate && /^\d{4}-\d{2}-\d{2}$/.test(transactionDate)
            ? transactionDate
            : new Date().toISOString().slice(0, 10);

          let resolvedCategoryName = categoryName;
          if (categoryId) {
            const catRes = await client.query('SELECT name FROM categories WHERE id = $1;', [categoryId]);
            if (catRes.rows.length > 0) {
              resolvedCategoryName = catRes.rows[0].name;
            }
          }

          const txInsert = await client.query(
            `INSERT INTO personal_transactions (
              id, user_id, amount_paise, type, description, category_id, category_name,
              transaction_date, payment_method, recipient_or_merchant, notes,
              status, confirmation_source, payment_intent_id
            ) VALUES ($1, $2, $3, 'expense', $4, $5, $6, $7, 'upi_instant', $8, $9, 'completed', 'upi_intent', $10)
            RETURNING *;`,
            [
              txId,
              userId,
              attempt.amount_paise,
              description.trim() || 'UPI Payment',
              categoryId || null,
              resolvedCategoryName || 'Other',
              dateStr,
              attempt.recipient_name || attempt.recipient_upi_id,
              attempt.note || null,
              attempt.id,
            ]
          );
          createdTransaction = txInsert.rows[0];
        }
      } else if (status === 'failed_or_cancelled') {
        updatedAttemptStatus = 'failed';
      } else {
        updatedAttemptStatus = 'pending';
      }

      const updateAttempt = await client.query(
        `UPDATE payment_intents
         SET status = $1, outcome_confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *;`,
        [updatedAttemptStatus, attempt.id]
      );

      return {
        paymentAttempt: {
          ...updateAttempt.rows[0],
          amountPaise: Number(updateAttempt.rows[0].amount_paise),
        },
        transaction: createdTransaction ? {
          ...createdTransaction,
          amountPaise: Number(createdTransaction.amount_paise),
        } : null,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// 3. List Pending/Unresolved Payment Attempts (For Dashboard Shortcut)
paymentAttemptsRouter.get('/pending', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const result = await query(
      `SELECT id, amount_paise, recipient_upi_id, recipient_name, note,
              payment_path, status, created_at
       FROM payment_intents
       WHERE user_id = $1 AND status IN ('created', 'pending')
       ORDER BY created_at DESC;`,
      [userId]
    );

    res.status(200).json({
      pendingAttempts: result.rows.map((row) => ({
        id: row.id,
        amountPaise: Number(row.amount_paise),
        recipientUpiId: row.recipient_upi_id,
        recipientName: row.recipient_name,
        note: row.note,
        paymentPath: row.payment_path,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// 4. Retry Payment Attempt (Preserves historical record, creates new linked attempt)
paymentAttemptsRouter.post('/:id/retry', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const { recipientUpiId, recipientName, note } = req.body;

    const origRes = await query(
      'SELECT * FROM payment_intents WHERE id = $1 AND user_id = $2;',
      [id, userId]
    );

    if (origRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Original payment attempt not found.' },
      });
    }

    const orig = origRes.rows[0];
    const newAttemptId = `pi_${crypto.randomUUID()}`;
    const newKey = `retry_${crypto.randomUUID()}`;

    const newUpiId = recipientUpiId && validateUpiId(recipientUpiId)
      ? recipientUpiId.trim()
      : orig.recipient_upi_id;

    const newName = recipientName?.trim() || orig.recipient_name;
    const newNote = note?.trim() || orig.note;

    const insertRes = await query(
      `INSERT INTO payment_intents (
        id, user_id, amount_paise, recipient_upi_id, recipient_name,
        note, payment_path, launch_status, status, idempotency_key, previous_attempt_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'launched', 'created', $8, $9)
      RETURNING *;`,
      [
        newAttemptId,
        userId,
        orig.amount_paise,
        newUpiId,
        newName,
        newNote,
        orig.payment_path,
        newKey,
        orig.id,
      ]
    );

    const row = insertRes.rows[0];
    const upiUri = buildUpiUri({
      upiId: row.recipient_upi_id,
      name: row.recipient_name,
      amountPaise: Number(row.amount_paise),
      note: row.note,
    });

    res.status(201).json({
      paymentAttempt: {
        id: row.id,
        amountPaise: Number(row.amount_paise),
        recipientUpiId: row.recipient_upi_id,
        recipientName: row.recipient_name,
        note: row.note,
        status: row.status,
        previousAttemptId: row.previous_attempt_id,
        createdAt: row.created_at,
      },
      upiUri,
    });
  } catch (err) {
    next(err);
  }
});
