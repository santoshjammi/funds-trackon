"""
Meeting Controller - Handles meeting management and audio recording functionality
"""

import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status, Header, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime
import aiofiles

from app.models.meeting import Meeting, MeetingType, MeetingStatus, AudioProcessingStatus, MeetingAttendee
from app.models.fundraising import Fundraising
from app.models.contact import Contact
from app.models.user import User
from app.controllers.auth_controller import get_current_user
from app.services.audio_processing_service import AudioProcessingService

meeting_router = APIRouter(tags=["meetings"])

# Audio upload configuration
UPLOAD_DIR = "uploads/audio"
IMAGES_DIR = "uploads/images"
ALLOWED_AUDIO_TYPES = [
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/mpeg", "audio/mp3",
    "audio/webm",
    "audio/ogg",
    "audio/mp4", "audio/x-m4a"
]

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)
DUBS_DIR = "uploads/dubs"
os.makedirs(DUBS_DIR, exist_ok=True)

# Request/Response models
class MeetingCreateRequest(BaseModel):
    title: str
    meeting_type: MeetingType
    fundraising_id: str
    contact_id: Optional[str] = None
    scheduled_date: datetime
    location: Optional[str] = None
    is_virtual: bool = False
    agenda: Optional[str] = None
    attendees: List[MeetingAttendee] = []
    tnifmc_representatives: List[str] = []

class MeetingUpdateRequest(BaseModel):
    title: Optional[str] = None
    meeting_type: Optional[MeetingType] = None
    status: Optional[MeetingStatus] = None
    scheduled_date: Optional[datetime] = None
    actual_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    is_virtual: Optional[bool] = None
    agenda: Optional[str] = None
    discussion_points: Optional[str] = None
    action_items: Optional[str] = None
    notes: Optional[str] = None
    attendees: Optional[List[MeetingAttendee]] = None
    tnifmc_representatives: Optional[List[str]] = None

@meeting_router.post("/", response_model=dict)
async def create_meeting(
    meeting_data: MeetingCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new meeting for a fundraising campaign"""

    # Verify fundraising campaign exists
    fundraising = await Fundraising.get(meeting_data.fundraising_id)
    if not fundraising:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fundraising campaign not found"
        )

    # Verify contact exists if provided
    if meeting_data.contact_id:
        contact = await Contact.get(meeting_data.contact_id)
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )

    # Create meeting
    meeting = Meeting(
        title=meeting_data.title,
        meeting_type=meeting_data.meeting_type,
        status=MeetingStatus.SCHEDULED,
        fundraising_id=meeting_data.fundraising_id,
        contact_id=meeting_data.contact_id,
        scheduled_date=meeting_data.scheduled_date,
        location=meeting_data.location,
        is_virtual=meeting_data.is_virtual,
        agenda=meeting_data.agenda,
        attendees=meeting_data.attendees,
        tnifmc_representatives=meeting_data.tnifmc_representatives,
        created_by=str(current_user.id)
    )

    await meeting.insert()

    return {
        "message": "Meeting created successfully",
        "meeting_id": str(meeting.id),
        "meeting": meeting
    }

@meeting_router.get("/fundraising/{fundraising_id}", response_model=List[dict])
async def get_meetings_by_fundraising(
    fundraising_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all meetings for a specific fundraising campaign"""

    # Verify fundraising campaign exists
    fundraising = await Fundraising.get(fundraising_id)
    if not fundraising:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fundraising campaign not found"
        )

    meetings = await Meeting.find({"fundraising_id": fundraising_id}).sort([("scheduled_date", -1)]).to_list()

    return [
        {
            "id": str(meeting.id),
            "title": meeting.title,
            "meeting_type": meeting.meeting_type,
            "status": meeting.status,
            "scheduled_date": meeting.scheduled_date,
            "actual_date": meeting.actual_date,
            "duration_minutes": meeting.duration_minutes,
            "location": meeting.location,
            "is_virtual": meeting.is_virtual,
            "has_audio": meeting.audio_recording is not None,
            "audio_processing_status": meeting.audio_recording.processing_status if meeting.audio_recording else None,
            "created_at": meeting.created_at
        }
        for meeting in meetings
    ]

