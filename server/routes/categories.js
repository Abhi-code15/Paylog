import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

// List Categories
categoriesRouter.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, type, icon, color
       FROM categories
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY type ASC, name ASC;`,
      [req.session.userId]
    );

    res.status(200).json({ categories: result.rows });
  } catch (err) {
    next(err);
  }
});

// Create Custom Category
categoriesRouter.post('/', async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Category name is required.' },
      });
    }

    const catType = type === 'income' ? 'income' : 'expense';
    const catIcon = icon && typeof icon === 'string' ? icon.trim() : 'Tag';
    const catColor = color && typeof color === 'string' ? color.trim() : '#1E40AF';
    const catId = `cat_${crypto.randomUUID()}`;

    const insertRes = await query(
      `INSERT INTO categories (id, user_id, name, type, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, type, icon, color;`,
      [catId, req.session.userId, name.trim(), catType, catIcon, catColor]
    );

    res.status(201).json({ category: insertRes.rows[0] });
  } catch (err) {
    next(err);
  }
});
