from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pathlib import Path
import json
from fastapi.responses import FileResponse

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