@meeting_router.get("/{meeting_id}", response_model=dict)
async def get_meeting_details(
    meeting_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific meeting"""

    meeting = await Meeting.get(meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    # Get related fundraising and contact information
    fundraising = await Fundraising.get(meeting.fundraising_id)
    contact = await Contact.get(meeting.contact_id) if meeting.contact_id else None

    return {
        "meeting": meeting,
        "fundraising": {
            "id": str(fundraising.id),
            "organisation": fundraising.organisation,
            "responsibility_tnifmc": fundraising.responsibility_tnifmc,
            "status_open_closed": fundraising.status_open_closed
        } if fundraising else None,
        "contact": {
            "id": str(contact.id),
            "name": contact.name,
            "designation": contact.designation,
            "organisation": contact.organisation,
            "email": contact.email
        } if contact else None
    }

@meeting_router.put("/{meeting_id}", response_model=dict)
async def update_meeting(
    meeting_id: str,
    update_data: MeetingUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update meeting information"""

    meeting = await Meeting.get(meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    # Update fields if provided
    update_dict = update_data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(meeting, field, value)

    meeting.updated_at = datetime.utcnow()
    await meeting.save()

    return {
        "message": "Meeting updated successfully",
        "meeting": meeting
    }

@meeting_router.post("/{meeting_id}/audio", response_model=dict)
async def upload_audio_recording(
    meeting_id: str,
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload audio recording for a meeting"""

    meeting = await Meeting.get(meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    # Validate file type (accept base type; allow common codecs and extensions)
    content_type = (audio_file.content_type or "").lower()
    base_type = content_type.split(';')[0]
    file_extension = os.path.splitext(audio_file.filename or "")[1].lower()
    allowed_exts = {'.wav', '.webm', '.mp3', '.ogg', '.m4a', '.mp4'}
    if base_type not in ALLOWED_AUDIO_TYPES and file_extension not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{content_type}'. Allowed types: {', '.join(ALLOWED_AUDIO_TYPES)} or extensions: {', '.join(sorted(allowed_exts))}"
        )

    # Generate unique filename
    file_extension = os.path.splitext(audio_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await audio_file.read()
            await f.write(content)
            file_size = len(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save audio file: {str(e)}"
        )

    # Update meeting with audio recording info
    from app.models.meeting import AudioRecording
    meeting.audio_recording = AudioRecording(
        filename=unique_filename,
        original_filename=audio_file.filename,
        file_size=file_size,
        processing_status=AudioProcessingStatus.NOT_STARTED
    )
    meeting.updated_at = datetime.utcnow()
    await meeting.save()

    return {
        "message": "Audio recording uploaded successfully",
        "meeting_id": meeting_id,
        "audio_filename": unique_filename,
        "file_size": file_size,
        "processing_status": AudioProcessingStatus.NOT_STARTED
    }

@meeting_router.get("/{meeting_id}/audio")
async def get_audio_recording(
    meeting_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download audio recording for a meeting"""

    meeting = await Meeting.get(meeting_id)
    if not meeting or not meeting.audio_recording:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio recording not found"
        )

    file_path = os.path.join(UPLOAD_DIR, meeting.audio_recording.filename)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found on disk"
        )

    # Pick a reasonable media type based on extension
    ext = os.path.splitext(meeting.audio_recording.original_filename or "")[1].lower()
    media_type = "audio/mpeg"
    if ext == ".wav":
        media_type = "audio/wav"
    elif ext == ".webm":
        media_type = "audio/webm"
    elif ext == ".ogg":
        media_type = "audio/ogg"
    elif ext in (".m4a", ".mp4"):
        media_type = "audio/mp4"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=meeting.audio_recording.original_filename
    )

@meeting_router.delete("/{meeting_id}", response_model=dict)
async def delete_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a meeting and its associated audio recording"""

    meeting = await Meeting.get(meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    # Delete associated audio file if exists
    if meeting.audio_recording:
        file_path = os.path.join(UPLOAD_DIR, meeting.audio_recording.filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    await meeting.delete()

    return {"message": "Meeting deleted successfully"}

@meeting_router.post("/{meeting_id}/process-audio", response_model=dict)
async def process_meeting_audio(
    meeting_id: str,
    x_openai_api_key: Optional[str] = Header(default=None, alias="X-OpenAI-API-Key"),
    force: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Trigger audio-to-text and AI analysis for a meeting's recording"""

    meeting = await Meeting.get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    if not meeting.audio_recording:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No audio recording to process")

    service = AudioProcessingService(api_key=x_openai_api_key)
    try:
        result = await service.process_audio_recording(meeting_id)
        return {"message": "Audio processed successfully", **result}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@meeting_router.get("/{meeting_id}/transcript")
