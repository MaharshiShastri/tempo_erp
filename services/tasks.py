from services.celery_app import celery
from .sonvio_worker import run_automated_job
from services.items_cache import r, ITEM_LOOKUP, normalize
from sqlalchemy import select
from database.repository import SessionLocal
from database.models import ItemMaster
from .quotation_analytics import generate_today_quotation_analytics_pdf
from services.email_service import send_quotation_analytics_email
from pathlib import Path
@celery.task(name="services.tasks.run_lead_generation")
def run_lead_generation():
    return run_automated_job()

@celery.task(name="services.tasks.rebuild_item_cache")
def rebuild_item_cache_task():
    with SessionLocal() as session:
        codes = session.scalars(select(ItemMaster.item_code)).all()

        pipe = r.pipeline()

        pipe.delete(ITEM_LOOKUP)

        for code in codes:
            pipe.hset(ITEM_LOOKUP, normalize(code), code)

        pipe.execute()

        return len(codes)

@celery.task(name="services.tasks.send_daily_quotation_analytics", autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3},)
def send_daily_quotation_analytics():

    pdf_path = generate_today_quotation_analytics_pdf()

    send_quotation_analytics_email(pdf_path)

    return {
        "status": "sent",
        "pdf": str(pdf_path),
    }

@celery.task(name="services.tasks.test_quotation_email")
def test_quotation_email():
    pdf_path = Path("/app/generated_analytics/Quotation_Analytics_2026-08-04.pdf")
    send_quotation_analytics_email(pdf_path)