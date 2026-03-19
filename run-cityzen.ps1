# ===============================
# CityZen Dev Launcher (Windows)
# ===============================

# Terminal 1: Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# ⏳ Wait 5 seconds
Start-Sleep -Seconds 5

# Terminal 2: Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npx expo start -c"

# Terminal 3: OpenRouter Service
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
"
cd openrouter-service;
if (!(Test-Path venv)) {
    python -m venv venv;
    venv\Scripts\activate;
    pip install -r requirements.txt;
} else {
    venv\Scripts\activate;
}
uvicorn openrouter_service:app --host 0.0.0.0 --port 8001
"
