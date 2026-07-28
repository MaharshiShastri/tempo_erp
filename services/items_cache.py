import redis
import re

r = redis.Redis(
    host="redis",
    port=6379,
    db=2,
    decode_responses=True,
)

ITEM_LOOKUP = "tempo:item_lookup"


def normalize(code: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", code.upper())