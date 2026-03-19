#!/bin/bash
# ===============================
# CityZen Dev Launcher (Linux)
# ===============================

# === Terminal 1: Backend ===
gnome-terminal \
  --tab --title="CityZen Backend" -- bash -c "
    cd backend &&
    npm run dev;
    exec bash"

# ⏳ Wait 20 seconds
sleep 20

# === Terminal 2: Frontend ===
gnome-terminal \
  --tab --title="CityZen Frontend" -- bash -c "
    cd frontend &&
    npx expo start -c;
    exec bash"

# === Terminal 3: OpenRouter Service ===
gnome-terminal \
  --tab --title="OpenRouter Service" -- bash -c "
    cd openrouter-service &&
    if [ ! -d \"venv\" ]; then
      python -m venv venv &&
      source venv/bin/activate &&
      pip install -r requirements.txt;
    else
      source venv/bin/activate;
    fi &&
    uvicorn openrouter_service:app --host 0.0.0.0 --port 8001;
    exec bash"
