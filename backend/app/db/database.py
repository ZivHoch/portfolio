import os
from contextlib import contextmanager
from typing import Generator, Optional

import psycopg2
from psycopg2.extensions import connection as PgConnection

try:
    from pgvector.psycopg2 import register_vector
except ImportError:  # pragma: no cover
    register_vector = None  # type: ignore


def database_url() -> Optional[str]:
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    host = os.getenv("POSTGRES_SERVER", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "pgdb")
    user = os.getenv("POSTGRES_USER", "pguser")
    password = os.getenv("POSTGRES_PASSWORD", "docker")
    return f"postgresql://{user}:{password}@{host}:{port}/{db}"


def is_database_configured() -> bool:
    return bool(database_url())


@contextmanager
def get_connection() -> Generator[PgConnection, None, None]:
    url = database_url()
    if not url:
        raise RuntimeError("Database URL is not configured")

    conn = psycopg2.connect(url)
    try:
        if register_vector is not None:
            register_vector(conn)
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_schema() -> None:
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, encoding="utf-8") as f:
        sql = f.read()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
