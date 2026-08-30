-- Production migration jobs + audit job linkage

CREATE TABLE IF NOT EXISTS migration_jobs (
    job_id           SERIAL PRIMARY KEY,
    status           TEXT NOT NULL,
    old_sku          TEXT NOT NULL,
    new_sku          TEXT NOT NULL,
    plan_json        JSONB NOT NULL,
    simulation_json  JSONB,
    created_by       TEXT,
    approved_by      TEXT,
    idempotency_key  TEXT UNIQUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS migration_steps (
    step_id          SERIAL PRIMARY KEY,
    job_id           INTEGER NOT NULL REFERENCES migration_jobs (job_id) ON DELETE CASCADE,
    step_type        TEXT NOT NULL,
    entity_id        TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending',
    external_id      TEXT,
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_migration_jobs_status ON migration_jobs (status);
CREATE INDEX IF NOT EXISTS idx_migration_steps_job_id ON migration_steps (job_id);

ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS job_id INTEGER REFERENCES migration_jobs (job_id);
