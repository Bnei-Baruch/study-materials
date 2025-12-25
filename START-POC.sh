#!/bin/bash

echo "Starting Lesson Parts POC..."
echo ""

# Start backend
echo "Starting backend on http://localhost:8080..."
cd /Users/alexm/Projects/study-material-service
./study-material-service-poc server > backend.log 2>&1 &
BACKEND_PID=$!

sleep 2

# Check if backend is running
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Backend started successfully (PID: $BACKEND_PID)"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "Starting frontend on http://localhost:3000..."
cd /Users/alexm/Projects/study-material-service/frontend
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✅ Frontend starting (PID: $FRONTEND_PID)"
echo ""
echo "================================================================"
echo "POC is running!"
echo "================================================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8080"
echo ""
echo "To stop servers, run: ./STOP-SERVERS.sh"
echo ""
echo "Waiting for frontend to start..."
sleep 5
echo "✅ POC should be ready now!"
echo ""
echo "Open http://localhost:3000 in your browser"
