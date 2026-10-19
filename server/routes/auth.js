import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { seedUserCategories } from '../services/categoryService.js';
import { config } from '../config.js';

export const authRouter = Router();

// 1. Register with Email and Password
authRouter.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Name is required.' },
      });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Valid email is required.' },
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters long.' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing email
    const existing = await query('SELECT id FROM users WHERE email = $1;', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'An account with this email already exists.' },
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = `usr_${crypto.randomUUID()}`;

    const insertRes = await query(
      `INSERT INTO users (id, name, email, password_hash, monthly_budget_paise, theme_preference)
       VALUES ($1, $2, $3, $4, NULL, 'light')
       RETURNING id, name, email, upi_id, currency, monthly_budget_paise, theme_preference, is_demo;`,
      [userId, name.trim(), normalizedEmail, passwordHash]
    );

    const user = insertRes.rows[0];

    // Seed default categories for this user
    await seedUserCategories(userId);

    // Establish session
    req.session.userId = user.id;

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        upiId: user.upi_id,
        currency: user.currency,
        monthlyBudgetPaise: user.monthly_budget_paise ? Number(user.monthly_budget_paise) : null,
        themePreference: user.theme_preference,
        isDemo: user.is_demo,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 2. Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRes = await query(
      `SELECT id, name, email, password_hash, upi_id, currency, monthly_budget_paise, theme_preference, is_demo
       FROM users WHERE email = $1;`,
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' },
      });
    }

    const user = userRes.rows[0];

    // Check password
    if (!user.password_hash) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid credentials.' },
      });
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' },
      });
    }

    req.session.userId = user.id;

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        upiId: user.upi_id,
        currency: user.currency,
        monthlyBudgetPaise: user.monthly_budget_paise ? Number(user.monthly_budget_paise) : null,
        themePreference: user.theme_preference,
        isDemo: user.is_demo,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 3. Current Session User
authRouter.get('/me', async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(200).json({ user: null });
    }

    const userRes = await query(
      `SELECT id, name, email, upi_id, currency, monthly_budget_paise, theme_preference, is_demo
       FROM users WHERE id = $1;`,
      [req.session.userId]
    );

    if (userRes.rows.length === 0) {
      req.session.destroy(() => {});
      return res.status(200).json({ user: null });
    }

    const user = userRes.rows[0];
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        upiId: user.upi_id,
        currency: user.currency,
        monthlyBudgetPaise: user.monthly_budget_paise ? Number(user.monthly_budget_paise) : null,
        themePreference: user.theme_preference,
        isDemo: user.is_demo,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 4. Logout
authRouter.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie(config.session.cookieName);
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  });
});

// 5. Isolated Demo Session
authRouter.post('/demo', async (req, res, next) => {
  try {
    const demoEmail = 'demo@paylog.local';
    let demoUser = await query('SELECT id, name, email, upi_id, currency, monthly_budget_paise, theme_preference, is_demo FROM users WHERE email = $1;', [demoEmail]);

    if (demoUser.rows.length === 0) {
      const demoId = 'usr_demo_fictional';
      const insert = await query(
        `INSERT INTO users (id, name, email, password_hash, upi_id, monthly_budget_paise, theme_preference, is_demo)
         VALUES ($1, 'Abhishek (Demo)', $2, NULL, 'abhishek.demo@okhdfcbank', 5000000, 'light', TRUE)
         RETURNING id, name, email, upi_id, currency, monthly_budget_paise, theme_preference, is_demo;`,
        [demoId, demoEmail]
      );
      demoUser = insert;
      await seedUserCategories(demoId);
    }

    const user = demoUser.rows[0];
    req.session.userId = user.id;

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        upiId: user.upi_id,
        currency: user.currency,
        monthlyBudgetPaise: user.monthly_budget_paise ? Number(user.monthly_budget_paise) : null,
        themePreference: user.theme_preference,
        isDemo: true,
      },
    });
  } catch (err) {
    next(err);
  }
});
