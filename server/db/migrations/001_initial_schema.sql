-- Migration 001: Initial Core Schema
-- All monetary amounts are strictly in integer Paise (1 INR = 100 Paise)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    upi_id VARCHAR(100),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    monthly_budget_paise BIGINT CHECK (monthly_budget_paise IS NULL OR monthly_budget_paise >= 0),
    theme_preference VARCHAR(20) NOT NULL DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark')),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Express Session Table (connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
    "sid" VARCHAR NOT NULL COLLATE "default",
    "sess" JSON NOT NULL,
    "expire" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
    icon VARCHAR(64) NOT NULL DEFAULT 'Tag',
    color VARCHAR(30) NOT NULL DEFAULT '#1E40AF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id, type);

-- 4. Payment Intents Table (Persisted UPI attempts)
CREATE TABLE IF NOT EXISTS payment_intents (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0 AND amount_paise <= 1000000000),
    recipient_upi_id VARCHAR(120),
    recipient_name VARCHAR(120),
    note VARCHAR(150),
    payment_path VARCHAR(30) NOT NULL DEFAULT 'upi_intent' CHECK (payment_path IN ('upi_intent', 'qr_scan', 'manual')),
    launch_status VARCHAR(30) NOT NULL DEFAULT 'launched' CHECK (launch_status IN ('launched', 'launch_failed', 'not_attempted')),
    status VARCHAR(30) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'completed', 'failed', 'cancelled', 'pending')),
    idempotency_key VARCHAR(100) UNIQUE,
    previous_attempt_id VARCHAR(64) REFERENCES payment_intents(id) ON DELETE SET NULL,
    outcome_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_intents_user_status ON payment_intents(user_id, status);

-- 5. Personal Transactions Table
CREATE TABLE IF NOT EXISTS personal_transactions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0 AND amount_paise <= 1000000000),
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
    description VARCHAR(255) NOT NULL,
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100) NOT NULL,
    transaction_date DATE NOT NULL,
    payment_method VARCHAR(40) NOT NULL CHECK (payment_method IN ('upi_instant', 'cash', 'other')),
    recipient_or_merchant VARCHAR(120),
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'cancelled')),
    confirmation_source VARCHAR(40) NOT NULL DEFAULT 'manual' CHECK (confirmation_source IN ('manual', 'upi_intent', 'already_paid')),
    payment_intent_id VARCHAR(64) UNIQUE REFERENCES payment_intents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trans_user_date ON personal_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_trans_status ON personal_transactions(status);
