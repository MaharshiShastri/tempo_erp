from services.celery_app import celery
from .sonvio_worker import run_automated_job
from services.items_cache import r, ITEM_LOOKUP, normalize
from sqlalchemy import select
from database.repository import SessionLocal
from database.models import ItemMaster

@celery.task(name="services.tasks.run_lead_generation")
def run_lead_generation():
    return run_automated_job()

@celery.task(name="services.task.rebuild_item_cache")
def rebuild_item_cache_task():
    with SessionLocal() as session:
        codes = session.scalars(select(ItemMaster.item_code)).all()

        pipe = r.pipeline()

        pipe.delete(ITEM_LOOKUP)

        for code in codes:
            pipe.hset(ITEM_LOOKUP, normalize(code), code)

        pipe.execute()

        return len(codes)