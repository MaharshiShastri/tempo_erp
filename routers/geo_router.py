from fastapi import APIRouter, Query, Depends
from fastapi.responses import JSONResponse
from pathlib import Path
import json
from fastapi.responses import FileResponse
from database.repository import EDBR
from security import verify_bearer_token
#from .dependencies import check_department
from datetime import date
from typing import List
router = APIRouter(prefix="/api/v1/geo", tags=["Geography"])

BASE_DIR = Path(__file__).resolve().parent.parent
ZIP_PATH = BASE_DIR / "Admin2.zip"
MAP_PATH = BASE_DIR / "static" / "maps" / "Country" / "india-soi.geojson"

@router.get("/india")
def get_india_geojson():
    with open(MAP_PATH, "r", encoding="utf-8") as f:
        geojson = json.load(f)

    return JSONResponse(content=geojson)

@router.get("/india-shapefile")
def get_admin2():
    return FileResponse(ZIP_PATH, media_type="application/zip", filename="Admin2.zip")

@router.get("/state-summary")
def get_state_summary(from_date: date = Query(...), to_date: date = Query(...), items: List[str] = Query(default=[]), user: dict = Depends(verify_bearer_token)):
    return EDBR.get_state_summary(from_date, to_date, items, user["role"])