"""数据库引擎、会话与迁移执行。"""
from __future__ import annotations

import sys
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

import psycopg
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings
from app.logging import get_logger

logger = get_logger("recall.db")

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"


class Base(DeclarativeBase):
    """所有 ORM 模型的基类；表结构由 migrations/*.sql 定义，不使用 metadata.create_all。"""


_engine: Engine | None = None
_session_factory: sessionmaker | None = None


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        _engine = create_engine(get_settings().database_url, pool_pre_ping=True, future=True)
    return _engine


def get_session_factory() -> sessionmaker:
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            bind=get_engine(), autoflush=False, expire_on_commit=False, future=True
        )
    return _session_factory


def get_db():
    """FastAPI 依赖：请求结束后关闭会话，事务由视图显式提交。"""
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()


@contextmanager
def session_scope() -> Iterator[Session]:
    """Worker / 脚本用：退出时自动 commit 或 rollback。"""
    session = get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def _dsn(url: str) -> str:
    return url.replace("postgresql+psycopg://", "postgresql://").replace("postgresql+asyncpg://", "postgresql://")


def run_migrations() -> list[str]:
    """顺序执行 migrations/*.sql，记录到 schema_migrations；整体幂等。"""
    settings = get_settings()
    dim = str(settings.embedding_dim)
    applied: list[str] = []
    dsn = _dsn(settings.database_url)
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "CREATE TABLE IF NOT EXISTS schema_migrations("
                "version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"
            )
            cur.execute("SELECT version FROM schema_migrations")
            done = {row[0] for row in cur.fetchall()}
            for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
                if path.name in done:
                    continue
                sql = path.read_text(encoding="utf-8").replace("{{EMBEDDING_DIM}}", dim)
                cur.execute(sql)
                cur.execute("INSERT INTO schema_migrations(version) VALUES (%s)", (path.name,))
                applied.append(path.name)
        conn.commit()
    if applied:
        logger.info("migrations_applied", extra={"migrations": applied})
    return applied


def main() -> int:
    if "--migrate" in sys.argv:
        applied = run_migrations()
        print(f"applied: {applied or 'none (already up to date)'}")
        return 0
    print("usage: python -m app.db --migrate")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
