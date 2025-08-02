#!/bin/bash

# Development startup script for VEP Django System
# This script starts both the API server and the React frontend

echo "Starting VEP Django System Development Environment..."
echo "================================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3 to continue."
    exit 1
fi

# Change to the project directory
cd "$(dirname "$0")"

echo "1. Starting API Development Server (Port 8000)..."
python3 dev_api_server.py &
API_PID=$!

# Wait a moment for the API server to start
sleep 2

echo "2. Installing React dependencies..."
cd frontend/react-app
npm install

echo "3. Starting React Development Server (Port 5173)..."
npm run dev &
REACT_PID=$!

echo ""
echo "Development servers are now running:"
echo "  - API Server: http://localhost:8000"
echo "  - React App: http://localhost:5173"
echo ""
echo "The React app will proxy API requests to the development server."
echo "All core systems (Redistricting, Voter Data, Canvassing, Users, Campaigns, Territories) are now functional!"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $API_PID 2>/dev/null
    kill $REACT_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait $API_PID $REACT_PID