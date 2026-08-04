"""Create qoutations table

Revision ID: b51fdb41b567
Revises: 92d4ab795576
Create Date: 2026-08-04 14:44:20.481696

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b51fdb41b567'
down_revision: Union[str, Sequence[str], None] = '92d4ab795576'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
