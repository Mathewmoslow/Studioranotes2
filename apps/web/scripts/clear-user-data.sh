#!/usr/bin/env bash
set -euo pipefail
EMAIL="${1:-mathewmoslow@gmail.com}"

# Use direct connection with SSL to avoid local pooler issues.
export DATABASE_URL="postgresql://postgres.oxzgpjektowmrtkmxaye:fqPQ5Rr2l08K1p82@db.oxzgpjektowmrtkmxaye.supabase.co:5432/postgres?sslmode=require"
export DIRECT_URL="$DATABASE_URL"

# Run via ts-node (installed in repo) for .ts script
npx ts-node ./apps/web/scripts/clear-user-data.ts "$EMAIL"
