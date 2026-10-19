import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { validateUpiId } from '../services/paymentService.js';

export const profileRouter = Router();

profileRouter.use(requireAuth);

// Get Profile
profileRouter.get('/', async (req, res, next) => {
  try {
    const userRes = await query(
      `SELECT id, name, email, upi_id, currency, monthly_budget_paise, theme_preference, is_demo, created_at
       FROM users WHERE id = $1;`,
      [req.session.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User profile not found.' },
      });
    }

    const user = userRes.rows[0];
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        upiId: user.upi_id,
        currency: user.currency,
        monthlyBudgetPaise: user.monthly_budget_paise !== null ? Number(user.monthly_budget_paise) : null,
        themePreference: user.theme_preference,
        isDemo: user.is_demo,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Update Profile & Settings
profileRouter.put('/', async (req, res, next) => {
  try {
    const { name, upiId, monthlyBudgetPaise, themePreference } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Display name cannot be empty.' },
      });
    }

    let cleanUpiId = null;
    if (upiId && typeof upiId === 'string' && upiId.trim()) {
      cleanUpiId = upiId.trim();
      if (!validateUpiId(cleanUpiId)) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid UPI ID format (expected username@bank).' },
        });
      }
    }

    let budgetPaise = null;
    if (monthlyBudgetPaise !== undefined && monthlyBudgetPaise !== null && monthlyBudgetPaise !== '') {
      const parsedBudget = Number(monthlyBudgetPaise);
      if (!Number.isFinite(parsedBudget) || parsedBudget < 0) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Monthly budget must be a positive amount or zero.' },
        });
      }
      budgetPaise = Math.round(parsedBudget);
    }

    const validTheme = themePreference === 'dark' ? 'dark' : 'light';

    const updateRes = await query(
      `UPDATE users
       SET name = $1, upi_id = $2, monthly_budget_paise = $3, theme_preference = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, email, upi_id, currency, monthly_budget_paise, theme_preference, is_demo;`,
      [name.trim(), cleanUpiId, budgetPaise, validTheme, req.session.userId]
    );

    const updated = updateRes.rows[0];

    res.status(200).json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        upiId: updated.upi_id,
        currency: updated.currency,
        monthlyBudgetPaise: updated.monthly_budget_paise !== null ? Number(updated.monthly_budget_paise) : null,
        themePreference: updated.theme_preference,
        isDemo: updated.is_demo,
      },
    });
  } catch (err) {
    next(err);
  }
});
