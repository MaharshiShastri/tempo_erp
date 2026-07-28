import re

from services.items_cache import r, ITEM_LOOKUP, normalize

ITEM_REGEX = re.compile(r"TI-[0-9A-Z-]+", re.I)

def resolve_item_code(stock_name: str):
    if not stock_name:
        return None

    match = ITEM_REGEX.search(stock_name.upper())

    if not match:
        return None
    
    raw = match.group(0)

    return r.hget(ITEM_LOOKUP, normalize(raw),)