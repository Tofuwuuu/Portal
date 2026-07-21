"""add submission grade fields

Revision ID: 006
Revises: 005
Create Date: 2026-07-21
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("submissions", sa.Column("grade", sa.Integer(), nullable=True))
    op.add_column("submissions", sa.Column("feedback", sa.Text(), nullable=True))
    op.add_column("submissions", sa.Column("graded_at", sa.DateTime(), nullable=True))
    op.add_column("submissions", sa.Column("graded_by", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_submissions_graded_by_users",
        "submissions",
        "users",
        ["graded_by"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_submissions_graded_by_users", "submissions", type_="foreignkey")
    op.drop_column("submissions", "graded_by")
    op.drop_column("submissions", "graded_at")
    op.drop_column("submissions", "feedback")
    op.drop_column("submissions", "grade")
