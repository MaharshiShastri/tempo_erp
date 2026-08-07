from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import logging
import json

from security import verify_bearer_token
from .dependencies import check_department
from database.repository import EDBR

from services.tally_client import (
    VOUCHER_TYPE_REPORTS,
    NATIVE_REPORTS,
    build_voucher_collection_xml,
    build_native_report_xml,
    send_to_tally,
    tally_xml_to_json,
    xml_to_staging_json,
    voucher_to_preview_dict,
    fetch_and_preview,
    TALLY_HOST,
)

router = APIRouter(prefix="/api/v1/tally", tags=["Tally Integration"])
logger = logging.getLogger(__name__)


class TallyQueryPayload(BaseModel):
    report_name: str = "Sales Order"  # e.g. Sales Order, Day Book, Trial Balance
    from_date: Optional[str] = None   # 'YYYY-MM-DD' or 'YYYYMMDD'
    to_date: Optional[str] = None
    ledger_name: Optional[str] = None
    tally_url: str = TALLY_HOST


def _require_date_range(payload: TallyQueryPayload):
    if not payload.from_date or not payload.to_date:
        raise HTTPException(
            status_code=400,
            detail="from_date and to_date are both required for this report.",
        )


# ---------------------------------------------------------------------------
# /preview -- fetch + convert only, NOTHING is written to the database.
# This is the "let me see the converted JSON before I commit it" step.
# ---------------------------------------------------------------------------
@router.post("/preview")
def preview_tally_data(
    payload: TallyQueryPayload, user: dict = Depends(verify_bearer_token)
):
    report_name = payload.report_name

    if report_name in VOUCHER_TYPE_REPORTS:
        _require_date_range(payload)
        voucher_type = VOUCHER_TYPE_REPORTS[report_name]
        try:
            result = fetch_and_preview(
                voucher_type=voucher_type,
                from_date=payload.from_date,
                to_date=payload.to_date,
                tally_url=payload.tally_url,
            )
        except ValueError as e:
            raise HTTPException(status_code=502, detail=str(e))
        except Exception:
            logger.exception("Tally preview fetch failed")
            raise HTTPException(status_code=502, detail="Failed to reach Tally.")

        return {
            "report_name": report_name,
            "normalized": result["normalized"],
            "raw": result["raw"],
            "row_count": len(result["normalized"]),
        }

    if report_name in NATIVE_REPORTS:
        xml_payload = build_native_report_xml(
            report_name=report_name,
            from_date=payload.from_date,
            to_date=payload.to_date,
            ledger_name=payload.ledger_name,
        )
        try:
            raw_xml = send_to_tally(xml_payload, payload.tally_url)
        except ValueError as e:
            raise HTTPException(status_code=502, detail=str(e))
        except Exception:
            logger.exception("Tally preview fetch failed")
            raise HTTPException(status_code=502, detail="Failed to reach Tally.")

        # Native reports don't have a shared voucher schema -- return the
        # generic structure-preserving parse for inspection/display only.
        # (No staging path exists for these yet.)
        return {
            "report_name": report_name,
            "normalized": tally_xml_to_json(raw_xml),
            "raw": raw_xml,
        }

    raise HTTPException(
        status_code=400,
        detail=f"Unknown report_name '{report_name}'. "
        f"Valid options: {sorted(VOUCHER_TYPE_REPORTS) + sorted(NATIVE_REPORTS)}",
    )


