from celery_app import celery
from .snovio_worker import run_automated_job

@celery.task
def run_lead_generation():
    return run_automated_job()