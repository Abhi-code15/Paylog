import dotenv from 'dotenv';
dotenv.config();

const env = (process.env.NODE_ENV || 'development').toLowerCase();
const isProduction = env === 'production';
const isTest = env === 'test';

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (isProduction) {
    if (!secret || secret.length < 32) {
      throw new Error(
        'FATAL: In production, SESSION_SECRET environment variable must be at least 32 characters long.'
      );
    }
    return secret;
  }
  return secret || 'dev-session-secret-paylog-local-development-only-2026-min-32-chars';
}

export const config = {
  env,
  isProduction,
  isTest,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  session: {
    secret: getSessionSecret(),
    cookieName: 'paylog.sid',
    maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres@127.0.0.1:5433/paylog',
  },
  demo: {
    allowDemoMode: !isProduction || process.env.ALLOW_DEMO_MODE === 'true',
  },
  security: {
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMaxAuthRequests: 50,
  },
};