# ---------------------------------------------------------------------------
# /sync-and-stage -- fetch, convert, AND commit to the staging tables in one
# call. Only valid for voucher-type reports (Sales Order, Purchase Order,
# Sales, Purchase, Day Book) since those are the only ones with a staging
# schema (StagingOrderHeader / StagingOrderItem via EDBR.ingest_tally_json).
# ---------------------------------------------------------------------------
@router.post("/sync-and-stage", dependencies=[Depends(check_department("Admin"))])
def sync_and_stage_tally_data(payload: TallyQueryPayload, user: dict = Depends(verify_bearer_token)):
    report_name = payload.report_name
    if report_name not in VOUCHER_TYPE_REPORTS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"'{report_name}' has no staging schema to commit into. "
                f"Only these can be staged: {sorted(VOUCHER_TYPE_REPORTS)}. "
                "Use /preview for other report types."
            ),
        )

    _require_date_range(payload)
    voucher_type = VOUCHER_TYPE_REPORTS[report_name]

    xml_payload = build_voucher_collection_xml(
        voucher_type=voucher_type,
        from_date=payload.from_date,
        to_date=payload.to_date,
    )
    try:
        raw_xml = send_to_tally(xml_payload, payload.tally_url)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception:
        logger.exception("Tally fetch failed during sync-and-stage")
        raise HTTPException(status_code=502, detail="Failed to reach Tally.")

    staging_json = xml_to_staging_json(raw_xml)

    try:
        inserted_count = EDBR.ingest_tally_json(staging_json)
    except Exception as e:
        logger.exception("Staging ingestion failed")
        raise HTTPException(status_code=500, detail=f"Database insertion failed: {str(e)}")

    return {
        "status": "success",
        "report_name": report_name,
        "orders_found": len(staging_json.get("tallymessage", [])),
        "orders_staged": inserted_count,
    }


# ---------------------------------------------------------------------------
# /upload-xml -- deterministic replacement for the old Groq-based translator.
# Same input (a previously-exported Tally XML file), same output shape the
# frontend already expects (extracted_orders), but parsed locally instead
# of round-tripping through an LLM -- faster, free, and won't rewrite your
# numbers.
# ---------------------------------------------------------------------------
@router.post("/upload-xml", dependencies=[Depends(check_department("Admin"))])
async def upload_tally_xml(file: UploadFile = File(...), user: dict = Depends(verify_bearer_token)):
    if not file.filename.lower().endswith(".xml"):
        raise HTTPException(status_code=400, detail="Only Tally XML files are supported.")

    content = await file.read()
    xml_text = content.decode("utf-8", errors="replace")

    try:
        staging_json = xml_to_staging_json(xml_text)
    except Exception as e:
        logger.error("Tally XML Upload Error: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to parse Tally XML: {str(e)}")

    sales_orders = [
        v for v in staging_json["tallymessage"] if v.get("vouchertypename") == "Sales Order"
    ]

    if not sales_orders:
        return {"status": "success", "extracted_orders": []}

    extracted_orders = [voucher_to_preview_dict(v) for v in sales_orders]

    return {"status": "success", "extracted_orders": extracted_orders}


# ---------------------------------------------------------------------------
# /upload-json, /upload-bills -- unchanged, already-tested staging commit
# paths. Left exactly as they were; they consume the same {"tallymessage":
# [...]} / daybook shapes this module now produces natively via /preview
# and /sync-and-stage, so a file exported from those endpoints' "raw" field
# can be re-uploaded here too if you want a manual review step in between.
# ---------------------------------------------------------------------------
@router.post("/upload-json", dependencies=[Depends(check_department("Admin"))])
async def upload_tally_json(file: UploadFile = File(...), user: dict = Depends(verify_bearer_token)):
    if not file.filename.lower().endswith(".json"):
        raise HTTPException(status_code=400, detail="Only JSON files are supported.")

    content = await file.read()

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format.")

    try:
        inserted_count = EDBR.ingest_tally_json(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insertion failed: {str(e)}")

    return {
        "status": "success",
        "orders_found": len(data.get("tallymessage", [])),
        "orders_staged": inserted_count,
    }


@router.post("/upload-bills", dependencies=[Depends(check_department("Admin"))])
async def upload_bill_tally(file: UploadFile = File(...), user: dict = Depends(verify_bearer_token)):
    if not file.filename.lower().endswith(".json"):
        raise HTTPException(status_code=400, detail="Only JSON files are supported.")

    content = await file.read()

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format.")

    try:
        inserted_count = EDBR.extract_daybook_json(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insertion failed: {str(e)}")

    return {"status": "success", "extracted_bills": inserted_count}