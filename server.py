import os
import time
import logging
from pathlib import Path

import uvicorn

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from database.repository import EDBR
import traceback

from routers.auth_router import router as auth_router
from routers.orders_router import router as orders_router
from routers.billing_router import router as billing_router
from routers.task_router import router as tasks_router
from routers.dispatch_router import router as dispatch_router
from routers.item_routers import router as item_router
from routers.dashboard_router import router as dashboard_router
from routers.crm_router import router as crm_router
from routers.wms_router import router as wms_router
from routers.company_router import router as company_router
from routers.tally_router import router as tally_router
from routers.lead_engine_router import router as lead_engine_router
from routers.analytics_router import router as analytics_router
from routers.faq_router import router as faq_router
from routers.stream_router import router as stream_router

app = FastAPI(title="Tempo Instruments ERP - Decoupled Enterprise Solution")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("erp")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        duration = time.time() - start_time

        if response.status_code >= 400:
            logger.warning(f"{request.method} {request.url.path} " f"-> {response.status_code} " f"({duration:.3f}s)")
        else:
            logger.info(f"{request.method} {request.url.path} " f"-> {response.status_code} " f"({duration:.3f}s)")

        return response

    except Exception:
        logger.exception(f"{request.method} {request.url.path} crashed")
        raise

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"{request.method} {request.url.path} " f"-> {exc.status_code}: {exc.detail}")

    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation failed on {request.url.path}: {exc.errors()}")

    return JSONResponse(status_code=422,content={"detail": exc.errors()})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    route_path = request.url.path
    error_message = str(exc)
    stack_trace = traceback.format_exc()
    
    # Do not log standard 401/403/404 HTTPExceptions as system crashes
    if not hasattr(exc, "status_code") or exc.status_code >= 500:
        try:
            with EDBR._get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO system_error_logs (route_path, error_message, stack_trace)
                        VALUES (%s, %s, %s)
                    """, (route_path, error_message, stack_trace))
                    conn.commit()
        except Exception as db_e:
            print(f"CRITICAL: Failed to log error to DB. {db_e}")

    # Return a safe, generic error to the frontend
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. The engineering team has been notified."}
    )
app.include_router(auth_router)
app.include_router(orders_router)
app.include_router(billing_router)
app.include_router(tasks_router)
app.include_router(dispatch_router)
app.include_router(item_router)
app.include_router(dashboard_router)
app.include_router(crm_router)
app.include_router(wms_router)
app.include_router(company_router)
app.include_router(tally_router)
app.include_router(lead_engine_router)
app.include_router(analytics_router)
app.include_router(faq_router)
app.include_router(stream_router)

BASE_DIR = Path(__file__).resolve().parent

FRONTEND_DIST = BASE_DIR / "erp-frontend" / "dist"

app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

@app.get("/")
def serve_index_root():
    return FileResponse(FRONTEND_DIST / "index.html")
