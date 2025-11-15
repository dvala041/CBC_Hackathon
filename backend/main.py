"""
FastAPI backend for transcribing short-form video content.
Extracts audio from YouTube Shorts, Instagram Reels, TikTok videos, etc.
"""

import os
import tempfile
import uuid
import base64
from pathlib import Path

import yt_dlp
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from anthropic import Anthropic
from dotenv import load_dotenv
from openai import OpenAI

from models import TranscribeRequest, TranscribeResponse

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Video Transcription API",
    description="Extract audio from short-form videos for transcription",
    version="0.1.0"
)

# Allow cross-origin requests (development-friendly defaults)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create temp directory for audio files
TEMP_AUDIO_DIR = Path("temp_audio")
TEMP_AUDIO_DIR.mkdir(exist_ok=True)

# Initialize Anthropic client (for future summarization)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    print("Warning: ANTHROPIC_API_KEY not found in environment variables")
    anthropic_client = None
else:
    anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

# Initialize OpenAI client for Whisper transcription
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("Warning: OPENAI_API_KEY not found in environment variables")
    openai_client = None
else:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)


def transcribe_audio_with_whisper(audio_file_path: Path) -> str:
    """
    Transcribe audio file using OpenAI's Whisper API
    
    Args:
        audio_file_path: Path to the audio file
        
    Returns:
        Transcribed text
    """
    if not openai_client:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
        )
    
    try:
        # Open audio file and send to Whisper API
        with open(audio_file_path, 'rb') as audio_file:
            transcription = openai_client.audio.transcriptions.create(
                model="gpt-4o-transcribe",
                file=audio_file,
                response_format="text"
            )
        
        return transcription
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error transcribing audio with Whisper: {str(e)}"
        )


def summarize_with_claude(transcription: str) -> str:
    """
    Summarize transcribed text using Claude 3.5 Sonnet
    
    Args:
        transcription: The transcribed text to summarize
        
    Returns:
        Summary of the transcription
    """
    if not anthropic_client:
        raise HTTPException(
            status_code=500,
            detail="Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable."
        )
    
    try:
        # Create a concise summary using Claude
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",  # Claude 3.5 Sonnet
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"""Please provide a concise summary of the following transcription from a short-form video. 
Focus on the key points, main ideas, and actionable takeaways. Keep it brief and easy to scan.

Transcription:
{transcription}

Summary:"""
            }]
        )
        
        # Extract summary from response
        summary = message.content[0].text
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error summarizing with Claude: {str(e)}"
        )


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
            # Add headers to avoid bot detection
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-us,en;q=0.5',
                'Sec-Fetch-Mode': 'navigate',
            },
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
            
            # Transcribe the audio using Whisper
            transcription = transcribe_audio_with_whisper(final_audio_path)
            
            # Summarize the transcription using Claude 3.5 Sonnet
            summary = summarize_with_claude(transcription)
            
            # Clean up: Delete the audio file after successful transcription
            try:
                final_audio_path.unlink()
                print(f"Deleted audio file: {final_audio_path}")
            except Exception as cleanup_error:
                print(f"Warning: Could not delete audio file {final_audio_path}: {cleanup_error}")
            
            return TranscribeResponse(
                success=True,
                message="Audio extracted, transcribed, and summarized successfully",
                audio_file=None,  # File deleted after transcription
                video_title=video_title,
                duration=duration,
                transcription=transcription,
                summary=summary
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
