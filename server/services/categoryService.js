import crypto from 'crypto';
import { query } from '../db/pool.js';

export const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'expense', icon: 'Utensils', color: '#EF4444' },
  { name: 'Groceries', type: 'expense', icon: 'ShoppingBag', color: '#F59E0B' },
  { name: 'Transport', type: 'expense', icon: 'Car', color: '#3B82F6' },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingCart', color: '#8B5CF6' },
  { name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#10B981' },
  { name: 'Rent', type: 'expense', icon: 'Home', color: '#6366F1' },
  { name: 'Health', type: 'expense', icon: 'HeartPulse', color: '#EC4899' },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#14B8A6' },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#F97316' },
  { name: 'Travel', type: 'expense', icon: 'Plane', color: '#06B6D4' },
  { name: 'Personal Care', type: 'expense', icon: 'Smile', color: '#84CC16' },
  { name: 'Other', type: 'expense', icon: 'MoreHorizontal', color: '#64748B' },
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10B981' },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#3B82F6' },
  { name: 'Business', type: 'income', icon: 'Building2', color: '#8B5CF6' },
  { name: 'Investments', type: 'income', icon: 'TrendingUp', color: '#F59E0B' },
  { name: 'Gifts & Transfers', type: 'income', icon: 'Gift', color: '#EC4899' },
  { name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#64748B' },
];

/**
 * Seeds default categories for a new user if they don't already have them.
 * @param {string} userId
 * @param {import('pg').PoolClient|import('pg').Pool} [dbClient]
 */
export async function seedUserCategories(userId, dbClient = null) {
  const runner = dbClient || { query };
  for (const cat of DEFAULT_CATEGORIES) {
    const id = `cat_${crypto.randomUUID()}`;
    await runner.query(
      `INSERT INTO categories (id, user_id, name, type, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING;`,
      [id, userId, cat.name, cat.type, cat.icon, cat.color]
    );
  }
}
