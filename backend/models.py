"""
Pydantic models for request and response schemas
"""

from typing import Optional
from pydantic import BaseModel, HttpUrl


class TranscribeRequest(BaseModel):
    """Request model for /transcribe endpoint"""
    url: HttpUrl


class TranscribeResponse(BaseModel):
    """Response model for /transcribe endpoint"""
    success: bool
    message: str
    audio_file: Optional[str] = None
    video_title: Optional[str] = None
    duration: Optional[float] = None
    transcription: Optional[str] = None
    summary: Optional[str] = None
