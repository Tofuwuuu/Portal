from sqlalchemy.orm import Session

from app.auth.security import get_password_hash
from app.models.user import User, UserRole

DEFAULT_TEACHER = {
    "email": "admin@admin.com",
    "password": "admin",
    "full_name": "Admin",
    "role": UserRole.teacher,
}

DEFAULT_STUDENT = {
    "email": "student@school.com",
    "password": "student123",
    "full_name": "Student User",
    "role": UserRole.student,
}


def _seed_user(db: Session, data: dict) -> None:
    existing = db.query(User).filter(User.email == data["email"]).first()
    if existing:
        return

    user = User(
        email=data["email"],
        full_name=data["full_name"],
        hashed_password=get_password_hash(data["password"]),
        role=data["role"],
    )
    db.add(user)
    db.commit()


def seed_defaults(db: Session) -> None:
    _seed_user(db, DEFAULT_TEACHER)
    _seed_user(db, DEFAULT_STUDENT)
