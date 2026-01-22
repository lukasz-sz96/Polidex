import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "polidex.db"


def migrate():
    if not DB_PATH.exists():
        print("Database not found, skipping migration (will be created with new schema)")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(query_logs)")
    columns = [col[1] for col in cursor.fetchall()]

    if "prompt_tokens" not in columns:
        print("Adding prompt_tokens column...")
        cursor.execute("ALTER TABLE query_logs ADD COLUMN prompt_tokens INTEGER NOT NULL DEFAULT 0")

    if "completion_tokens" not in columns:
        print("Adding completion_tokens column...")
        cursor.execute("ALTER TABLE query_logs ADD COLUMN completion_tokens INTEGER NOT NULL DEFAULT 0")

    if "cost" not in columns:
        print("Adding cost column...")
        cursor.execute("ALTER TABLE query_logs ADD COLUMN cost REAL NOT NULL DEFAULT 0.0")

    conn.commit()
    conn.close()
    print("Migration complete!")


if __name__ == "__main__":
    migrate()
