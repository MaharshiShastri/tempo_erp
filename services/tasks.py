from services.celery_app import celery
from .sonvio_worker import run_automated_job

@celery.task(name="services.tasks.run_lead_generation")
def run_lead_generation():
    return run_automated_job()