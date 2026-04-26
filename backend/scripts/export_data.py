#!/usr/bin/env python3
"""
Data Export Script for Funds-Trackon Lead Management System

Exports every MongoDB collection to dated JSON snapshots in data/exports/<timestamp>/.
A convenience symlink data/exports/latest always points to the most recent export.

Usage:
    python scripts/export_data.py                    # export all collections
    python scripts/export_data.py --out /some/path   # custom output directory
    python scripts/export_data.py --collections contacts,users  # subset

The export files use the same field names that import_data.py and the live
application write, so they can be used as authoritative restore sources.
"""

import asyncio
import json
import os
import sys
import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

# Allow running from project root or scripts/ directory
sys.path.append(str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.utils.config import get_settings

# Collections to export (matches every model class in app/models/)
ALL_COLLECTIONS = [
    "contacts",
    "organizations",
    "users",
    "opportunities",
    "fundraising",
    "tasks",
    "tracker",
    "meetings",
    "knowledge_base",
    "joplin_sync_records",
    "ai_conversations",
    "roles",
    "permissions",
]


def _json_serialiser(obj: Any) -> Any:
    """Make MongoDB-native types JSON-serialisable."""
    from bson import ObjectId
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serialisable")


async def export_collection(
    db,
    collection_name: str,
    out_dir: Path,
) -> int:
    """
    Export one collection to <out_dir>/<collection_name>.json.
    Returns the number of documents written.
    """
    collection = db[collection_name]
    cursor = collection.find({})
    docs: List[Dict] = []

    async for doc in cursor:
        # Convert ObjectId _id to string so the file is plain JSON
        doc["_id"] = str(doc["_id"])
        docs.append(doc)

    out_file = out_dir / f"{collection_name}.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(docs, f, indent=2, default=_json_serialiser, ensure_ascii=False)

    return len(docs)


async def run_export(out_dir: Path, collections: List[str]) -> None:
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)

    try:
        await client.admin.command("ping")
    except Exception as e:
        print(f"❌ Cannot connect to MongoDB at {settings.mongodb_url}: {e}")
        sys.exit(1)

    db = client[settings.database_name]
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"📦 Exporting database '{settings.database_name}' → {out_dir}")
    print()

    total_docs = 0
    results: List[Dict] = []

    for name in collections:
        try:
            count = await export_collection(db, name, out_dir)
            status = "✅" if count > 0 else "–"
            print(f"  {status}  {name:<25} {count:>6} documents")
            results.append({"collection": name, "count": count, "error": None})
            total_docs += count
        except Exception as e:
            print(f"  ❌  {name:<25} ERROR: {e}")
            results.append({"collection": name, "count": 0, "error": str(e)})

    # Write a manifest so we know when and from where this export came
    manifest = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "mongodb_url": settings.mongodb_url,
        "database": settings.database_name,
        "total_documents": total_docs,
        "collections": results,
    }
    manifest_path = out_dir / "_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print()
    print(f"✅  Export complete — {total_docs} total documents")
    print(f"📄  Manifest: {manifest_path}")

    client.close()


def make_latest_symlink(exports_root: Path, target: Path) -> None:
    """Point exports_root/latest → target (best-effort, skipped on Windows)."""
    link = exports_root / "latest"
    try:
        if link.is_symlink() or link.exists():
            link.unlink()
        link.symlink_to(target.name)
    except (OSError, NotImplementedError):
        pass  # Windows without developer mode — symlink creation is optional


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export all MongoDB collections to JSON snapshots."
    )
    parser.add_argument(
        "--out",
        metavar="DIR",
        help=(
            "Output directory. Defaults to data/exports/<timestamp> "
            "relative to the project root."
        ),
    )
    parser.add_argument(
        "--collections",
        metavar="LIST",
        help="Comma-separated list of collection names to export (default: all).",
    )
    args = parser.parse_args()

    collections = (
        [c.strip() for c in args.collections.split(",") if c.strip()]
        if args.collections
        else ALL_COLLECTIONS
    )

    if args.out:
        out_dir = Path(args.out).expanduser().resolve()
        exports_root = out_dir.parent
    else:
        project_root = Path(__file__).parent.parent.parent
        exports_root = project_root / "data" / "exports"
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_dir = exports_root / timestamp

    asyncio.run(run_export(out_dir, collections))

    if not args.out:
        make_latest_symlink(exports_root, out_dir)
        print(f"🔗  Latest: {exports_root / 'latest'}")


if __name__ == "__main__":
    main()
