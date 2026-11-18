import pg from 'pg';
import dns from 'dns/promises';
import { config } from '../config.js';

const { Pool } = pg;

export async function buildPoolConfig(rawUrl) {
  if (!rawUrl) return {};
  try {
    const parsed = new URL(rawUrl);
    const isRemote =
      parsed.hostname.includes('.render.com') ||
      parsed.hostname.includes('neon.tech') ||
      parsed.hostname.includes('supabase.co') ||
      parsed.hostname.includes('aws.com') ||
      config.isProduction;
    const isLocal = parsed.hostname.includes('127.0.0.1') || parsed.hostname.includes('localhost');

    let host = parsed.hostname;
    // On systems where local DNS resolver appends root-server entries (e.g. Windows Node happy eyeballs),
    // resolve to first IPv4 address directly while preserving SNI servername for TLS.
    if (isRemote && !isLocal && parsed.hostname.includes('neon.tech')) {
      try {
        const addresses = await dns.resolve4(parsed.hostname);
        if (addresses && addresses.length > 0) {
          host = addresses[0];
        }
      } catch (dnsErr) {
        // Fall back to original hostname
      }
    }

    if (isRemote && !isLocal) {
      return {
        host,
        port: parseInt(parsed.port || '5432', 10),
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000,
        ssl: {
          rejectUnauthorized: false,
          servername: parsed.hostname,
        },
      };
    }
  } catch (err) {
    // Fall back to connectionString
  }

  return {
    connectionString: rawUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

const poolConfig = await buildPoolConfig(config.database.url);
export const pool = new Pool(poolConfig);

export async function createDirectPool() {
  const directConfig = await buildPoolConfig(config.database.unpooledUrl || config.database.url);
  return new Pool(directConfig);
}

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Unexpected Error]:', err);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (!config.isProduction && duration > 500) {
    console.warn(`[Slow Query ${duration}ms]: ${text.slice(0, 100)}`);
  }
  return res;
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}
