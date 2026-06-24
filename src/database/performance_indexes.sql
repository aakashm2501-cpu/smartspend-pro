CREATE INDEX IF NOT EXISTS idx_transactions_user_cycle_status
ON transactions(user_id, cycle_id, status);

CREATE INDEX IF NOT EXISTS idx_bills_user_archived
ON bills(user_id, is_archived);

CREATE INDEX IF NOT EXISTS idx_goals_user_archived
ON goals(user_id, is_archived);

CREATE INDEX IF NOT EXISTS idx_debts_user_archived
ON debts(user_id, is_archived);
-- Schema aligned and verified with live production DB on June 2026
