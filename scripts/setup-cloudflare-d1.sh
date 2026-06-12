#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/worker"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_API_TOKEN (needs Account → D1 → Edit and Workers Scripts → Edit)." >&2
  exit 1
fi

echo "Creating D1 database mr-brij-db..."
CREATE_OUT=$(npx wrangler d1 create mr-brij-db 2>&1) || true
echo "$CREATE_OUT"

if echo "$CREATE_OUT" | grep -q 'database_id'; then
  DB_ID=$(echo "$CREATE_OUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
  if [[ -n "$DB_ID" ]]; then
    sed -i.bak "s/database_id = \"PLACEHOLDER\"/database_id = \"$DB_ID\"/" wrangler.toml && rm -f wrangler.toml.bak
    echo "Updated wrangler.toml with database_id=$DB_ID"
  fi
fi

echo "Applying remote migrations..."
npx wrangler d1 migrations apply mr-brij-db --remote

echo "Done. Deploy with: npm run deploy:cloudflare"
