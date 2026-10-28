"""FastAPI 应用入口：python -m uvicorn app.main:app --port 8000"""
from __future__ import annotations

import time
import uuid
from contextlib import asynccontextmanager

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.api import auth_api, documents_api, health, search_api
from app.config import get_settings, validate_settings
from app.db import run_migrations
from app.errors import error_body, register_exception_handlers
from app.logging import get_logger, setup_logging

logger = get_logger("recall.api")


@asynccontextmanager
async def lifespan(app):
    settings = get_settings()
    run_migrations()
    validate_settings(settings)
    logger.info("api_started", extra={"ai_provider": settings.ai_provider,
                                      "embedding_provider": settings.embedding_provider,
                                      "embedding_dim": settings.embedding_dim})
    yield


def create_app():
    settings = get_settings()
    setup_logging(settings.log_level)
    from fastapi import FastAPI

    app = FastAPI(
        title="Recall API",
        version="0.1.0",
        description="个人链接收藏与智能找回引擎",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )
    register_exception_handlers(app)

    @app.middleware("http")
    async def access_log(request: Request, call_next):
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:16]
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = int((time.perf_counter() - started) * 1000)
            logger.exception(
                "request_failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "status": 500,
                },
            )
            return JSONResponse(
                status_code=500,
                content=error_body("INTERNAL_ERROR", "服务内部错误，请稍后重试。"),
                headers={"x-request-id": request_id},
            )
        duration_ms = int((time.perf_counter() - started) * 1000)
        if request.url.path.startswith("/api/"):
            logger.info(
                "request",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "status": response.status_code,
                },
            )
        response.headers["x-request-id"] = request_id
        return response

    api = APIRouter(prefix="/api/v1")
    api.include_router(health.router)
    api.include_router(auth_api.router)
    api.include_router(documents_api.router)
    api.include_router(search_api.router)
    app.include_router(api)
    return app


app = create_app()
