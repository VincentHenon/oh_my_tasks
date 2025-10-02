#!/bin/bash

# Kill any process using port 3000 or 3443
echo "Killing processes on ports 3000 and 3443..."
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :3443 | xargs kill -9 2>/dev/null

# Start Next.js dev server on port 3000
echo "Starting Next.js dev server on port 3000..."
npm run dev -- --port 3000 &

# Wait a few seconds for Next.js to start
sleep 5

# Start HTTPS proxy on port 3443
echo "Starting HTTPS proxy on port 3443..."
local-ssl-proxy --source 3443 --target 3000 --cert .cert/cert.pem --key .cert/key.pem &

echo "All done! Access your app at https://localhost:3443 or https://YOUR_LOCAL_IP:3443"