from __future__ import annotations

import json
import logging
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from pydantic import BaseModel

from security import verify_bearer_token
from .dependencies import check_department

from database.repository import EDBR

from services.tally_client import (
    TALLY_HOST,
    TALLY_COMPANY,
    fetch_voucher_range,
    send_to_tally,
    tally_xml_to_json,
    xml_to_staging_json,
    voucher_to_staging_order,
)

from services.tally_service import (
    sync_item_master,
    sync_voucher_dataset,
)


# ============================================================================
# Router
# ============================================================================

router = APIRouter(prefix="/api/v1/tally", tags=["Tally Integration"],)

logger = logging.getLogger(__name__)


# ============================================================================
# Supported reports
# ============================================================================

# These are the voucher types currently supported by tally_service.py
# and tally_fetcher.py.
#
# Do NOT add native reports here until corresponding XML builders/parsers
# are actually implemented in tally_client.py.

VOUCHER_TYPE_REPORTS = {
    "Sales Order": "Sales Order",
    "Sales": "Sales",
    "Purchase Order": "Purchase Order",
    "Purchase": "Purchase",
}


# ============================================================================
# Request models
# ============================================================================

class TallyQueryPayload(BaseModel):
    report_name: str = "Sales Order"

    # Accept either:
    #
    #   2026-04-01
    #   20260401
    #
    from_date: Optional[str] = None
    to_date: Optional[str] = None

    # Optional Tally company override.
    company: str = TALLY_COMPANY

    # Optional Tally URL override.
    tally_url: str = TALLY_HOST


# ============================================================================
# Helpers
# ============================================================================

def _require_date_range(
    payload: TallyQueryPayload,
) -> None:
    """
    Require both dates for voucher-range reports.
    """

    if not payload.from_date or not payload.to_date:
        raise HTTPException(
            status_code=400,
            detail=(
                "from_date and to_date are both required "
                "for this report."
            ),
        )


def _get_voucher_type(
    report_name: str,
) -> str:
    """
    Resolve a public report name to the Tally voucher type.
    """

    voucher_type = VOUCHER_TYPE_REPORTS.get(report_name)

    if not voucher_type:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unknown report_name '{report_name}'. "
                f"Valid options: "
                f"{sorted(VOUCHER_TYPE_REPORTS)}"
            ),
        )

    return voucher_type


def _build_preview_orders(
    xml_text: str,
) -> list[dict]:
    """
    Convert Tally voucher XML into the same application staging
    representation used by tally_service.

    This function DOES NOT touch the database.
    """

    normalized = xml_to_staging_json(xml_text)

    return [
        voucher_to_staging_order(voucher)
        for voucher in normalized.get(
            "tallymessage",
            [],
        )
    ]


# ============================================================================
# GET /reports
# ============================================================================

@router.get(
    "/reports",
)
def get_supported_tally_reports(
    user: dict = Depends(verify_bearer_token),
):
    """
    Return reports currently supported by this router.

    This intentionally reflects the actual voucher synchronization
    implementation rather than advertising unsupported native reports.
    """

    return {
        "voucher_reports": sorted(
            VOUCHER_TYPE_REPORTS.keys()
        ),
    }


# ============================================================================
# POST /preview
# ============================================================================

@router.post(
    "/preview",
)
def preview_tally_data(
    payload: TallyQueryPayload,
    user: dict = Depends(verify_bearer_token),
):
    """
    Fetch and convert Tally vouchers without writing to PostgreSQL.

    This endpoint is safe for testing because it does NOT call:
        EDBR.ingest_tally_json()
        sync_voucher_dataset()
        session.commit()

    It only:
        Tally
            -> XML
            -> normalized Tally dictionaries
            -> application staging dictionaries
    """

    _require_date_range(payload)

    voucher_type = _get_voucher_type(
        payload.report_name
    )

    try:
        raw_xml = fetch_voucher_range(
            voucher_type=voucher_type,
            from_date=payload.from_date,
            to_date=payload.to_date,
            company=payload.company,
            tally_url=payload.tally_url,
        )

        normalized = xml_to_staging_json(
            raw_xml
        )

        preview_orders = [
            voucher_to_staging_order(voucher)
            for voucher in normalized.get(
                "tallymessage",
                [],
            )
        ]

    except ValueError as exc:
        logger.exception(
            "Tally rejected preview request"
        )

        raise HTTPException(
            status_code=502,
            detail=str(exc),
        )

    except Exception:
        logger.exception(
            "Tally preview fetch failed"
        )

        raise HTTPException(
            status_code=502,
            detail="Failed to fetch or parse data from Tally.",
        )

    return {
        "status": "success",
        "report_name": payload.report_name,
        "voucher_type": voucher_type,

        # Raw Tally representation.
        "normalized": normalized,

        # Application staging representation.
        "extracted_orders": preview_orders,

        # Raw XML for debugging/manual inspection.
        "raw": raw_xml,

        "row_count": len(
            normalized.get(
                "tallymessage",
                [],
            )
        ),
    }


