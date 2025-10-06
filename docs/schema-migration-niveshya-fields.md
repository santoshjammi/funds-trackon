# Schema migration plan: tnifmc_* → niveshya_*

This document describes a safe, backward-compatible migration to rename legacy schema fields that contain "tnifmc" to use "niveshya" instead. The goal is to change user-facing semantics while avoiding downtime and preserving existing data and integrations.

## Scope

Collections and fields currently in use (examples, not exhaustive):

- Fundraising
  - tnifmc_request_inr_cr → niveshya_request_inr_cr
  - responsibility_tnifmc → responsibility_niveshya
- Meetings
  - tnifmc_representatives → niveshya_representatives

CSV/JSON imports and exports also include legacy column names like TNIFMC_Request_INR_Cr and Responsibility_TNIFMC.

## Principles

- Backward compatible first: support reading old and new field names during a transition window.
- No data loss: back up DB and export key collections before write changes.
- Incremental rollout: update server to understand both names, migrate data, then flip frontend, then deprecate.
- Fast rollback: keep old-name reads available until migration is complete and verified.

## Phased plan

1. Inventory and backup

- Snapshot MongoDB: mongodump of relevant databases/collections.
- Export fundraising and meetings collections to JSON for belt-and-suspenders.

1. Dual-read, dual-write server

- Update Pydantic models to expose new fields alongside old ones.
  - Accept both field names on input (aliases) and normalize internally.
  - On write/update, fill both the new and the old fields for a short period (feature flag or setting).
- Keep API response shape the same for existing clients; optionally include both names during the transition.

1. Data migration script (idempotent)

- Create a one-off script backend/scripts/migrate_fields_tnifmc_to_niveshya.py that:
  - For each Fundraising document:
    - If niveshya_request_inr_cr is null and tnifmc_request_inr_cr exists, copy value.
    - If responsibility_niveshya is empty and responsibility_tnifmc exists, copy value.
  - For each Meeting document:
    - If niveshya_representatives missing and tnifmc_representatives exists, copy array.
  - Mark a migration version or timestamp for audit.
- Run the script, verify counts before/after. Script must be safe to re-run.

1. Frontend flip with fallback

- Update frontend types to prefer niveshya_* fields, with a small fallback to old names.
- Test UIs end-to-end. Ensure search/sort work with new names.

1. Deprecation and cleanup

- Stop writing old fields (toggle off dual write) after a stability window.
- Remove old fields from responses (or keep behind a compatibility flag if external consumers rely on them).
- Remove CSV import reliance on old column names; keep a compatibility path if needed.

## Example: server-side compatibility patterns

- Pydantic v2 model fields can accept aliases for inbound data. For example, to accept either tnifmc_request_inr_cr or niveshya_request_inr_cr on input, define the canonical field as niveshya_request_inr_cr and an alias_from for the old name. During the transition, you can include both in responses to avoid breaking older clients.
- Repository/service layer: when persisting, set both fields if a feature flag (e.g., WRITE_COMPAT_TNIFMC_FIELDS=true) is on.

## Example: migration script outline (pseudocode)

```python
# backend/scripts/migrate_fields_tnifmc_to_niveshya.py
import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.fundraising import Fundraising
from app.models.meeting import Meeting
from app.utils.config import get_settings

async def migrate():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongo_uri)
    await init_beanie(database=client[settings.mongo_db], document_models=[Fundraising, Meeting])

    # Fundraising
    f_pending = await Fundraising.find({
        "$or": [
            {"niveshya_request_inr_cr": {"$exists": False}},
            {"responsibility_niveshya": {"$exists": False}}
        ]
    }).to_list()

    for f in f_pending:
        changed = False
        if getattr(f, "niveshya_request_inr_cr", None) in (None, "") and getattr(f, "tnifmc_request_inr_cr", None) not in (None, ""):
            f.niveshya_request_inr_cr = f.tnifmc_request_inr_cr
            changed = True
        if not getattr(f, "responsibility_niveshya", None) and getattr(f, "responsibility_tnifmc", None):
            f.responsibility_niveshya = f.responsibility_tnifmc
            changed = True
        if changed:
            await f.save()

    # Meetings
    m_pending = await Meeting.find({"niveshya_representatives": {"$exists": False}, "tnifmc_representatives": {"$exists": True}}).to_list()
    for m in m_pending:
        m.niveshya_representatives = getattr(m, "tnifmc_representatives", [])
        await m.save()

if __name__ == "__main__":
    asyncio.run(migrate())
```

Note: The exact field names and model attributes must match your final model changes when you implement them.

## Rollback plan

- If any issue is found:
  - Re-enable dual-write to old fields if disabled.
  - Revert frontend to consume old names (kept in responses during the window).
  - Restore from backups if data inconsistency is detected.

## Validation checklist

- Unit tests cover both input names and persistence to new fields.
- A small production sample validated manually in UI post-migration.
- Monitoring/alerts for API 4xx/5xx spikes during the cutover.

## Status

- This plan is documented. Implementation is pending explicit approval. No schema-breaking changes have been made yet.
