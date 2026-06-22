import time
from fastapi import Request
from core.logging import logger

async def logging_middleware(request: Request, call_next):
    start = time.time()

    try:
        response = await call_next(request)

        logger.info(
            f"{request.method} {request.url.path} "
            f"{response.status_code} "
            f"{time.time()-start:.3f}s"
        )

        return response

    except Exception:
        logger.exception(
            f"Unhandled exception: {request.method} {request.url.path}"
        )
        raise