#!/bin/bash

# FozDocs - Dev Environment Starter

echo "🚀 Starting FozDocs Development Environment..."

# 1. Start Backend & Infrastructure (Docker)
echo "\n🐳 Starting Docker Services (DB, API, MinIO)..."
# Using sudo as per common linux setups, or assumes user is in docker group.
# User's previous scripts used sudo, so I'll keep it safe or check.
# The user's package.json had "sudo docker-compose up -d" in extension_react script.
sudo docker-compose up -d

# Check if docker started correctly
if [ $? -ne 0 ]; then
    echo "❌ Failed to start Docker services."
    exit 1
fi

echo "✅ Docker services started!"

# 2. Start Frontend
echo "\n💻 Starting Frontend (Vite)..."
cd frontend_web

# Check if node_modules exists, if not, warn user
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found in frontend_web. You might need to run install scripts."
fi

npm run dev
