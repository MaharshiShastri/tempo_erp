import os
from pathlib import Path
import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from routers.auth_router import router as auth_router
from routers.orders_router import router as orders_router
from routers.billing_router import router as billing_router
from routers.task_router import router as tasks_router
from routers.dispatch_router import router as dispatch_router
from routers.item_routers import router as item_router
from routers.dashboard_router import router as dashboard_router
from routers.crm_router import router as crm_router

app = FastAPI(title="Tempo Instruments ERP - Decoupled Enterprise Solution")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach Modular Subsystem Routers
app.include_router(auth_router)
app.include_router(orders_router)
app.include_router(billing_router)
app.include_router(tasks_router)
app.include_router(dispatch_router)
app.include_router(item_router)
app.include_router(dashboard_router)
app.include_router(crm_router)
BASE_DIR = Path(__file__).resolve().parent
print(BASE_DIR)

FRONTEND_DIST = BASE_DIR / "erp-frontend" / "dist"

app.mount(
    "/assets",
    StaticFiles(directory=FRONTEND_DIST / "assets"),
    name="assets"
)

@app.get("/")
def serve_index_root():
    return FileResponse(FRONTEND_DIST / "index.html")
