"""
Audio Processing Service - Handles audio-to-text conversion and AI analysis
"""

import os
import openai
from typing import Dict, List, Optional, Tuple
import asyncio
from datetime import datetime
import json
import re

from app.models.meeting import Meeting, AudioProcessingStatus


class AudioProcessingService:
    """Service for processing audio recordings with AI"""

    def __init__(self, api_key: Optional[str] = None):
        # Allow per-request override via provided api_key; fallback to env var
        effective_key = api_key or os.getenv("OPENAI_API_KEY")
        if not effective_key:
            # Defer error until first API call to allow endpoints to validate
            pass
        self.openai_client = openai.OpenAI(api_key=effective_key) if effective_key else openai.OpenAI()
        self.audio_dir = "uploads/audio"
        self.images_dir = "uploads/images"
        self.dubs_dir = "uploads/dubs"

    async def process_audio_recording(self, meeting_id: str) -> Dict:
        """
        Process audio recording: transcribe and analyze with AI
        Returns processing results
        """

        # Get meeting
        meeting = await Meeting.get(meeting_id)
        if not meeting or not meeting.audio_recording:
            raise ValueError("Meeting or audio recording not found")

        try:
            # Update status to processing
            meeting.audio_recording.processing_status = AudioProcessingStatus.PROCESSING
            await meeting.save()

            # Transcribe audio
            audio_path = os.path.join(self.audio_dir, meeting.audio_recording.filename)
            transcript = await self._transcribe_audio(audio_path)

            # Analyze transcript with AI
            analysis = await self._analyze_transcript(transcript)

            # Update meeting with results
            meeting.audio_recording.transcript = transcript
            meeting.audio_recording.transcript_summary = analysis.get("summary")
            meeting.audio_recording.ai_insights = analysis
            meeting.audio_recording.processing_status = AudioProcessingStatus.COMPLETED

            # Update meeting with AI-generated content
            meeting.ai_summary = analysis.get("summary")
            meeting.ai_key_points = analysis.get("key_points", [])
            meeting.ai_action_items = analysis.get("action_items", [])
            meeting.ai_sentiment = analysis.get("sentiment")

            meeting.updated_at = datetime.utcnow()
            await meeting.save()

            return {
                "status": "success",
                "transcript": transcript,
                "analysis": analysis
            }

        except Exception as e:
            # Update status to failed
            meeting.audio_recording.processing_status = AudioProcessingStatus.FAILED
            await meeting.save()

            raise Exception(f"Audio processing failed: {str(e)}")

    async def _transcribe_audio(self, audio_path: str) -> str:
        """Transcribe audio file using OpenAI Whisper"""

        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Validate API key availability
        if not getattr(self.openai_client, "api_key", None) and not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OpenAI API key not configured. Provide X-OpenAI-API-Key header or set OPENAI_API_KEY.")

        with open(audio_path, "rb") as audio_file:
            transcript = self.openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

        return transcript.strip()

    async def _analyze_transcript(self, transcript: str) -> Dict:
        """Analyze transcript using GPT for insights and tasks"""

        prompt = f"""
        Analyze the following meeting transcript and provide a structured analysis:

        TRANSCRIPT:
        {transcript}

        Please provide a JSON response with the following structure:
        {{
            "summary": "Brief 2-3 sentence summary of the meeting",
            "key_points": ["List of 3-5 key discussion points"],
            "action_items": ["List of specific action items mentioned or implied"],
            "sentiment": "Overall sentiment (positive/negative/neutral)",
            "topics_discussed": ["Main topics covered"],
            "participants_mood": "Assessment of participants' engagement and mood",
            "follow_up_needed": "What follow-up actions are needed",
            "risks_concerns": ["Any risks or concerns mentioned"],
            "opportunities": ["Investment or business opportunities identified"]
        }}

        Focus on investment/fundraising context. Be specific and actionable.
        """

        # Validate API key availability
        if not getattr(self.openai_client, "api_key", None) and not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OpenAI API key not configured. Provide X-OpenAI-API-Key header or set OPENAI_API_KEY.")

        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert business analyst specializing in investment meetings. Provide structured, actionable insights from meeting transcripts."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )

        # Parse JSON response
        try:
            analysis_text = response.choices[0].message.content.strip()
            # Remove markdown code blocks if present
            analysis_text = re.sub(r'```json\s*|\s*```', '', analysis_text)
            analysis = json.loads(analysis_text)
            return analysis
        except json.JSONDecodeError as e:
            # Fallback analysis if JSON parsing fails
            return {
                "summary": "Meeting transcript analysis completed.",
                "key_points": ["Transcript processed successfully"],
                "action_items": ["Review AI analysis for detailed insights"],
                "sentiment": "neutral",
                "topics_discussed": ["Meeting content analyzed"],
                "participants_mood": "Professional",
                "follow_up_needed": "Review detailed analysis",
                "risks_concerns": [],
                "opportunities": ["AI-powered insights generated"]
            }

    async def generate_meeting_insights(self, meeting_id: str, custom_prompt: str) -> Dict:
        """Generate custom insights from meeting transcript using custom prompt"""

        meeting = await Meeting.get(meeting_id)
        if not meeting or not meeting.audio_recording or not meeting.audio_recording.transcript:
            raise ValueError("Meeting transcript not available")

        prompt = f"""
        Based on the following meeting transcript, {custom_prompt}

        TRANSCRIPT:
        {meeting.audio_recording.transcript}

        Provide a detailed, actionable response.
        """

        # Validate API key availability
        if not getattr(self.openai_client, "api_key", None) and not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OpenAI API key not configured. Provide X-OpenAI-API-Key header or set OPENAI_API_KEY.")

        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert business consultant providing insights from meeting transcripts."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )

        return {
            "custom_prompt": custom_prompt,
            "response": response.choices[0].message.content.strip(),
            "generated_at": datetime.utcnow()
        }

    async def generate_infographic_for_meeting(self, meeting_id: str, description: str, images_dir: Optional[str] = None) -> Dict:
        """Generate an illustrative image/infographic for a meeting and save it locally as PNG."""
        meeting = await Meeting.get(meeting_id)
        if not meeting:
            raise ValueError("Meeting not found")

        # Build context to inform the image prompt
        parts = [
            f"Title: {meeting.title}",
            f"Type: {meeting.meeting_type}",
            f"Status: {meeting.status}",
        ]
        if meeting.ai_summary:
            parts.append(f"Summary: {meeting.ai_summary}")
        elif meeting.notes:
            parts.append(f"Notes: {meeting.notes}")

        context_text = "\n".join(parts)
        image_prompt = (
            f"Create a clean, professional infographic that visually conveys the meeting context for an investment/fundraising discussion.\n"
            f"Context:\n{context_text}\n\n"
            f"Instruction: {description}. Use a white background and minimal color palette, include concise labels."
        )

        # Validate API key availability
        if not getattr(self.openai_client, "api_key", None) and not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OpenAI API key not configured. Provide X-OpenAI-API-Key header or set OPENAI_API_KEY.")

        # Generate image using OpenAI Images API (DALL·E style)
        img = self.openai_client.images.generate(
            model="gpt-image-1",
            prompt=image_prompt,
            size="1024x1024",
            response_format="b64_json",
        )
        b64 = img.data[0].b64_json
        if not b64:
            raise RuntimeError("Failed to generate image")

        import base64
        png_bytes = base64.b64decode(b64)
        out_dir = images_dir or self.images_dir
        os.makedirs(out_dir, exist_ok=True)
        filename = f"{meeting_id}_infographic.png"
        path = os.path.join(out_dir, filename)
        with open(path, 'wb') as f:
            f.write(png_bytes)

        return {"filename": filename, "path": path}

    async def generate_campaign_insights(self, fundraising_id: str, custom_prompt: str, meeting_ids: Optional[List[str]] = None) -> Dict:
        """Generate insights across multiple meetings in a fundraising campaign.
        Prefers AI summaries and key points; falls back to notes or a truncated transcript.
        """

        # Fetch meetings in campaign
        query = {"fundraising_id": fundraising_id}
        if meeting_ids:
            query.update({"_id": {"$in": meeting_ids}})
        meetings = await Meeting.find(query).sort([("scheduled_date", 1)]).to_list()

        if not meetings:
            raise ValueError("No meetings found for this fundraising campaign")

        def truncate(text: Optional[str], max_chars: int = 2000) -> str:
            if not text:
                return ""
            return text if len(text) <= max_chars else text[:max_chars] + "..."

        # Build context sections per meeting
        context_sections = []
        for m in meetings:
            date_str = m.scheduled_date.strftime('%Y-%m-%d %H:%M') if m.scheduled_date else 'N/A'
            parts = [f"Title: {m.title}", f"Date: {date_str}", f"Type: {m.meeting_type}", f"Status: {m.status}"]

            if m.ai_summary:
                parts.append(f"AI Summary: {truncate(m.ai_summary, 800)}")
            if m.ai_key_points:
                parts.append(f"AI Key Points: {truncate('\n'.join(m.ai_key_points), 800)}")
            if m.notes:
                parts.append(f"Notes: {truncate(m.notes, 800)}")
            # Fallback to transcript if present
            if m.audio_recording and m.audio_recording.transcript and not m.ai_summary and not m.notes:
                parts.append(f"Transcript excerpt: {truncate(m.audio_recording.transcript, 1500)}")

            context_sections.append("\n".join(parts))

        context = "\n\n---\n\n".join(context_sections)

        prompt = f"""
        You are an expert investment analyst. Based on the following set of meetings for a single fundraising campaign,
        answer the user's question. Use all relevant details across meetings. If there are inconsistencies, explain them.

        MEETINGS CONTEXT (chronological):
        {context}

        USER QUESTION:
        {custom_prompt}

        Provide a clear, concise answer grounded only in the provided context. If information is missing, state what is missing.
        """

        # Validate API key availability
        if not getattr(self.openai_client, "api_key", None) and not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OpenAI API key not configured. Provide X-OpenAI-API-Key header or set OPENAI_API_KEY.")

        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You synthesize insights across multiple related meetings for fundraising."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=1200
        )

        return {
            "custom_prompt": custom_prompt,
            "response": response.choices[0].message.content.strip(),
            "generated_at": datetime.utcnow(),
            "meetings_used": [str(m.id) for m in meetings],
        }

    async def extract_action_items(self, transcript: str) -> List[str]:
        """Extract specific action items from transcript"""

        prompt = f"""
        Extract all specific action items, commitments, and follow-up tasks from this meeting transcript.
        Return them as a numbered list of specific, actionable items.

        TRANSCRIPT:
        {transcript}
        """

        # Validate API key availability
        if not getattr(self.openai_client, "api_key", None) and not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OpenAI API key not configured. Provide X-OpenAI-API-Key header or set OPENAI_API_KEY.")

        response = self.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Extract action items and commitments from meeting transcripts."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=500
        )

        action_items = response.choices[0].message.content.strip()
        # Split into list items
        items = [item.strip('- •123456789. ') for item in action_items.split('\n') if item.strip()]
        return [item for item in items if item]

    async def summarize_key_decisions(self, transcript: str) -> List[str]:
        """Extract key decisions made during the meeting"""

        prompt = f"""
        Identify and list all key decisions, agreements, and commitments made during this meeting.
        Focus on concrete decisions and outcomes.

        TRANSCRIPT:
        {transcript}

        Return as a numbered list of specific decisions.
        """

        # Validate API key availability
        if not getattr(self.openai_client, "api_key", None) and not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OpenAI API key not configured. Provide X-OpenAI-API-Key header or set OPENAI_API_KEY.")

        response = self.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Identify key decisions and agreements from meeting transcripts."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=500
        )

        decisions = response.choices[0].message.content.strip()
        items = [item.strip('- •123456789. ') for item in decisions.split('\n') if item.strip()]
        return [item for item in items if item]

    async def auto_dub_meeting(self, meeting_id: str, target_voice: str = "alloy", audio_format: str = "mp3") -> Dict:
        """Translate any transcript to English and synthesize an English dub audio file.
        Saves the dubbed audio to uploads/dubs and updates meeting metadata.
        Returns { filename, url, text }.
        """
        meeting = await Meeting.get(meeting_id)
        if not meeting or not meeting.audio_recording:
            raise ValueError("Meeting or audio recording not found")

        # Ensure transcript exists; if not, transcribe first
        if not meeting.audio_recording.transcript:
            audio_path = os.path.join(self.audio_dir, meeting.audio_recording.filename)
            transcript = await self._transcribe_audio(audio_path)
            meeting.audio_recording.transcript = transcript
            await meeting.save()
        else:
            transcript = meeting.audio_recording.transcript

        # 1) Translate to English using GPT if needed
        # Quick heuristic: if transcript contains many non-ascii characters, do translation; otherwise still normalize to English
        needs_translation = any(ord(ch) > 127 for ch in transcript[:200])

        # Validate API key availability
        if not getattr(self.openai_client, "api_key", None) and not os.getenv("OPENAI_API_KEY"):
            raise RuntimeError("OpenAI API key not configured. Provide X-OpenAI-API-Key header or set OPENAI_API_KEY.")

        if needs_translation:
            translate_prompt = (
                "Translate the following transcript into clear, fluent English. Preserve meaning and names.\n\n" + transcript
            )
            tr = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional translator to English."},
                    {"role": "user", "content": translate_prompt},
                ],
                temperature=0.2,
                max_tokens=6000,
            )
            english_text = tr.choices[0].message.content.strip()
        else:
            # Optionally ask model to clean up English for TTS clarity
            cleanup_prompt = (
                "Rewrite this transcript into concise, clear English suitable for voiceover, without changing factual content.\n\n" + transcript
            )
            tr = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an editor preparing text for voiceover."},
                    {"role": "user", "content": cleanup_prompt},
                ],
                temperature=0.3,
                max_tokens=6000,
            )
            english_text = tr.choices[0].message.content.strip()

        # 2) Text-to-Speech using OpenAI TTS
        # Some SDKs expose client.audio.speech for TTS, or use responses with audio. Use latest TTS API route.
        # We'll request MP3 bytes and save.
        from openai import audio
        os.makedirs(self.dubs_dir, exist_ok=True)
        dub_filename = f"{meeting_id}_dub.{audio_format}"
        dub_path = os.path.join(self.dubs_dir, dub_filename)

        # Using the new Responses API with audio output when available; fallback to tts-1
        try:
            # Preferred modern API pattern (if available in installed SDK)
            resp = self.openai_client.chat.completions.create(
                model="gpt-4o-mini-tts",
                messages=[{"role": "user", "content": english_text}],
                audio={"voice": target_voice, "format": audio_format},
            )
            # Depending on SDK version, audio bytes may be in resp.choices[0].message.audio.data
            audio_b64 = getattr(getattr(resp.choices[0].message, "audio", None), "data", None)
            if not audio_b64:
                raise RuntimeError("TTS audio not present in response; SDK version may not support this path")
            import base64
            audio_bytes = base64.b64decode(audio_b64)
        except Exception:
            # Fallback to classic TTS API
            # openai.audio.speech.with_streaming_response.create(...)
            try:
                tts = self.openai_client.audio.speech.create(
                    model="tts-1",
                    voice=target_voice,
                    input=english_text,
                    format=audio_format,
                )
                audio_bytes = tts.read() if hasattr(tts, "read") else tts.audio
            except Exception as e:
                raise RuntimeError(f"TTS generation failed: {e}")

        with open(dub_path, "wb") as f:
            f.write(audio_bytes)

        # Update meeting metadata
        meeting.dub_filename = dub_filename
        meeting.dub_text = english_text
        meeting.dub_generated_at = datetime.utcnow()
        meeting.dub_voice = target_voice
        meeting.dub_format = audio_format
        meeting.updated_at = datetime.utcnow()
        await meeting.save()

        return {
            "filename": dub_filename,
            "url": f"/api/meetings/{meeting_id}/autodub",
            "text": english_text,
        }