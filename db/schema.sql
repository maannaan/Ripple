-- Ripple operational database schema (Scenario A demo)

CREATE TABLE products (
    product_id   INTEGER PRIMARY KEY,
    sku          TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL,
    supplier     TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE purchase_orders (
    po_id        INTEGER PRIMARY KEY,
    supplier     TEXT NOT NULL,
    product_id   INTEGER NOT NULL REFERENCES products (product_id),
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    status       TEXT NOT NULL
);

CREATE TABLE shipments (
    shipment_id      INTEGER PRIMARY KEY,
    po_id            INTEGER REFERENCES purchase_orders (po_id),
    product_id       INTEGER NOT NULL REFERENCES products (product_id),
    quantity         INTEGER NOT NULL CHECK (quantity > 0),
    status           TEXT NOT NULL,
    needs_remapping  BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE customer_orders (
    order_id     INTEGER PRIMARY KEY,
    product_id   INTEGER NOT NULL REFERENCES products (product_id),
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    status       TEXT NOT NULL,
    region       TEXT NOT NULL
);

CREATE TABLE pricing_rules (
    rule_id      INTEGER PRIMARY KEY,
    product_id   INTEGER NOT NULL REFERENCES products (product_id),
    price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    region       TEXT NOT NULL
);

CREATE INDEX idx_purchase_orders_product_id ON purchase_orders (product_id);
CREATE INDEX idx_shipments_product_id ON shipments (product_id);
CREATE INDEX idx_customer_orders_product_id ON customer_orders (product_id);
CREATE INDEX idx_pricing_rules_product_id ON pricing_rules (product_id);

CREATE TABLE audit_log (
    audit_id     SERIAL PRIMARY KEY,
    action       TEXT NOT NULL,
    old_sku      TEXT NOT NULL,
    new_sku      TEXT NOT NULL,
    product_id   INTEGER REFERENCES products (product_id),
    actor        TEXT,
    job_id       INTEGER,
    changes_json JSONB NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE migration_jobs (
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

CREATE TABLE migration_steps (
    step_id          SERIAL PRIMARY KEY,
    job_id           INTEGER NOT NULL REFERENCES migration_jobs (job_id) ON DELETE CASCADE,
    step_type        TEXT NOT NULL,
    entity_id        TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending',
    external_id      TEXT,
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_migration_jobs_status ON migration_jobs (status);
CREATE INDEX idx_migration_steps_job_id ON migration_steps (job_id);
