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

Use Docker (recommended — same as production nginx on port 80):

```bash
docker compose up --build -d frontend
```

Open **http://localhost** (no port number). Do not use Vite’s default `:5173`; local dev is configured for port **80** only when you run `npm run dev` with Docker stopped (may require admin on Windows).

```bash
cd frontend
npm install
npm run dev
```

For day-to-day work, prefer `docker compose up --build -d frontend` so the app matches **http://localhost**.

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

## 1-on-1 video (WebRTC)

Live meetings use **self-hosted WebRTC**: the FastAPI backend relays signaling over WebSocket; audio and video flow peer-to-peer (STUN by default, optional TURN).

### Local test

1. Start the stack: `docker compose up --build`
2. Log in as teacher (`admin@admin.com` / `admin`) and student (`student@school.com` / `student123`) in two browsers (or one normal + one incognito window).
3. Create a meeting as teacher, wait until it is **Live**, then open the same join URL in both sessions.
4. Allow camera/microphone when prompted. The first user sees “Waiting for the other person…” until the second joins.
5. Test mute, camera toggle, screen share, leave/rejoin, and a third tab (should show “room full”).

WebSocket signaling: `ws://localhost/api/ws/meetings/{id}?token=...` (proxied through nginx).

### Environment variables

**Railway (backend)** — none required. WebSockets run on the same `${PORT}` as the API. Optional for strict NATs:

| Variable | Purpose |
|----------|---------|
| `TURN_URL` | TURN server URL |
| `TURN_USERNAME` | TURN username |
| `TURN_CREDENTIAL` | TURN credential |

**Vercel (frontend)** — `VITE_API_URL` should point at the Railway API (e.g. `https://api-production-b4b1b.up.railway.app/api`). WebSocket URL is derived automatically as `wss://.../api/ws/...`.

| Variable | Purpose |
|----------|---------|
| `VITE_WS_URL` | Override WebSocket base URL (rare) |
| `VITE_TURN_URL` | TURN server for the browser |
| `VITE_TURN_USERNAME` | TURN username |
| `VITE_TURN_CREDENTIAL` | TURN credential |

### Known limitations

- **2 participants max** — mesh P2P, no SFU.
- **Single backend instance** — signaling rooms are in-memory; horizontal scaling would need shared state (e.g. Redis).
- **Strict NATs** may require TURN; STUN-only can fail on some networks.
- A public TURN fallback (`openrelay.metered.ca`) is included when `VITE_TURN_*` is not set — sufficient for testing and most mobile networks; use your own TURN for production scale.
- TURN credentials in `VITE_TURN_*` are embedded in the frontend bundle; a backend-issued ICE config endpoint would be more secure in production.

### Test checklist

- [ ] Two-way audio and video between teacher and student
- [ ] First joiner waits; second joiner connects
- [ ] Mute / unmute and camera on / off visible to peer
- [ ] Screen share replaces video; stop share restores camera
- [ ] Leave shows “peer left” on the other side; rejoin works
- [ ] Third participant rejected with “room full”