async def download_transcript(
    meeting_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download meeting transcript as a text file"""
    meeting = await Meeting.get(meeting_id)
    if not meeting or not meeting.audio_recording or not meeting.audio_recording.transcript:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not available")

    transcript_text = meeting.audio_recording.transcript
    filename_safe_title = (meeting.title or "meeting").strip().replace("/", "-")
    download_name = f"{filename_safe_title}_transcript.txt"

    headers = {
        "Content-Disposition": f"attachment; filename=\"{download_name}\""
    }
    return Response(content=transcript_text, media_type="text/plain", headers=headers)


class CustomPromptRequest(BaseModel):
    prompt: str
    meeting_ids: Optional[List[str]] = None

class InfographicRequest(BaseModel):
    description: str

class AutoDubRequest(BaseModel):
    voice: Optional[str] = "alloy"
    format: Optional[str] = "mp3"

@meeting_router.post("/{meeting_id}/prompt", response_model=dict)
async def generate_custom_prompt(
    meeting_id: str,
    request: CustomPromptRequest,
    x_openai_api_key: Optional[str] = Header(default=None, alias="X-OpenAI-API-Key"),
    current_user: User = Depends(get_current_user)
):
    """Run a custom prompt against the meeting transcript"""

    service = AudioProcessingService(api_key=x_openai_api_key)
    try:
        result = await service.generate_meeting_insights(meeting_id, request.prompt)
        return {"message": "Prompt processed", **result}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@meeting_router.post("/{meeting_id}/infographic", response_model=dict)
async def generate_infographic(
    meeting_id: str,
    request: InfographicRequest,
    x_openai_api_key: Optional[str] = Header(default=None, alias="X-OpenAI-API-Key"),
    current_user: User = Depends(get_current_user)
):
    """Generate and persist an infographic image for a meeting using AI, saved on local disk."""

    meeting = await Meeting.get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    service = AudioProcessingService(api_key=x_openai_api_key)
    try:
        result = await service.generate_infographic_for_meeting(meeting_id, request.description, IMAGES_DIR)
        # Persist metadata on meeting
        meeting.infographic_filename = result["filename"]
        meeting.infographic_description = request.description
        meeting.infographic_generated_at = datetime.utcnow()
        await meeting.save()

        return {
            "message": "Infographic generated",
            "filename": result["filename"],
            "url": f"/api/meetings/{meeting_id}/infographic",
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@meeting_router.get("/{meeting_id}/infographic")
async def get_infographic(
    meeting_id: str,
    current_user: User = Depends(get_current_user)
):
    """Serve the infographic image for a meeting if it exists."""
    meeting = await Meeting.get(meeting_id)
    if not meeting or not meeting.infographic_filename:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Infographic not found")

    file_path = os.path.join(IMAGES_DIR, meeting.infographic_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Infographic file not found on disk")

    return FileResponse(path=file_path, media_type="image/png", filename=meeting.infographic_filename)

@meeting_router.post("/{meeting_id}/autodub", response_model=dict)
async def create_autodub(
    meeting_id: str,
    request: AutoDubRequest,
    x_openai_api_key: Optional[str] = Header(default=None, alias="X-OpenAI-API-Key"),
    current_user: User = Depends(get_current_user)
):
    """Create an English dub from the meeting's transcript (auto-translate if needed) and save as audio."""
    meeting = await Meeting.get(meeting_id)
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    service = AudioProcessingService(api_key=x_openai_api_key)
    try:
        result = await service.auto_dub_meeting(meeting_id, target_voice=request.voice or "alloy", audio_format=request.format or "mp3")
        # Persist already handled in service (filename/text/timestamps)
        return {"message": "Autodub created", **result}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@meeting_router.get("/{meeting_id}/autodub")
async def get_autodub(
    meeting_id: str,
    current_user: User = Depends(get_current_user)
):
    """Serve the autodubbed English audio if it exists."""
    meeting = await Meeting.get(meeting_id)
    if not meeting or not meeting.dub_filename:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Autodub not found")

    file_path = os.path.join(DUBS_DIR, meeting.dub_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Autodub file not found on disk")

    # Determine media type
    ext = os.path.splitext(meeting.dub_filename)[1].lower()
    media_type = "audio/mpeg" if ext == ".mp3" else "audio/wav" if ext == ".wav" else "audio/ogg" if ext == ".ogg" else "application/octet-stream"
    return FileResponse(path=file_path, media_type=media_type, filename=meeting.dub_filename)

@meeting_router.post("/fundraising/{fundraising_id}/prompt", response_model=dict)
async def generate_campaign_prompt(
    fundraising_id: str,
    request: CustomPromptRequest,
    x_openai_api_key: Optional[str] = Header(default=None, alias="X-OpenAI-API-Key"),
    current_user: User = Depends(get_current_user)
):
    """Run a custom prompt across all meetings for a fundraising campaign.
    Optionally include a subset of meeting_ids to restrict the context.
    """

    # Verify fundraising campaign exists
    fundraising = await Fundraising.get(fundraising_id)
    if not fundraising:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fundraising campaign not found"
        )

    service = AudioProcessingService(api_key=x_openai_api_key)
    try:
        result = await service.generate_campaign_insights(fundraising_id, request.prompt, request.meeting_ids)
        return {"message": "Prompt processed", **result}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))