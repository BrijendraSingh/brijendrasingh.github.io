#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/worker"

SITE_URL="${SITE_URL:-https://mr-brij.bps-brijendra.workers.dev}"

echo "mr-brij OAuth setup"
echo "==================="
echo ""
echo "Register these callback URLs in Google Cloud / GitHub OAuth apps:"
echo "  Google:  ${SITE_URL}/auth/google/callback"
echo "  GitHub:  ${SITE_URL}/auth/github/callback"
echo "  Local:   http://localhost:8787/auth/google/callback"
echo "           http://localhost:8787/auth/github/callback"
echo ""

read -r -p "Set Google OAuth secrets? [y/N] " google
if [[ "${google,,}" == "y" ]]; then
  npx wrangler secret put GOOGLE_CLIENT_ID
  npx wrangler secret put GOOGLE_CLIENT_SECRET
fi

read -r -p "Set GitHub OAuth secrets? [y/N] " github
if [[ "${github,,}" == "y" ]]; then
  npx wrangler secret put GITHUB_CLIENT_ID
  npx wrangler secret put GITHUB_CLIENT_SECRET
fi

echo ""
echo "Redeploy to apply secrets:"
echo "  cd $ROOT && npm run deploy:cloudflare"
