"""New AI Roles

Revision ID: 3c020a6ac19c
Revises: f1cc976a6446
Create Date: 2026-09-25 11:11:04.137568

"""
from typing import Sequence, Union
import os
from alembic import op
import sqlalchemy as sa
from database.ai_access import AI_ROLES, AI_SCHEMA
DB_OWNER_ROLE = os.getenv("BACKUP_DB_USER", "postgres")
# revision identifiers, used by Alembic.
revision: str = '3c020a6ac19c'
down_revision: Union[str, Sequence[str], None] = 'f1cc976a6446'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def _quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'

def _role_exists(role_name: str) -> bool:
    connection = op.get_bind()

    result = connection.execute(
        sa.text(
            """
            SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :role_name)
            """
        ),
        {"role_name": role_name}
    )

    return bool(result.scalar())

def _create_role(role_name: str) -> None:
    if _role_exists(role_name):
        return

    role = _quote_identifier(role_name)
    print("After: ", role)
    op.execute(
        sa.text(
            f"""
            CREATE ROLE {role} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOLOGIN"""
        )
    )

def _configure_default_privileges() -> None:
    owner = _quote_identifier(DB_OWNER_ROLE)
    schema = _quote_identifier(AI_SCHEMA)

    for role in AI_ROLES:
        ai_role = _quote_identifier(role.name)
        op.execute(
            sa.text(
                f"""
                ALTER DEFAULT PRIVILEGES FOR ROLE {owner} IN SCHEMA {schema} GRANT SELECT ON TABLES TO {ai_role}"""
            )
        )

def upgrade() -> None:
    """Upgrade schema."""
    for role in AI_ROLES:
        _create_role(role.name)

    for role in AI_ROLES:
        op.execute(
            sa.text(
                f"GRANT USAGE ON SCHEMA {_quote_identifier(AI_SCHEMA)} TO {_quote_identifier(role.name)}"
            )
        )
    for role in AI_ROLES:
        for table_name in sorted(role.tables):
            op.execute(
                sa.text(
                    f"GRANT SELECT ON TABLE {_quote_identifier(AI_SCHEMA)}.{_quote_identifier(table_name)} TO {_quote_identifier(role.name)}"
                )
            )
    _configure_default_privileges()

def downgrade() -> None:
    """Downgrade schema."""
    for role in reversed(AI_ROLES):
        op.execute(
            sa.text(
                f"REVOKE USAGE ON SCHEMA {_quote_identifier(AI_SCHEMA)} FROM {_quote_identifier(role.name)}"
            )
        )

        for table_name in sorted(role.tables):
            op.execute(
                sa.text(
                    f"REVOKE SELECT ON TABLE {_quote_identifier(AI_SCHEMA)}.{_quote_identifier(table_name)} FROM {_quote_identifier(role.name)}"
                )
            )

        if _role_exists(role.name):
            op.execute(
                sa.text(
                    f"DROP ROLE {_quote_identifier(role.name)}"
                )
            )