#!/usr/bin/env bash
# Apply idempotent SQL migrations to running Docker Postgres.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

POSTGRES_USER="${POSTGRES_USER:-ripple}"
POSTGRES_DB="${POSTGRES_DB:-ripple}"
MIGRATIONS_DIR="${ROOT}/db/migrations"

echo "Waiting for Postgres..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1 && \
     docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1" >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo "Postgres did not become ready. Start with: npm run db:up"
    exit 1
  fi
  sleep 1
done

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "No migrations directory at ${MIGRATIONS_DIR}"
  exit 0
fi

for migration in "$MIGRATIONS_DIR"/*.sql; do
  if [[ ! -f "$migration" ]]; then
    continue
  fi
  echo "Applying $(basename "$migration")..."
  for attempt in $(seq 1 10); do
    if docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 < "$migration"; then
      break
    fi
    if [[ "$attempt" -eq 10 ]]; then
      echo "FAIL: migration $(basename "$migration") after 10 attempts"
      exit 1
    fi
    sleep 1
  done
done

echo "PASS: migrations applied."
