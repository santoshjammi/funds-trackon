"""
Joplin integration service.

Connects to the Joplin Web Clipper REST API (localhost:41184 by default),
uses an OpenRouter-hosted LLM to extract CRM data from note content, and
creates Task + Opportunity records in MongoDB while tracking sync state to
avoid duplicates.
"""

import hashlib
import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from openai import AsyncOpenAI

from app.models.joplin import JoplinSyncRecord
from app.models.opportunity import Opportunity, OpportunityStatus
from app.models.task import Task, TaskStatus, TaskType
from app.utils.config import get_settings

logger = logging.getLogger(__name__)


class JoplinService:
    def __init__(
        self,
        base_url: Optional[str] = None,
        token: Optional[str] = None,
        openrouter_key: Optional[str] = None,
        openai_key: Optional[str] = None,
        claude_key: Optional[str] = None,
        master_password: Optional[str] = None,
    ) -> None:
        settings = get_settings()
        self.base_url: str = (base_url or settings.joplin_base_url).rstrip("/")
        self.token: str = token or settings.joplin_api_token or ""
        self.master_password: Optional[str] = master_password or None

        # Resolve LLM provider: openrouter → openai → claude → env fallback
        _env_openrouter = settings.openrouter_api_key or ""
        _env_openai = os.getenv("OPENAI_API_KEY", "")

        self.openrouter_key: str = openrouter_key or _env_openrouter
        self.openai_key: str = openai_key or _env_openai
        self.claude_key: str = claude_key or ""
        self.model: str = settings.openrouter_model
        self._llm: Optional[AsyncOpenAI] = None

    # ------------------------------------------------------------------ #
    # LLM helper                                                           #
    # ------------------------------------------------------------------ #

    def _get_llm(self) -> AsyncOpenAI:
        """Return an OpenAI-compatible async client (OpenRouter or direct OpenAI)."""
        if self._llm is None:
            if self.openrouter_key:
                self._llm = AsyncOpenAI(
                    api_key=self.openrouter_key,
                    base_url="https://openrouter.ai/api/v1",
                )
            elif self.openai_key:
                self._llm = AsyncOpenAI(api_key=self.openai_key)
        return self._llm  # may be None if only claude_key is set

    async def _llm_complete(self, system_msg: str, user_msg: str) -> str:
        """Unified async chat completion across providers."""
        # Claude (Anthropic) path
        if not self.openrouter_key and not self.openai_key and self.claude_key:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self.claude_key)
            resp = await client.messages.create(
                model="claude-3-5-haiku-latest",
                system=system_msg,
                messages=[{"role": "user", "content": user_msg}],
                max_tokens=2000,
                temperature=0.2,
            )
            return (resp.content[0].text or "{}").strip()

        # OpenAI-compatible path (OpenRouter or direct OpenAI)
        llm = self._get_llm()
        if llm is None:
            raise RuntimeError(
                "No AI API key configured for Joplin note extraction. "
                "Add an OpenRouter, OpenAI, or Claude key in Account Settings → AI Keys."
            )
        model = self.model if self.openrouter_key else "gpt-4"
        completion = await llm.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.2,
        )
        return (completion.choices[0].message.content or "{}").strip()

    # ------------------------------------------------------------------ #
    # Joplin connectivity                                                  #
    # ------------------------------------------------------------------ #

    async def get_status(self) -> Dict[str, Any]:
        """Ping the Joplin REST API and report connectivity."""
        if not self.token:
            return {"connected": False, "error": "JOPLIN_API_TOKEN not configured"}
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{self.base_url}/ping",
                    params={"token": self.token},
                )
                if resp.status_code == 200:
                    return {"connected": True, "joplin_response": resp.text.strip()}
                return {"connected": False, "error": f"HTTP {resp.status_code}"}
        except Exception as exc:
            return {"connected": False, "error": str(exc)}

    async def list_notebooks(self) -> List[Dict[str, Any]]:
        """Return all notebooks (folders)."""
        return await self._paginated_get("folders", fields="id,title,parent_id")

    async def list_tags(self) -> List[Dict[str, Any]]:
        """Return all tags."""
        return await self._paginated_get("tags", fields="id,title")

    async def list_notes(
        self,
        notebook_id: Optional[str] = None,
        tag_id: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 30,
    ) -> Dict[str, Any]:
        """List notes with optional notebook, tag, or free-text filter."""
        fields = "id,title,body,created_time,updated_time,parent_id"
        params: Dict[str, Any] = {
            "token": self.token,
            "fields": fields,
            "limit": limit,
            "page": page,
        }

        if search:
            endpoint = "search"
            params["query"] = search
        elif tag_id:
            endpoint = f"tags/{tag_id}/notes"
        elif notebook_id:
            endpoint = f"folders/{notebook_id}/notes"
        else:
            endpoint = "notes"

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(f"{self.base_url}/{endpoint}", params=params)
            resp.raise_for_status()
            data = resp.json()

        # Joplin returns { items: [...], has_more: bool } or a plain list
        if isinstance(data, list):
            return {"items": data, "has_more": False, "page": page}
        return {**data, "page": page}

    async def get_note(self, note_id: str) -> Dict[str, Any]:
        """Fetch a single note with its full body, decrypting if necessary."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{self.base_url}/notes/{note_id}",
                params={
                    "token": self.token,
                    "fields": "id,title,body,created_time,updated_time,parent_id",
                },
            )
            resp.raise_for_status()
            note = resp.json()

        body = note.get("body", "") or ""
        if self.master_password and self._looks_encrypted(body):
            try:
                note["body"] = self._decrypt_note_body(body, self.master_password)
            except Exception as exc:
                logger.warning("Failed to decrypt note %s: %s", note_id, exc)

        return note

    @staticmethod
    def _looks_encrypted(body: str) -> bool:
        """Heuristic: Joplin encrypted bodies start with a specific header."""
        return body.startswith("JED01") or body.startswith("JEX01")

    @staticmethod
    def _decrypt_note_body(body: str, password: str) -> str:
        """
        Decrypt a Joplin E2EE note body (JED01 format).

        Joplin E2EE format (simplified):
          JED01\n<base64-encoded JSON envelope>

        The envelope contains:
          { "version": 1, "salt": <hex>, "iv": <hex>, "ct": <hex>, "keyChecksum": <hex> }

        Key derivation: PBKDF2-HMAC-SHA256, 10000 iterations, 256-bit key (salt from envelope).
        Cipher: AES-256-CBC.
        """
        import base64
        import hashlib
        import json
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives import padding

        # Strip the header line
        lines = body.split("\n", 1)
        if len(lines) < 2:
            return body  # not actually encrypted

        envelope_b64 = lines[1].strip()
        try:
            envelope = json.loads(base64.b64decode(envelope_b64))
        except Exception:
            return body  # cannot parse — return as-is

        salt_hex = envelope.get("salt", "")
        iv_hex = envelope.get("iv", "")
        ct_hex = envelope.get("ct", "")

        if not (salt_hex and iv_hex and ct_hex):
            return body

        salt = bytes.fromhex(salt_hex)
        iv = bytes.fromhex(iv_hex)
        ct = bytes.fromhex(ct_hex)

        # Derive key with PBKDF2
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000, dklen=32)

        # Decrypt AES-256-CBC
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        padded_plain = decryptor.update(ct) + decryptor.finalize()

        # Remove PKCS7 padding
        unpadder = padding.PKCS7(128).unpadder()
        plain = unpadder.update(padded_plain) + unpadder.finalize()

        return plain.decode("utf-8")

    # ------------------------------------------------------------------ #
    # LLM extraction                                                       #
    # ------------------------------------------------------------------ #

    async def extract_crm_data(self, note_title: str, note_body: str) -> Dict[str, Any]:
        """
        Send note content to an LLM and extract structured CRM data:
        action items (→ Tasks) and investment opportunities (→ Opportunities).
        Uses whichever AI key the user has configured (OpenRouter, OpenAI, or Claude).
        """
        system_msg = (
            "You are an assistant that extracts structured CRM data from investment meeting notes. "
            "Return ONLY valid JSON — no markdown fences, no explanation."
        )

        user_msg = f"""Extract action items and investment opportunities from the meeting note below.

