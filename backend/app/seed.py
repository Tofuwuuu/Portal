from sqlalchemy.orm import Session

from app.auth.security import get_password_hash
from app.models.user import User, UserRole

DEFAULT_TEACHER = {
    "email": "admin@admin.com",
    "password": "admin",
    "full_name": "Admin",
    "role": UserRole.teacher,
}


def seed_default_teacher(db: Session) -> None:
    existing = db.query(User).filter(User.email == DEFAULT_TEACHER["email"]).first()
    if existing:
        return

    user = User(
        email=DEFAULT_TEACHER["email"],
        full_name=DEFAULT_TEACHER["full_name"],
        hashed_password=get_password_hash(DEFAULT_TEACHER["password"]),
        role=DEFAULT_TEACHER["role"],
    )
    db.add(user)
    db.commit()
