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

function getDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL?.trim() || 'postgresql://postgres@127.0.0.1:5433/paylog';
  try {
    const parsed = new URL(rawUrl);
    // Auto-fix Render internal hostnames when cross-region resolution fails:
    // If a bare Render internal hostname like dpg-xxxxxxxx-a is passed without a domain suffix,
    // append the Virginia cluster domain where this database is hosted.
    if (parsed.hostname && parsed.hostname.startsWith('dpg-') && !parsed.hostname.includes('.')) {
      parsed.hostname = `${parsed.hostname}.virginia-postgres.render.com`;
      return parsed.toString();
    }
  } catch (e) {
    // If not a parseable URL, return raw
  }
  return rawUrl;
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
    url: getDatabaseUrl(),
    unpooledUrl: process.env.DATABASE_URL_UNPOOLED?.trim() || getDatabaseUrl(),
  },
  neon: {
    branch: process.env.NEON_BRANCH || 'production',
    branchId: process.env.NEON_BRANCH_ID || '',
  },
  demo: {
    allowDemoMode: !isProduction || process.env.ALLOW_DEMO_MODE === 'true',
  },
  security: {
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMaxAuthRequests: 50,
  },
};