Note title: {note_title}

Note body:
{note_body[:6000]}

Return a JSON object with EXACTLY these keys:
{{
  "action_items": [
    {{
      "title": "short task title",
      "description": "additional detail or empty string",
      "priority": "High" | "Medium" | "Low",
      "task_type": "Call" | "Meeting" | "Email" | "Follow Up" | "Research" | "Presentation" | "Other"
    }}
  ],
  "opportunities": [
    {{
      "title": "opportunity title",
      "description": "details",
      "organisation": "investor or organisation name",
      "estimated_value": null or number (INR Crores),
      "probability": null or number 0-100
    }}
  ],
  "participants": ["name1", "name2"],
  "follow_up_date": null or "YYYY-MM-DD"
}}"""

        raw = await self._llm_complete(system_msg, user_msg)

        # Strip accidental markdown fences
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("LLM returned non-JSON output: %s", raw[:300])
            return {
                "action_items": [],
                "opportunities": [],
                "participants": [],
                "follow_up_date": None,
            }

    # ------------------------------------------------------------------ #
    # Sync orchestration                                                   #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _hash(text: str) -> str:
        return hashlib.sha256(text.encode()).hexdigest()

    async def _generate_tts_for_note(self, note_id: str, title: str, body: str) -> Optional[str]:
        """Generate a TTS MP3 for a note's content using OpenAI. Returns filename or None."""
        if not self.openai_key:
            return None
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.openai_key)
            # Truncate to avoid TTS limits (4096 chars)
            text = f"{title}.\n\n{body}"[:4000]
            audio_dir = "uploads/audio"
            os.makedirs(audio_dir, exist_ok=True)
            filename = f"joplin_{note_id}.mp3"
            path = os.path.join(audio_dir, filename)
            tts = client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text,
            )
            audio_bytes = tts.read() if hasattr(tts, "read") else tts.content
            with open(path, "wb") as f:
                f.write(audio_bytes)
            return filename
        except Exception as exc:
            logger.warning("TTS generation failed for note %s: %s", note_id, exc)
            return None

    async def _generate_infographic_for_note(self, note_id: str, title: str, extracted: Dict[str, Any]) -> Optional[str]:
        """Generate a DALL-E infographic summarising note extractions. Returns filename or None."""
        if not self.openai_key:
            return None
        try:
            from openai import OpenAI
            import requests as _requests
            client = OpenAI(api_key=self.openai_key)
            participants = ", ".join(extracted.get("participants", [])) or "unspecified"
            tasks = "; ".join(i.get("title", "") for i in extracted.get("action_items", [])[:4]) or "none"
            opps = "; ".join(o.get("title", "") for o in extracted.get("opportunities", [])[:3]) or "none"
            prompt = (
                f"Create a clean, professional infographic on a white background for a CRM note titled \"{title}\". "
                f"Participants: {participants}. Action items: {tasks}. Opportunities: {opps}. "
                "Minimal color palette, concise labels, no real photos."
            )
            img = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            image_url = img.data[0].url
            resp = _requests.get(image_url, timeout=30)
            resp.raise_for_status()
            images_dir = "uploads/images"
            os.makedirs(images_dir, exist_ok=True)
            filename = f"joplin_{note_id}.png"
            with open(os.path.join(images_dir, filename), "wb") as f:
                f.write(resp.content)
            return filename
        except Exception as exc:
            logger.warning("Infographic generation failed for note %s: %s", note_id, exc)
            return None

    async def sync_note(
        self,
        note_id: str,
        fundraising_id: Optional[str] = None,
        contact_id: Optional[str] = None,
        meeting_id: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Sync a Joplin note to the CRM:
        1. Fetch note from Joplin.
        2. Check deduplication (note_id + content hash).
        3. Extract action items / opportunities via LLM.
        4. Create Task and Opportunity documents in MongoDB.
        5. Persist JoplinSyncRecord.
        """
        note = await self.get_note(note_id)
        body: str = note.get("body", "")
        title: str = note.get("title", "Untitled")
        content_hash = self._hash(body)

        # --- Deduplication ---
        existing: Optional[JoplinSyncRecord] = await JoplinSyncRecord.find_one(
            JoplinSyncRecord.note_id == note_id
        )
        if existing and existing.content_hash == content_hash:
            return {
                "skipped": True,
                "reason": "Note already synced with identical content",
                "last_synced_at": existing.last_synced_at.isoformat(),
                "task_ids": existing.task_ids,
                "opportunity_ids": existing.opportunity_ids,
            }

        # --- LLM extraction ---
        extracted = await self.extract_crm_data(title, body)

        _type_map: Dict[str, TaskType] = {
            "Call": TaskType.CALL,
            "Meeting": TaskType.MEETING,
            "Email": TaskType.EMAIL,
            "Follow Up": TaskType.FOLLOW_UP,
            "Research": TaskType.RESEARCH,
            "Presentation": TaskType.PRESENTATION,
            "Other": TaskType.OTHER,
        }

        task_ids: List[str] = []
        for item in extracted.get("action_items", []):
            task = Task(
                title=item.get("title") or "Untitled task",
                description=item.get("description") or None,
                task_type=_type_map.get(item.get("task_type", "Other"), TaskType.OTHER),
                status=TaskStatus.TODO,
                priority=item.get("priority", "Medium"),
                fundraising_id=fundraising_id,
                contact_id=contact_id,
                meeting_id=meeting_id,
                assigned_by=created_by,
                tags=["joplin-sync", note_id],
            )
            await task.insert()
            task_ids.append(str(task.id))

        opportunity_ids: List[str] = []
        for opp in extracted.get("opportunities", []):
            opportunity = Opportunity(
                title=opp.get("title") or "Untitled opportunity",
                description=opp.get("description") or None,
                organisation=opp.get("organisation") or "Unknown",
                estimated_value=opp.get("estimated_value"),
                probability=opp.get("probability"),
                status=OpportunityStatus.OPEN,
                priority="Medium",
                contact_id=contact_id,
                meeting_id=meeting_id,
                assigned_to=created_by,
            )
            await opportunity.insert()
            opportunity_ids.append(str(opportunity.id))

        # --- Upsert sync record ---
        # Generate assets (non-blocking; failures are logged but don't abort sync)
        audio_filename = await self._generate_tts_for_note(note_id, title, body)
        infographic_filename = await self._generate_infographic_for_note(note_id, title, extracted)

        if existing:
            existing.content_hash = content_hash
            existing.note_title = title
            existing.note_body = body
            existing.last_synced_at = datetime.utcnow()
            existing.task_ids = existing.task_ids + task_ids
            existing.opportunity_ids = existing.opportunity_ids + opportunity_ids
            if fundraising_id:
                existing.fundraising_id = fundraising_id
            if contact_id:
                existing.contact_id = contact_id
            if meeting_id:
                existing.meeting_id = meeting_id
            if audio_filename:
                existing.audio_filename = audio_filename
            if infographic_filename:
                existing.infographic_filename = infographic_filename
            await existing.save()
        else:
            record = JoplinSyncRecord(
                note_id=note_id,
                note_title=title,
                note_body=body,
                content_hash=content_hash,
                fundraising_id=fundraising_id,
                contact_id=contact_id,
                meeting_id=meeting_id,
                task_ids=task_ids,
                opportunity_ids=opportunity_ids,
                synced_by=created_by,
                audio_filename=audio_filename,
                infographic_filename=infographic_filename,
            )
            await record.insert()

        return {
            "skipped": False,
            "note_id": note_id,
            "note_title": title,
            "tasks_created": len(task_ids),
            "opportunities_created": len(opportunity_ids),
            "task_ids": task_ids,
            "opportunity_ids": opportunity_ids,
            "audio_url": f"/api/joplin/synced-notes/{note_id}/audio" if audio_filename else None,
            "infographic_url": f"/api/joplin/synced-notes/{note_id}/infographic" if infographic_filename else None,
            "extracted": extracted,
        }

    # ------------------------------------------------------------------ #
    # Pagination helper                                                    #
    # ------------------------------------------------------------------ #

    async def _paginated_get(
        self, endpoint: str, fields: str = ""
    ) -> List[Dict[str, Any]]:
        all_items: List[Dict[str, Any]] = []
        page = 1
        async with httpx.AsyncClient(timeout=15.0) as client:
            while True:
                params: Dict[str, Any] = {
                    "token": self.token,
                    "page": page,
                    "limit": 100,
                }
                if fields:
                    params["fields"] = fields
                resp = await client.get(f"{self.base_url}/{endpoint}", params=params)
                resp.raise_for_status()
                data = resp.json()
                if isinstance(data, list):
                    all_items.extend(data)
                    break
                all_items.extend(data.get("items", []))
                if not data.get("has_more", False):
                    break
                page += 1
        return all_items
