"""
Joplin integration controller — REST endpoints for browsing Joplin notes
and syncing them to the CRM as Tasks and Opportunities.
"""

import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.controllers.auth_controller import get_current_user
from app.models.joplin import JoplinSyncRecord
from app.models.user import User
from app.services.joplin_service import JoplinService

logger = logging.getLogger(__name__)

joplin_router = APIRouter(tags=["joplin"])


def _svc_for(user: User) -> JoplinService:
    """Create a JoplinService instance using the current user's credentials."""
    return JoplinService(
        base_url=user.joplin_base_url or None,
        token=user.joplin_api_token or None,
        openrouter_key=user.openrouter_api_key or None,
        openai_key=user.openai_api_key or None,
        claude_key=user.claude_api_key or None,
        master_password=user.joplin_master_password or None,
    )


# ------------------------------------------------------------------ #
# Connectivity                                                         #
# ------------------------------------------------------------------ #


@joplin_router.get("/status", summary="Check Joplin connectivity")
async def joplin_status(
    current_user: User = Depends(get_current_user),
):
    """Returns whether the backend can reach the Joplin REST API."""
    return await _svc_for(current_user).get_status()


# ------------------------------------------------------------------ #
# Notebooks & Tags                                                     #
# ------------------------------------------------------------------ #


@joplin_router.get("/notebooks", summary="List Joplin notebooks")
async def list_notebooks(
    current_user: User = Depends(get_current_user),
):
    try:
        return await _svc_for(current_user).list_notebooks()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Joplin error: {exc}") from exc


@joplin_router.get("/tags", summary="List Joplin tags")
async def list_tags(
    current_user: User = Depends(get_current_user),
):
    try:
        return await _svc_for(current_user).list_tags()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Joplin error: {exc}") from exc


# ------------------------------------------------------------------ #
# Notes                                                                #
# ------------------------------------------------------------------ #


@joplin_router.get("/notes", summary="List Joplin notes")
async def list_notes(
    notebook_id: Optional[str] = Query(None, description="Filter by notebook ID"),
    tag_id: Optional[str] = Query(None, description="Filter by tag ID"),
    search: Optional[str] = Query(None, description="Full-text search query"),
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    try:
        return await _svc_for(current_user).list_notes(
            notebook_id=notebook_id,
            tag_id=tag_id,
            search=search,
            page=page,
            limit=limit,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Joplin error: {exc}") from exc


@joplin_router.get("/notes/{note_id}", summary="Fetch a Joplin note's content")
async def preview_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
):
    """Returns the raw note content — no LLM call, no DB writes."""
    try:
        svc = _svc_for(current_user)
        note = await svc.get_note(note_id)
        return {"note": note}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Joplin error: {exc}") from exc


@joplin_router.post("/notes/{note_id}/extract", summary="Extract tasks/opportunities from a note (preview only)")
async def extract_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
):
    """Runs LLM extraction on the note and returns structured data — nothing is saved."""
    try:
        svc = _svc_for(current_user)
        note = await svc.get_note(note_id)
        extracted = await svc.extract_crm_data(
            note.get("title", ""),
            note.get("body", ""),
        )
        return {"note": note, "extracted": extracted}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Extraction error: {exc}") from exc


# ------------------------------------------------------------------ #
# Sync                                                                 #
# ------------------------------------------------------------------ #


class SyncNoteRequest(BaseModel):
    fundraising_id: Optional[str] = None
    contact_id: Optional[str] = None
    meeting_id: Optional[str] = None


