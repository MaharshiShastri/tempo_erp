#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo 'Running the alembic migration'
    alembic upgrade head
fi

exec "$@"