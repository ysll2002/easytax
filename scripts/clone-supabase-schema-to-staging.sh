#!/usr/bin/env bash
# Copy the production database's *structure* into the staging Supabase project.
#
# Structure only: tables, indexes, constraints, RLS policies, functions,
# triggers in the `public` schema. No rows from profiles, hmrc_connections,
# bank_connections, analytics_events or anything else with user data in it.
# The one optional exception is tax_articles (published blog content, no
# personal data), so that staging's /tax-tips pages render — pass
# --with-articles for that.
#
# Why this exists rather than migrations alone: supabase/migrations/ only
# holds the five additive migrations from September 2026. The base tables
# were created in the dashboard and are not in the repo, so the live
# production schema is the only complete definition.
#
# Usage (run on your own machine — the database ports are not reachable from
# CI or the Claude sandbox):
#
#   export PROD_DB_URL='postgresql://postgres.<prod-ref>:<password>@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
#   export STAGING_DB_URL='postgresql://postgres.<staging-ref>:<password>@aws-0-eu-west-2.pooler.supabase.com:5432/postgres'
#   ./scripts/clone-supabase-schema-to-staging.sh [--with-articles]
#
# Both URLs: Supabase dashboard → project → Connect → "Session pooler".
# Needs pg_dump/psql at least as new as the server (brew install postgresql@17).

set -euo pipefail

PROD_REF='elfkdqrqiyrmcisnkbza'

: "${PROD_DB_URL:?set PROD_DB_URL to the production session-pooler connection string}"
: "${STAGING_DB_URL:?set STAGING_DB_URL to the staging session-pooler connection string}"

# The whole point is not to write to production. Refuse anything that looks
# like the two URLs got swapped or pasted twice.
if [[ "$STAGING_DB_URL" == "$PROD_DB_URL" ]]; then
  echo "STAGING_DB_URL is the same as PROD_DB_URL. Refusing." >&2; exit 1
fi
if [[ "$STAGING_DB_URL" == *"$PROD_REF"* ]]; then
  echo "STAGING_DB_URL points at the production project ($PROD_REF). Refusing." >&2; exit 1
fi
if [[ "$PROD_DB_URL" != *"$PROD_REF"* ]]; then
  echo "PROD_DB_URL does not contain the production project ref ($PROD_REF). Check it." >&2; exit 1
fi

WITH_ARTICLES=false
[[ "${1:-}" == "--with-articles" ]] && WITH_ARTICLES=true

workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT

echo "→ Dumping production schema (public, structure only)…"
pg_dump "$PROD_DB_URL" --schema-only --schema=public --no-owner --file="$workdir/schema.sql"

# A fresh Supabase project already has the public schema; drop the CREATE.
sed -i.bak -E '/^CREATE SCHEMA public;$/d' "$workdir/schema.sql"

echo "→ Checking staging is empty…"
existing=$(psql "$STAGING_DB_URL" -Atc "select count(*) from information_schema.tables where table_schema='public'")
if [[ "$existing" != "0" ]]; then
  echo "Staging already has $existing tables in public. This script only fills an empty project." >&2
  exit 1
fi

echo "→ Applying schema to staging…"
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 --quiet --file="$workdir/schema.sql"

if $WITH_ARTICLES; then
  echo "→ Copying tax_articles (public blog content only)…"
  pg_dump "$PROD_DB_URL" --data-only --table=public.tax_articles --no-owner --file="$workdir/articles.sql"
  psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 --quiet --file="$workdir/articles.sql"
fi

echo "→ Staging now has:"
psql "$STAGING_DB_URL" -Atc "select table_name from information_schema.tables where table_schema='public' order by 1"
echo "Done. No user data was copied."
