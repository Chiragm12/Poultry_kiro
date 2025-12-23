#!/bin/bash

# Production Deployment Script for Poultry Farm SaaS

set -e

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET environment variable is not set"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🏗️ Building application..."
npm run build

# Run database seeding (only if SEED_DATABASE is set)
if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed
fi

# Health check
echo "🏥 Running health check..."
if command -v curl &> /dev/null; then
    curl -f http://localhost:3000/api/health || echo "⚠️ Health check failed"
else
    echo "⚠️ curl not available, skipping health check"
fi

echo "✅ Deployment completed successfully!"

# Optional: Send deployment notification
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚀 Poultry Farm SaaS deployed successfully!"}' \
        "$SLACK_WEBHOOK_URL"
fi