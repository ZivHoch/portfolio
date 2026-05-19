#!/usr/bin/env python3
"""Copy canonical knowledge from frontend/knowledge into backend/knowledge/."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "frontend" / "knowledge"
DST = ROOT / "backend" / "knowledge"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Source knowledge dir not found: {SRC}")

    DST.mkdir(parents=True, exist_ok=True)

    for path in SRC.rglob("*"):
        if path.is_file() and path.name != "config.json":
            rel = path.relative_to(SRC)
            target = DST / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
            print(f"Copied {rel}")

    print(f"Knowledge synced to {DST}")


if __name__ == "__main__":
    main()
