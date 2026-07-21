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

### Student (demo account)

| Email | Password |
|-------|----------|
| `student@school.com` | `student123` |

This account is seeded automatically on first startup. You can also register at `/register` (all new accounts are students).

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

The Vercel frontend is connected to the Railway backend:

- **API:** https://api-production-b4b1b.up.railway.app
- **API docs:** https://api-production-b4b1b.up.railway.app/docs
- **Railway project:** https://railway.com/project/2125a8f5-b31b-4e22-a2b5-8236fb118e8f

## Railway (backend)

The backend is configured for [Railway](https://railway.app). See [backend/RAILWAY.md](backend/RAILWAY.md) for full steps.

Quick deploy:

```bash
npm install -g @railway/cli
railway login
cd backend
railway init
railway add --database postgres
railway up
```

Then generate a public domain in Railway → Settings → Networking, and set `VITE_API_URL` on Vercel to `https://your-railway-url/api`.
