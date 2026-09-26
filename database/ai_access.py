from dataclasses import dataclass
from typing import FrozenSet

@dataclass(frozen=True)
class AIReadRole:
    name: str
    tables: FrozenSet[str]

ML_ROLE = AIReadRole(
    name="tempo_ml_reader",
    tables=frozenset({
        "items_master",
        "raw_materials",
        "bom_headers",
        "bom_components",
        "purchase_bills",
        "purchase_bill_items",
        "grn_headers",
        "grn_items",
        "stock_ledger",
        "order_headers",
        "order_items",
        "production_stages",
        "production_stage_history",
        "production_schedules",
    }),
    )

LLM_ROLE = AIReadRole(
    name="tempo_llm_reader",
    tables=frozenset({
        "items_master",
        "raw_materials",
        "bom_headers",
        "bom_components",
        "purchase_bills",
        "purchase_bill_items",
        "grn_headers",
        "grn_items",
        "stock_ledger",
        "order_headers",
        "order_items",
        "production_stages",
        "production_stage_history",
        "production_schedules",
        "quotations"
    }),
)

AI_ROLES = (ML_ROLE, LLM_ROLE)

AI_SCHEMA = "public"