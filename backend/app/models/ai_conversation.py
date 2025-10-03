"""
AI Conversation model for storing custom prompts and responses
"""

from beanie import Document
from pydantic import Field, BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ConversationType(str, Enum):
    """Type of conversation context"""
    MEETING = "meeting"
    CAMPAIGN = "campaign"


class AIConversation(Document):
    """AI Conversation model for storing custom prompts and AI responses"""

    # Context information
    conversation_type: ConversationType = Field(..., description="Type of conversation (meeting or campaign)")
    meeting_id: Optional[str] = Field(None, description="Reference to meeting if conversation is about a meeting")
    fundraising_id: Optional[str] = Field(None, description="Reference to fundraising campaign if conversation is about a campaign")

    # Conversation content
    user_prompt: str = Field(..., description="The user's custom prompt/question")
    ai_response: str = Field(..., description="The AI's response to the prompt")
    context_data: Optional[dict] = Field(None, description="Additional context data used for the conversation (transcript excerpts, campaign data, etc.)")

    # Metadata
    asked_by: str = Field(..., description="User ID who asked the question")
    asked_at: datetime = Field(default_factory=datetime.utcnow, description="When the conversation occurred")

    # Optional metadata
    model_used: Optional[str] = Field(None, description="AI model used (e.g., gpt-4)")
    tokens_used: Optional[int] = Field(None, description="Number of tokens consumed")
    processing_time_seconds: Optional[float] = Field(None, description="Time taken to generate response")

    class Settings:
        name = "ai_conversations"
        indexes = [
            "conversation_type",
            "meeting_id",
            "fundraising_id",
            "asked_by",
            "asked_at",
            [("conversation_type", 1), ("meeting_id", 1)],  # For meeting conversations
            [("conversation_type", 1), ("fundraising_id", 1)],  # For campaign conversations
            [("asked_by", 1), ("asked_at", -1)]  # For user conversation history
        ]

    class Config:
        validate_by_name = True
        json_schema_extra = {
            "example": {
                "conversation_type": "meeting",
                "meeting_id": "60f1b2b3c4d5e6f7g8h9i0j1",
                "user_prompt": "What were the main concerns raised about the investment terms?",
                "ai_response": "Based on the meeting transcript, the main concerns raised were...",
                "context_data": {
                    "transcript_length": 1500,
                    "meeting_title": "Initial Investment Discussion"
                },
                "asked_by": "60f1b2b3c4d5e6f7g8h9i0j2",
                "model_used": "gpt-4",
                "tokens_used": 450
            }
        }

    def __repr__(self):
        return f"<AIConversation(id={self.id}, type='{self.conversation_type}', prompt='{self.user_prompt[:50]}...')>"