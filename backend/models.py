"""
Pydantic models for request and response schemas
"""

from typing import Optional, List
from pydantic import BaseModel, HttpUrl
from datetime import datetime


class TranscribeRequest(BaseModel):
    """Request model for /transcribe endpoint"""
    url: HttpUrl
    user_id: Optional[str] = None

class TranscribeResponse(BaseModel):
    """Response model for /transcribe endpoint"""
    success: bool
    message: str
    audio_file: Optional[str] = None
    video_title: Optional[str] = None
    duration: Optional[float] = None
    transcription: Optional[str] = None
    summary: Optional[str] = None
    video_id: Optional[str] = None  # Changed from int to str for UUID
    category: Optional[str] = None

class VideoResponse(BaseModel):
    """Response model for individual video"""
    id: str
    title: str
    platform: str
    date: str  # relative time like "2 days ago"
    thumbnail: Optional[str] = None
    summary: str  # one sentence summary
    notes: List[str]  # detailed list of notes

class VideosListResponse(BaseModel):
    """Response model for /videos endpoint"""
    videos: List[VideoResponse]
