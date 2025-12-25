#!/bin/bash

echo "Stopping POC servers..."

# Stop backend
echo "Stopping backend..."
pkill -f study-material-service-poc

# Stop frontend
echo "Stopping frontend..."
pkill -f "next dev"

echo "✅ All servers stopped"


