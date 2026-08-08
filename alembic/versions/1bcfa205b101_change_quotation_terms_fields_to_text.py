"""change quotation terms fields to text

Revision ID: 1bcfa205b101
Revises: c8f65ac0e527
Create Date: 2026-08-07 12:38:38.670431

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1bcfa205b101'
down_revision: Union[str, Sequence[str], None] = 'c8f65ac0e527'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
