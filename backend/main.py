"""
FastAPI backend for transcribing short-form video content.
Extracts audio from YouTube Shorts, Instagram Reels, TikTok videos, etc.
"""

import os
import tempfile
import uuid
from pathlib import Path
from typing import Optional

import yt_dlp
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl

app = FastAPI(
    title="Video Transcription API",
    description="Extract audio from short-form videos for transcription",
    version="0.1.0"
)

# Create temp directory for audio files
TEMP_AUDIO_DIR = Path("temp_audio")
TEMP_AUDIO_DIR.mkdir(exist_ok=True)


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


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "online", "message": "Video Transcription API"}


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(request: TranscribeRequest):
    """
    Extract audio from a video URL (YouTube Shorts, Instagram Reels, TikTok, etc.)
    
    Args:
        request: Contains the video URL
        
    Returns:
        TranscribeResponse with audio file path and metadata
    """
    video_url = str(request.url)
    audio_file_path = None
    
    try:
        # Generate unique filename for this audio extraction
        unique_id = str(uuid.uuid4())[:8]
        audio_filename = f"audio_{unique_id}.mp3"
        audio_file_path = TEMP_AUDIO_DIR / audio_filename
        
        # Configure yt-dlp options
        ydl_opts = {
            'format': 'bestaudio/best',  # Get best audio quality
            'outtmpl': str(TEMP_AUDIO_DIR / f'video_{unique_id}.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'quiet': False,
            'no_warnings': False,
            'extract_flat': False,
        }
        
        # Download and extract audio
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video info first
            info = ydl.extract_info(video_url, download=True)
            
            video_title = info.get('title', 'Unknown')
            duration = info.get('duration', 0)
            
            # yt-dlp automatically names the output file after post-processing
            # It replaces the extension with .mp3
            final_audio_path = TEMP_AUDIO_DIR / f"video_{unique_id}.mp3"
            
            if not final_audio_path.exists():
                raise FileNotFoundError(f"Audio file was not created at {final_audio_path}")
            
            return TranscribeResponse(
                success=True,
                message="Audio extracted successfully",
                audio_file=str(final_audio_path),
                video_title=video_title,
                duration=duration
            )
            
    except yt_dlp.utils.DownloadError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to download video: {str(e)}"
        )
    except Exception as e:
        # Clean up partial files on error
        if audio_file_path and audio_file_path.exists():
            audio_file_path.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting audio: {str(e)}"
        )


@app.delete("/cleanup/{filename}")
async def cleanup_audio(filename: str):
    """
    Delete a temporary audio file
    
    Args:
        filename: Name of the audio file to delete
    """
    try:
        file_path = TEMP_AUDIO_DIR / filename
        if file_path.exists():
            file_path.unlink()
            return {"success": True, "message": f"Deleted {filename}"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
