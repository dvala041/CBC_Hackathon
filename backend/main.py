"""
FastAPI backend for transcribing short-form video content.
Extracts audio from YouTube Shorts, Instagram Reels, TikTok videos, etc.
"""
from supabase_client import supabase
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


def categorize_with_claude(summary: str) -> str:
    """
    Use Claude to assign a simple category based on the summary.
    Returns one of: fitness, cooking, career, finance, education, entertainment, other, uncategorized
    
    Args:
        summary: The summary text to categorize
        
    Returns:
        Category name as a string
    """
    if not anthropic_client:
        raise HTTPException(
            status_code=500,
            detail="Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable."
        )
    
    try:
        # Ask Claude to categorize the content
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",  # Claude 3.5 Sonnet
            max_tokens=50,
            messages=[{
                "role": "user",
                "content": f"""Based on this video summary, assign ONE category from this list:
                - fitness
                - cooking
                - career
                - finance
                - education
                - entertainment
                - other
                - uncategorized

                Summary: {summary}

                Respond with ONLY the category name, nothing else."""
            }]
        )
        
        # Extract and clean the category
        category = message.content[0].text.strip().lower()
        
        # Validate category is one of the allowed values
        valid_categories = ["fitness", "cooking", "career", "finance", "education", "entertainment", "other", "uncategorized"]
        if category not in valid_categories:
            category = "uncategorized"
        
        return category
        
    except Exception as e:
        print(f"Error categorizing with Claude: {str(e)}")
        return "uncategorized"


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
            
            # Transcribe the audio using Whisper
            transcription = transcribe_audio_with_whisper(final_audio_path)
            
            # Summarize the transcription using Claude 3.5 Sonnet
            summary = summarize_with_claude(transcription)
            
            # Categorize the content using Claude
            backend_category = categorize_with_claude(summary)
            
            try:
                insert_data = {
                    "user_id": request.user_id,
                    "video_url": video_url,
                    "category": backend_category,
                    "video_title": video_title,
                    "duration": duration,
                    "transcription": transcription,
                    "summary": summary,
                }
                result = supabase.table("videos").insert(insert_data).execute()
                video_id = result.data[0]["id"] if result.data else None
                print("Saved to supabase")

            except Exception as db_error:
                print(f"Warning: could not save to Supabase: {db_error}")
                video_id = None
                
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
                summary=summary,
                video_id=video_id,
                category=backend_category
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
from fastapi import Query
@app.get("/videos")
async def get_videos(user_id: str = Query(None)):
    """
    Get all saved videos for a specific user.
    This is what your React Native app will call to show the list.
    """
    try:
        query = supabase.table("videos").select("*")

        if user_id:
            query = query.eq("user_id", user_id)

        result = query.order("created_at", desc=True).execute()

        return {"videos": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching videos: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