# ============================================================================
# POST /sync-and-stage
# ============================================================================

@router.post(
    "/sync-and-stage",
    dependencies=[
        Depends(check_department("Admin"))
    ],
)
def sync_and_stage_tally_data(
    payload: TallyQueryPayload,
    user: dict = Depends(verify_bearer_token),
):
    """
    Fetch Tally vouchers and synchronize them into staging tables.

    This delegates all database persistence to tally_service.py.

    Pipeline:

        Tally
          -> tally_client
          -> tally_service
          -> StagingOrderHeader
          -> StagingOrderItem

    ClientCompany is NOT touched.
    """

    _require_date_range(payload)

    voucher_type = _get_voucher_type(
        payload.report_name
    )

    # ------------------------------------------------------------------
    # Important:
    #
    # sync_voucher_dataset() currently uses the default Tally company
    # and default Tally URL internally.
    #
    # Therefore, if the API caller supplies a custom company or URL,
    # we cannot safely pass those values to the current service without
    # changing tally_service.py.
    #
    # For now, reject overrides rather than silently ignoring them.
    # ------------------------------------------------------------------

    if payload.company != TALLY_COMPANY:
        raise HTTPException(
            status_code=400,
            detail=(
                "Custom company is not currently supported "
                "by sync-and-stage. "
                "Use the configured TALLY_COMPANY."
            ),
        )

    if payload.tally_url != TALLY_HOST:
        raise HTTPException(
            status_code=400,
            detail=(
                "Custom tally_url is not currently supported "
                "by sync-and-stage. "
                "Use the configured TALLY_HOST."
            ),
        )

    try:
        result = sync_voucher_dataset(
            session=EDBR.session(),
            dataset=_report_name_to_dataset(payload.report_name),
            voucher_type=voucher_type,
            from_date=payload.from_date,
            to_date=payload.to_date,
        )

    except Exception:
        logger.exception(
            "Tally synchronization failed"
        )

        raise HTTPException(
            status_code=500,
            detail="Tally synchronization failed.",
        )

    return {
        "status": "success",
        "report_name": payload.report_name,
        "voucher_type": voucher_type,

        "orders_found": result["received"],
        "orders_staged": result["upserted"],
        "orders_cancelled": result["cancelled"],
        "orders_skipped": result["skipped"],
        "items_written": result["items_written"],

        "xml_path": str(
            result["xml_path"]
        ),
        "normalized_path": str(
            result["normalized_path"]
        ),
        "staging_path": str(
            result["staging_path"]
        ),
    }


# ============================================================================
# Dataset naming
# ============================================================================

def _report_name_to_dataset(
    report_name: str,
) -> str:
    """
    Convert API report names to the dataset names expected by
    tally_fetcher.py / tally_service.py.
    """

    mapping = {
        "Sales Order": "sales_orders",
        "Sales": "sales",
        "Purchase Order": "purchase_orders",
        "Purchase": "purchase",
    }

    dataset = mapping.get(report_name)

    if not dataset:
        raise HTTPException(
            status_code=400,
            detail=(
                f"No dataset mapping exists for "
                f"'{report_name}'."
            ),
        )

    return dataset


# ============================================================================
# POST /item-master/preview
# ============================================================================

@router.post(
    "/item-master/preview",
)
def preview_item_master(
    user: dict = Depends(verify_bearer_token),
):
    """
    Fetch Item Master and return the service-level result.

    NOTE:
    sync_item_master() currently performs the DB upsert, so this endpoint
    is NOT a DB-free preview.

    It is intentionally named differently from /preview to avoid implying
    that it is read-only.
    """

    raise HTTPException(
        status_code=501,
        detail=(
            "Item Master preview is not implemented as a read-only "
            "operation. Use /item-master/sync for synchronization."
        ),
    )


# ============================================================================
# POST /item-master/sync
# ============================================================================

@router.post(
    "/item-master/sync",
    dependencies=[
        Depends(check_department("Admin"))
    ],
)
def sync_item_master_endpoint(
    user: dict = Depends(verify_bearer_token),
):
    """
    Synchronize Item Master using the same service as tally_fetcher.py.

    Current configuration:
        ITEM_NAME_PREFIX = "TI"
    """

    try:
        result = sync_item_master(
            session=EDBR.session(),
            name_prefix="TI",
        )

    except Exception:
        logger.exception(
            "Item Master synchronization failed"
        )

        raise HTTPException(
            status_code=500,
            detail="Item Master synchronization failed.",
        )

    return {
        "status": "success",

        "received": result["received"],
        "upserted": result["upserted"],
        "skipped": result["skipped"],

        "xml_path": str(
            result["xml_path"]
        ),
        "json_path": str(
            result["json_path"]
        ),
    }


