#!/bin/sh
set -e

echo "Starting THE BOOTY REPUBLIC application..."

# Apply Prisma database schema push/migrations
if [ -n "$DATABASE_URL" ]; then
  echo "Applying database migrations and schema sync..."
  npx prisma db push --skip-generate || echo "Warning: Prisma db push encountered an issue, proceeding..."

  echo "Seeding initial products and admin account if needed..."
  node prisma/seed.js || echo "Warning: Prisma seed script finished or already seeded."
fi

echo "Starting Next.js standalone server on port ${PORT:-3000}..."
exec "$@"
