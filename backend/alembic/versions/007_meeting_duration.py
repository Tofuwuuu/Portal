"""add meeting duration_minutes

Revision ID: 007
Revises: 006
Create Date: 2026-07-21
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "meetings",
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="60"),
    )
    op.alter_column("meetings", "duration_minutes", server_default=None)


def downgrade() -> None:
    op.drop_column("meetings", "duration_minutes")