@joplin_router.post("/sync/{note_id}", summary="Sync a Joplin note → Tasks + Opportunities")
async def sync_note(
    note_id: str,
    body: SyncNoteRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Extracts action items and opportunities from the note (via LLM) and
    persists them as Task and Opportunity documents in MongoDB.
    Deduplicates by note ID + content hash.
    """
    try:
        result = await _svc_for(current_user).sync_note(
            note_id=note_id,
            fundraising_id=body.fundraising_id,
            contact_id=body.contact_id,
            meeting_id=body.meeting_id,
            created_by=str(current_user.id),
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to sync Joplin note %s", note_id)
        raise HTTPException(status_code=500, detail=f"Sync failed: {exc}") from exc


# ------------------------------------------------------------------ #
# Synced-note lookup                                                   #
# ------------------------------------------------------------------ #


@joplin_router.get("/synced-notes", summary="List synced notes for a campaign or meeting")
async def list_synced_notes(
    fundraising_id: Optional[str] = Query(None),
    meeting_id: Optional[str] = Query(None),
    contact_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all JoplinSyncRecords associated with a given fundraising campaign,
    meeting, or contact.  At least one filter must be provided.
    """
    if not any([fundraising_id, meeting_id, contact_id]):
        raise HTTPException(status_code=400, detail="Provide at least one of fundraising_id, meeting_id, or contact_id")

    filters = []
    if fundraising_id:
        filters.append(JoplinSyncRecord.fundraising_id == fundraising_id)
    if meeting_id:
        filters.append(JoplinSyncRecord.meeting_id == meeting_id)
    if contact_id:
        filters.append(JoplinSyncRecord.contact_id == contact_id)

    # OR across supplied filters
    from beanie.operators import Or
    records = await JoplinSyncRecord.find(Or(*filters)).to_list()

    return [
        {
            "note_id": r.note_id,
            "note_title": r.note_title,
            "last_synced_at": r.last_synced_at.isoformat(),
            "fundraising_id": r.fundraising_id,
            "meeting_id": r.meeting_id,
            "contact_id": r.contact_id,
            "tasks_created": len(r.task_ids),
            "opportunities_created": len(r.opportunity_ids),
            "task_ids": r.task_ids,
            "opportunity_ids": r.opportunity_ids,
            "audio_url": f"/api/joplin/synced-notes/{r.note_id}/audio" if r.audio_filename else None,
            "infographic_url": f"/api/joplin/synced-notes/{r.note_id}/infographic" if r.infographic_filename else None,
            "has_body": bool(r.note_body),
        }
        for r in records
    ]


# ------------------------------------------------------------------ #
# Asset serving                                                        #
# ------------------------------------------------------------------ #


@joplin_router.get("/synced-notes/{note_id}/audio", summary="Stream TTS audio for a synced note")
async def get_note_audio(
    note_id: str,
    current_user: User = Depends(get_current_user),
):
    record = await JoplinSyncRecord.find_one(JoplinSyncRecord.note_id == note_id)
    if not record or not record.audio_filename:
        raise HTTPException(status_code=404, detail="Audio not generated for this note")
    path = os.path.join("uploads/audio", record.audio_filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Audio file not found on disk")
    return FileResponse(path, media_type="audio/mpeg", filename=record.audio_filename)


@joplin_router.get("/synced-notes/{note_id}/infographic", summary="Serve infographic for a synced note")
async def get_note_infographic(
    note_id: str,
    current_user: User = Depends(get_current_user),
):
    record = await JoplinSyncRecord.find_one(JoplinSyncRecord.note_id == note_id)
    if not record or not record.infographic_filename:
        raise HTTPException(status_code=404, detail="Infographic not generated for this note")
    path = os.path.join("uploads/images", record.infographic_filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Infographic file not found on disk")
    return FileResponse(path, media_type="image/png", filename=record.infographic_filename)


@joplin_router.get("/synced-notes/{note_id}/text", summary="Return stored note body text")
async def get_note_text(
    note_id: str,
    current_user: User = Depends(get_current_user),
):
    record = await JoplinSyncRecord.find_one(JoplinSyncRecord.note_id == note_id)
    if not record or not record.note_body:
        raise HTTPException(status_code=404, detail="Note body not stored")
    return {"note_id": note_id, "note_title": record.note_title, "body": record.note_body}
