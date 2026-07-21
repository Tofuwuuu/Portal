import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import SessionLocal, engine
from app.routers import activities, assignments, auth, meetings

from app.seed import seed_defaults

app = FastAPI(title="School Portal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(activities.router)
app.include_router(assignments.router)
app.include_router(meetings.router)


@app.on_event("startup")
def wait_for_db():
    for _ in range(30):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            db = SessionLocal()
            try:
                seed_defaults(db)
            finally:
                db.close()
            return
        except Exception:
            time.sleep(1)
    raise RuntimeError("Database not available")


@app.get("/api/health")
def health():
    return {"status": "ok"}
