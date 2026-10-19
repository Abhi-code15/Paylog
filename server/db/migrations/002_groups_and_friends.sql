-- Migration 002: Groups, Shared Expenses, Allocations, Settlements, and Friend Connections

-- 1. Friend Connections Table
CREATE TABLE IF NOT EXISTS friend_connections (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_friend_pair UNIQUE(user_id, friend_user_id),
    CONSTRAINT chk_diff_friends CHECK (user_id != friend_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user ON friend_connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friend_connections(friend_user_id, status);

-- 2. Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    group_type VARCHAR(30) NOT NULL DEFAULT 'friends' CHECK (group_type IN ('trip', 'apartment', 'friends', 'family', 'event', 'other')),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Group Members Table (Supports registered users AND manual offline participants)
CREATE TABLE IF NOT EXISTS group_members (
    id VARCHAR(64) PRIMARY KEY,
    group_id VARCHAR(64) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    manual_name VARCHAR(120),
    manual_email VARCHAR(255),
    manual_upi_id VARCHAR(120),
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_member_identity CHECK (user_id IS NOT NULL OR manual_name IS NOT NULL),
    CONSTRAINT uq_group_user UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- 4. Shared Expenses Table
CREATE TABLE IF NOT EXISTS shared_expenses (
    id VARCHAR(64) PRIMARY KEY,
    group_id VARCHAR(64) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    total_amount_paise BIGINT NOT NULL CHECK (total_amount_paise > 0 AND total_amount_paise <= 1000000000),
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100) NOT NULL,
    expense_date DATE NOT NULL,
    created_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    split_method VARCHAR(20) NOT NULL DEFAULT 'equal' CHECK (split_method IN ('equal', 'exact', 'percentage')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shared_expenses_group_date ON shared_expenses(group_id, expense_date DESC);

-- 5. Shared Expense Payers (Who paid what part of the total)
CREATE TABLE IF NOT EXISTS shared_expense_payers (
    id VARCHAR(64) PRIMARY KEY,
    expense_id VARCHAR(64) NOT NULL REFERENCES shared_expenses(id) ON DELETE CASCADE,
    member_id VARCHAR(64) NOT NULL REFERENCES group_members(id) ON DELETE RESTRICT,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0)
);

CREATE INDEX IF NOT EXISTS idx_payers_expense ON shared_expense_payers(expense_id);

-- 6. Shared Expense Allocations (Who owes what part of the split)
CREATE TABLE IF NOT EXISTS shared_expense_allocations (
    id VARCHAR(64) PRIMARY KEY,
    expense_id VARCHAR(64) NOT NULL REFERENCES shared_expenses(id) ON DELETE CASCADE,
    member_id VARCHAR(64) NOT NULL REFERENCES group_members(id) ON DELETE RESTRICT,
    amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0)
);

CREATE INDEX IF NOT EXISTS idx_allocations_expense ON shared_expense_allocations(expense_id);

-- 7. Settlements Table (Recorded debt repayments)
CREATE TABLE IF NOT EXISTS settlements (
    id VARCHAR(64) PRIMARY KEY,
    group_id VARCHAR(64) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    from_member_id VARCHAR(64) NOT NULL REFERENCES group_members(id) ON DELETE RESTRICT,
    to_member_id VARCHAR(64) NOT NULL REFERENCES group_members(id) ON DELETE RESTRICT,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0 AND amount_paise <= 1000000000),
    settlement_date DATE NOT NULL,
    payment_method VARCHAR(40) NOT NULL DEFAULT 'upi' CHECK (payment_method IN ('upi', 'cash', 'other')),
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending')),
    notes TEXT,
    recorded_by_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_diff_settlers CHECK (from_member_id != to_member_id)
);

CREATE INDEX IF NOT EXISTS idx_settlements_group ON settlements(group_id);
