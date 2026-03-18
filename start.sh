#!/bin/bash

# PhoneStore POS - Docker Start Script

echo "🚀 Starting PhoneStore POS..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please review and update if needed."
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🏗️  Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

# Show access URLs
echo ""
echo "✅ PhoneStore POS is ready!"
echo ""
echo "📱 Access URLs:"
echo "   Frontend:    http://localhost:8080/frontend/login.html"
echo "   Backend API: http://localhost:8080/backend/"
echo "   phpMyAdmin:  http://localhost:8081"
echo ""
echo "🔐 Default Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📊 Database Credentials:"
echo "   Host: localhost:3306"
echo "   Database: phonestore_pos"
echo "   User: phonestore"
echo "   Password: phonestore123"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
echo ""
