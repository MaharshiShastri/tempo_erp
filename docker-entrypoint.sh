#!/bin/sh
set -e

if ["$RUN_MIGRATIONS"="true"]; then
    echo 'Running the alembic migration'
    alembic upgrade head
    pip install -r .\\requirements.txt
fi

exec "$@"