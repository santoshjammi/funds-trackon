"""
JoplinSyncRecord model — tracks which Joplin notes have been synced to the CRM
and their content hash for deduplication.
"""

from beanie import Document
from pydantic import Field
from typing import List, Optional
from datetime import datetime


class JoplinSyncRecord(Document):
    """Persists the sync state for each Joplin note."""

    note_id: str = Field(..., description="Joplin note UUID")
    note_title: str = Field("", description="Note title at last sync")
    content_hash: str = Field(..., description="SHA-256 of note body at last sync")
    last_synced_at: datetime = Field(default_factory=datetime.utcnow)

    # CRM links used during sync
    fundraising_id: Optional[str] = Field(None)
    contact_id: Optional[str] = Field(None)
    meeting_id: Optional[str] = Field(None)
    synced_by: Optional[str] = Field(None, description="User ID who triggered sync")

    # IDs of CRM records created from this note
    task_ids: List[str] = Field(default_factory=list)
    opportunity_ids: List[str] = Field(default_factory=list)

    # Stored note content
    note_body: Optional[str] = Field(None, description="Raw note body text at last sync")

    # Generated assets (filenames relative to their upload dirs)
    audio_filename: Optional[str] = Field(None, description="TTS audio file (mp3)")
    infographic_filename: Optional[str] = Field(None, description="DALL-E infographic (png)")

    class Settings:
        name = "joplin_sync_records"
        indexes = ["note_id"]
