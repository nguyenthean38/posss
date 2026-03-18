#!/bin/bash

# PhoneStore POS - Docker Stop Script

echo "🛑 Stopping PhoneStore POS..."
echo ""

# Stop containers
docker-compose down

echo ""
echo "✅ All services stopped!"
echo ""
echo "To start again: ./start.sh"
echo "To remove all data: docker-compose down -v"
echo ""