# ============================================================================
# POST /upload-xml
# ============================================================================

@router.post(
    "/upload-xml",
    dependencies=[
        Depends(check_department("Admin"))
    ],
)
async def upload_tally_xml(
    file: UploadFile = File(...),
    user: dict = Depends(verify_bearer_token),
):
    """
    Parse a previously exported Tally XML file.

    No database write occurs here.

    This endpoint is useful for testing the XML -> staging conversion
    independently of the live Tally connection.
    """

    filename = (
        file.filename
        or ""
    )

    if not filename.lower().endswith(
        ".xml"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only Tally XML files are supported."
            ),
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded XML file is empty.",
        )

    xml_text = content.decode(
        "utf-8",
        errors="replace",
    )

    try:
        normalized = xml_to_staging_json(
            xml_text
        )

        vouchers = normalized.get(
            "tallymessage",
            [],
        )

        extracted_orders = [
            voucher_to_staging_order(voucher)
            for voucher in vouchers
            if (
                voucher.get(
                    "vouchertypename"
                )
                == "Sales Order"
            )
        ]

    except Exception as exc:
        logger.exception(
            "Tally XML upload parsing failed"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to parse Tally XML: {exc}"
            ),
        )

    return {
        "status": "success",
        "report_name": "Sales Order",

        "orders_found": len(
            extracted_orders
        ),

        "extracted_orders": extracted_orders,
    }


# ============================================================================
# POST /upload-json
# ============================================================================

@router.post(
    "/upload-json",
    dependencies=[
        Depends(check_department("Admin"))
    ],
)
async def upload_tally_json(
    file: UploadFile = File(...),
    user: dict = Depends(verify_bearer_token),
):
    """
    Upload a previously generated staging JSON file and commit it
    using the existing EDBR ingestion path.
    """

    filename = (
        file.filename
        or ""
    )

    if not filename.lower().endswith(
        ".json"
    ):
        raise HTTPException(
            status_code=400,
            detail="Only JSON files are supported.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded JSON file is empty.",
        )

    try:
        data = json.loads(
            content.decode(
                "utf-8"
            )
        )

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="JSON file must be UTF-8 encoded.",
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON format.",
        )

    if not isinstance(
        data,
        dict,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Expected a JSON object containing "
                "'tallymessage'."
            ),
        )

    if "tallymessage" not in data:
        raise HTTPException(
            status_code=400,
            detail=(
                "JSON must contain a 'tallymessage' field."
            ),
        )

    if not isinstance(
        data["tallymessage"],
        list,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "'tallymessage' must be a list."
            ),
        )

    try:
        inserted_count = EDBR.ingest_tally_json(
            data
        )

    except Exception:
        logger.exception(
            "Tally JSON ingestion failed"
        )

        raise HTTPException(
            status_code=500,
            detail="Database insertion failed.",
        )

    return {
        "status": "success",
        "orders_found": len(
            data["tallymessage"]
        ),
        "orders_staged": inserted_count,
    }


# ============================================================================
# POST /upload-bills
# ============================================================================

@router.post(
    "/upload-bills",
    dependencies=[
        Depends(check_department("Admin"))
    ],
)
async def upload_bill_tally(
    file: UploadFile = File(...),
    user: dict = Depends(verify_bearer_token),
):
    """
    Upload Day Book JSON and extract bills using the existing
    EDBR extraction path.
    """

    filename = (
        file.filename
        or ""
    )

    if not filename.lower().endswith(
        ".json"
    ):
        raise HTTPException(
            status_code=400,
            detail="Only JSON files are supported.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded JSON file is empty.",
        )

    try:
        data = json.loads(
            content.decode(
                "utf-8"
            )
        )

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="JSON file must be UTF-8 encoded.",
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON format.",
        )

    if not isinstance(
        data,
        dict,
    ):
        raise HTTPException(
            status_code=400,
            detail="Expected a JSON object.",
        )

    try:
        inserted_count = EDBR.extract_daybook_json(
            data
        )

    except Exception:
        logger.exception(
            "Tally bill extraction failed"
        )

        raise HTTPException(
            status_code=500,
            detail="Database insertion failed.",
        )

    return {
        "status": "success",
        "extracted_bills": inserted_count,
    }