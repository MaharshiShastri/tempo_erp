from celery import Celery
from celery.schedules import crontab

celery = Celery(
    "leadgen",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/1",
    include=["services.tasks"],
)

celery.conf.beat_schedule = {
    "run-leadgen-daily-8pm": {
        "task": "services.tasks.run_lead_generation",
        "schedule": crontab(hour=15, minute=30),
    },
    
    "fetch-tally-10am": {
        "task": "services.tasks.fetch_tally_daily",
        "schedule": crontab(hour=10, minute=0),
    },
}

celery.conf.timezone = "Asia/Kolkata"