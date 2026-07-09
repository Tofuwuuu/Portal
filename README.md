# School Portal

A school portal built with **FastAPI** (backend), **React** (frontend), and **PostgreSQL**, all running in Docker.

## Features

- User registration and login (student / teacher roles)
- View school activities and assignments
- Teachers can create activities and assignments
- Blue and white themed UI

## Quick Start

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start all services:

```bash
docker compose up --build
```

3. Open the portal:

- **Frontend:** http://localhost
- **API docs:** http://localhost:8000/docs

## Usage

### Teacher (default account)

| Email | Password |
|-------|----------|
| `admin@admin.com` | `admin` |

Teachers can create activities and assignments.

### Students

1. Register at `/register` (all new accounts are students)
2. Log in to view activities and assignments

## Project Structure

```
Portal/
├── backend/          # FastAPI + SQLAlchemy + Alembic
├── frontend/         # React + Vite + Tailwind CSS
├── docker-compose.yml
└── .env.example
```

## Development (without Docker)

### Backend

```bash
cd backend
pip install -r requirements.txt
# Set DATABASE_URL to a local Postgres instance
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:8000`.

## Vercel (frontend)

The frontend is deployed to Vercel as a static Vite app.

**Production URL:** https://frontend-blue-beta-n3fz9uwjje.vercel.app

Redeploy from the frontend directory:

```bash
cd frontend
npx vercel deploy --prod
```

### Connect the API

The Vercel frontend needs a **public** backend URL. After hosting the FastAPI backend (Railway, Render, Fly.io, etc.):

1. In the [Vercel project settings](https://vercel.com/mark-roderick-i-salise-s-projects/frontend/settings/environment-variables), add:
   - `VITE_API_URL` = `https://your-backend-url.com/api`
2. Redeploy the frontend.
3. Set `CORS_ORIGINS` on the backend to include your Vercel URL (or rely on the built-in `*.vercel.app` regex).

Until the backend is publicly hosted, login and data will not work on Vercel — only the UI shell loads.
