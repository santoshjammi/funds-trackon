"""
Backfill migration: tnifmc_* → niveshya_*

Usage:
  python -m backend.scripts.migrate_fields_tnifmc_to_niveshya
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from datetime import datetime

from app.utils.config import get_settings
from app.models.fundraising import Fundraising
from app.models.meeting import Meeting


async def migrate():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    await init_beanie(database=db, document_models=[Fundraising, Meeting])

    # Fundraising migration
    f_cursor = Fundraising.find({}).to_list
    count_f = 0
    campaigns = await Fundraising.find({}).to_list()
    for f in campaigns:
        changed = False
        if getattr(f, "niveshya_request_inr_cr", None) in (None, "") and getattr(f, "tnifmc_request_inr_cr", None) not in (None, ""):
            f.niveshya_request_inr_cr = f.tnifmc_request_inr_cr
            changed = True
        if not getattr(f, "responsibility_niveshya", None) and getattr(f, "responsibility_tnifmc", None):
            f.responsibility_niveshya = f.responsibility_tnifmc
            changed = True
        if changed:
            f.updated_at = datetime.utcnow()
            await f.save()
            count_f += 1

    # Meetings migration
    count_m = 0
    meetings = await Meeting.find({}).to_list()
    for m in meetings:
        reps_legacy = getattr(m, "tnifmc_representatives", None)
        reps_new = getattr(m, "niveshya_representatives", None)
        if reps_new is None and reps_legacy:
            m.niveshya_representatives = reps_legacy
            m.updated_at = datetime.utcnow()
            await m.save()
            count_m += 1

    print(f"Updated fundraising docs: {count_f}")
    print(f"Updated meeting docs: {count_m}")


if __name__ == "__main__":
    asyncio.run(migrate())
