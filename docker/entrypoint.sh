#!/bin/sh
set -e

echo "🔄 Running database migrations..."
cd /app/apps/api
npx prisma migrate deploy

echo "🔍 Checking if database needs seeding..."
NEEDS_SEED=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.unit.count().then(c => {
  console.log(c === 0 ? 'yes' : 'no');
}).catch(() => console.log('yes')).finally(() => p.\$disconnect());
")

if [ "$NEEDS_SEED" = "yes" ]; then
  echo "🌱 Seeding database with initial data..."
  node dist/prisma/seed/index.js
  echo "✅ Seed complete!"
else
  echo "✅ Data already exists, skipping seed."
fi

echo "🚀 Starting API server..."
cd /app

echo "🖼️ Syncing missing images/figures to database..."
pnpm --filter api run db:sync-figures || echo "⚠️ Sync figures skipped/failed, continuing..."

exec node apps/api/dist/src/main.js
