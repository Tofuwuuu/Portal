"""add meetings table

Revision ID: 005
Revises: 004
Create Date: 2026-07-13
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "meetings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("starts_at", sa.DateTime(), nullable=False),
        sa.Column("room_slug", sa.String(length=100), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_meetings_id"), "meetings", ["id"], unique=False)
    op.create_index(op.f("ix_meetings_room_slug"), "meetings", ["room_slug"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_meetings_room_slug"), table_name="meetings")
    op.drop_index(op.f("ix_meetings_id"), table_name="meetings")
    op.drop_table("meetings")
