#!/usr/bin/env bash
# Start Ripple Postgres via Docker and verify Scenario A seed data.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

POSTGRES_PORT="${POSTGRES_PORT:-5433}"
POSTGRES_USER="${POSTGRES_USER:-ripple}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-ripple}"
POSTGRES_DB="${POSTGRES_DB:-ripple}"
DATABASE_URL="${DATABASE_URL:-postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Desktop or docker CLI."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required (Docker Compose V2)."
  exit 1
fi

echo "Starting Postgres (port ${POSTGRES_PORT})..."
docker compose up -d postgres

echo "Waiting for Postgres to be healthy..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo "Postgres did not become ready within 30 attempts."
    docker compose logs postgres
    exit 1
  fi
  sleep 1
done

PRODUCT_COUNT="$(docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  "SELECT COUNT(*) FROM products WHERE sku = 'ACME-1847';" | tr -d '[:space:]')"

if [[ "$PRODUCT_COUNT" != "1" ]]; then
  echo "Seed data missing. Resetting database volume and re-initializing..."
  docker compose down -v
  docker compose up -d postgres
  for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  PRODUCT_COUNT="$(docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "SELECT COUNT(*) FROM products WHERE sku = 'ACME-1847';" | tr -d '[:space:]')"
fi

if [[ "$PRODUCT_COUNT" != "1" ]]; then
  echo "FAIL: expected 1 product ACME-1847, got ${PRODUCT_COUNT}"
  exit 1
fi

bash "${ROOT}/scripts/migrate-db.sh"

echo "PASS: Postgres is ready with Scenario A seed data."
echo "DATABASE_URL=${DATABASE_URL}"
echo ""
echo "Quick check:"
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
  "SELECT sku, name FROM products ORDER BY product_id;"
