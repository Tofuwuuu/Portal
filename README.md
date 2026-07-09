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

1. Register a **teacher** account at http://localhost/register
2. Log in and create activities and assignments
3. Register a **student** account to view the posted content

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
