# Cityzen – Local Development Setup

This file contains **everything needed** to run Cityzen locally, including the **final run script** and the **full manual setup**.

---

## Final Run Script (Quick Start)

### Terminal 1

```powershell
.\run-cityzen.ps1
```

If the script is not available or fails, follow the manual setup below.

## Manual Setup

You will need 4 terminals running simultaneously.

### Terminal 1 – Backend

Navigate to the backend folder:

```powershell
cd backend
```

Install dependencies (first time or when a new package is added):

```powershell
npm install
```

Start the backend development server:

```powershell
npm run dev
```

### Terminal 2 – Expose Backend API

Use LocalTunnel to expose the backend API on port 3000:

```powershell
lt --port 3000 --subdomain cityzen-api
```

Keep this terminal running while the app is in use.

### Terminal 3 – Frontend (Expo)

Navigate to the frontend folder:

```powershell
cd frontend
```

Install dependencies (first time or when a new package is added):

```powershell
npm install
```

Start the Expo frontend:

```powershell
npx expo start
```

If you encounter a lucide-react error:

```powershell
npm install lucide-react
```

After Expo starts:

1. Open Expo Go on your phone
2. Scan the QR code generated in the terminal
3. First launch may take 1–3 minutes (this is normal)
4. The Cityzen app will appear after booting

### Terminal 4 – AI Service (FastAPI)

Navigate to the AI service folder:

```powershell
cd ai-service
```

Create a Python virtual environment (if not already created):

```powershell
python -m venv venv
```

Verify the virtual environment:

```powershell
ls venv\Scripts
```

Activate the virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
```

Install required Python packages:

```powershell
pip install fastapi uvicorn
pip install ultralytics
# other packages may be required later
```

Run the AI service (first time):

```powershell
uvicorn ai_service:app --host 0.0.0.0 --port 8000
```

For subsequent runs:

```powershell
cd ai-service
venv\Scripts\Activate.ps1
uvicorn ai_service:app --host 0.0.0.0 --port 8000
```

## Notes

- Always activate the Python virtual environment before running the AI service
- Run `npm install` again if dependencies change
- Expo first boot delay is normal
- All four terminals must remain running while using the app

## Terminal Overview

| Terminal   | Purpose         |
| ---------- | --------------- |
| Terminal 1 | Backend server  |
| Terminal 2 | LocalTunnel API |
| Terminal 3 | Frontend (Expo) |
| Terminal 4 | AI Service      |

