#!/bin/bash
set -e

echo "============================================="
echo "   MANIVTHA CRM — DOCKERIZED DEPLOY SCRIPT  "
echo "============================================="

echo "[1/3] Pulling latest updates from GitHub..."
git pull origin main

echo "[2/3] Rebuilding and starting Docker containers..."
# Rebuild containers and run in detached daemon mode
docker compose down
docker compose up --build -d

echo "[3/3] Awaiting DB startup to execute migrations..."
# Sleep for 8 seconds to allow MySQL initialization inside the container
sleep 8
docker compose exec -T backend node seed.js

echo "============================================="
echo " Deployment successful!"
echo " Portal live at: http://localhost:5175"
echo " API backend live at: http://localhost:5050"
echo "============================================="
