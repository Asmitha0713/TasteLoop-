# TasteLoop

## Run the frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The React application uses Axios and reads the API base URL from `VITE_API_URL`
(default: `http://localhost:5000/api`). Authentication tokens are attached to
protected requests automatically.

## Run the FastAPI backend

The backend reads its MongoDB connection string and JWT settings from `backend/.env`.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5000
```

Check the API and database connection at `http://localhost:5000/api/health`.
Interactive API documentation is available at `http://localhost:5000/docs`.
The full endpoint list is documented in [`backend/API.md`](backend/API.md).
