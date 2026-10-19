import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';

export const friendsRouter = Router();

friendsRouter.use(requireAuth);

// 1. List Accepted Friends and Pending Requests
friendsRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;

    // Accepted Friends (where user is either user_id or friend_user_id)
    const acceptedRes = await query(
      `SELECT fc.id, fc.created_at,
              CASE WHEN fc.user_id = $1 THEN u2.id ELSE u1.id END AS friend_id,
              CASE WHEN fc.user_id = $1 THEN u2.name ELSE u1.name END AS friend_name,
              CASE WHEN fc.user_id = $1 THEN u2.email ELSE u1.email END AS friend_email,
              CASE WHEN fc.user_id = $1 THEN u2.upi_id ELSE u1.upi_id END AS friend_upi_id
       FROM friend_connections fc
       JOIN users u1 ON u1.id = fc.user_id
       JOIN users u2 ON u2.id = fc.friend_user_id
       WHERE (fc.user_id = $1 OR fc.friend_user_id = $1) AND fc.status = 'accepted'
       ORDER BY fc.created_at DESC;`,
      [userId]
    );

    // Incoming Pending Requests (someone sent to me)
    const incomingRes = await query(
      `SELECT fc.id, fc.created_at, u.id AS requester_id, u.name AS requester_name, u.email AS requester_email
       FROM friend_connections fc
       JOIN users u ON u.id = fc.user_id
       WHERE fc.friend_user_id = $1 AND fc.status = 'pending'
       ORDER BY fc.created_at DESC;`,
      [userId]
    );

    // Outgoing Pending Requests (I sent to someone)
    const outgoingRes = await query(
      `SELECT fc.id, fc.created_at, u.id AS recipient_id, u.name AS recipient_name, u.email AS recipient_email
       FROM friend_connections fc
       JOIN users u ON u.id = fc.friend_user_id
       WHERE fc.user_id = $1 AND fc.status = 'pending'
       ORDER BY fc.created_at DESC;`,
      [userId]
    );

    res.status(200).json({
      friends: acceptedRes.rows.map((r) => ({
        connectionId: r.id,
        id: r.friend_id,
        name: r.friend_name,
        email: r.friend_email,
        upiId: r.friend_upi_id,
        createdAt: r.created_at,
      })),
      incomingRequests: incomingRes.rows,
      outgoingRequests: outgoingRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Send Friend Request by Email
friendsRouter.post('/request', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { emailOrUsername } = req.body;

    if (!emailOrUsername || typeof emailOrUsername !== 'string' || !emailOrUsername.trim()) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email is required to find a friend.' },
      });
    }

    const searchTarget = emailOrUsername.trim().toLowerCase();

    // Look up registered user
    const targetRes = await query(
      'SELECT id, name, email FROM users WHERE email = $1;',
      [searchTarget]
    );

    if (targetRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No registered Paylog user found with this email.' },
      });
    }

    const targetUser = targetRes.rows[0];

    // Prevent self-request
    if (targetUser.id === userId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'You cannot send a friend request to yourself.' },
      });
    }

    // Check existing relationship in either direction
    const existing = await query(
      `SELECT id, status, user_id FROM friend_connections
       WHERE (user_id = $1 AND friend_user_id = $2)
          OR (user_id = $2 AND friend_user_id = $1);`,
      [userId, targetUser.id]
    );

    if (existing.rows.length > 0) {
      const rel = existing.rows[0];
      if (rel.status === 'accepted') {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'You are already friends with this user.' },
        });
      }
      if (rel.status === 'pending') {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'A pending friend request already exists between you.' },
        });
      }
    }

    const connectionId = `fc_${crypto.randomUUID()}`;

    await query(
      `INSERT INTO friend_connections (id, user_id, friend_user_id, status)
       VALUES ($1, $2, $3, 'pending');`,
      [connectionId, userId, targetUser.id]
    );

    res.status(201).json({
      success: true,
      message: `Friend request sent to ${targetUser.name}.`,
    });
  } catch (err) {
    next(err);
  }
});

// 3. Respond to Incoming Friend Request (Accept / Decline)
friendsRouter.post('/requests/:id/respond', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const { action } = req.body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Action must be accept or decline.' },
      });
    }

    const targetStatus = action === 'accept' ? 'accepted' : 'rejected';

    const updateRes = await query(
      `UPDATE friend_connections
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND friend_user_id = $3 AND status = 'pending'
       RETURNING id, status;`,
      [targetStatus, id, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Pending request not found or not authorized.' },
      });
    }

    res.status(200).json({
      success: true,
      status: targetStatus,
      message: `Friend request ${action}ed.`,
    });
  } catch (err) {
    next(err);
  }
});
