-- Phase 5: audit log + shipment remapping flags (idempotent)

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS needs_remapping BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS audit_log (
    audit_id     SERIAL PRIMARY KEY,
    action       TEXT NOT NULL,
    old_sku      TEXT NOT NULL,
    new_sku      TEXT NOT NULL,
    product_id   INTEGER REFERENCES products (product_id),
    actor        TEXT,
    changes_json JSONB NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
