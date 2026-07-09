"""add publish and archive flags

Revision ID: 002
Revises: 001
Create Date: 2026-07-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("activities", sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("activities", sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("assignments", sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("assignments", sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.alter_column("activities", "is_published", server_default=None)
    op.alter_column("activities", "is_archived", server_default=None)
    op.alter_column("assignments", "is_published", server_default=None)
    op.alter_column("assignments", "is_archived", server_default=None)


def downgrade() -> None:
    op.drop_column("assignments", "is_archived")
    op.drop_column("assignments", "is_published")
    op.drop_column("activities", "is_archived")
    op.drop_column("activities", "is_published")
