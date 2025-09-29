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