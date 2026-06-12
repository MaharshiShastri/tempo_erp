#!/bin/bash
pip install -r requirements.txt
python -m alembic upgrade head
exec uvicorn server:app --host 0.0.0.0 --port 8000