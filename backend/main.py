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
from datetime import datetime, timezone

import yt_dlp
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from anthropic import Anthropic
from dotenv import load_dotenv
from openai import OpenAI

from models import TranscribeRequest, TranscribeResponse, VideoResponse, VideosListResponse

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
        One sentence summary of the transcription
    """
    if not anthropic_client:
        raise HTTPException(
            status_code=500,
            detail="Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable."
        )
    
    try:
        # Create a ONE SENTENCE summary using Claude
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",  # Claude 3.5 Sonnet
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": f"""Please provide a ONE SENTENCE summary of the following transcription from a short-form video. 
                    Make it concise and capture the main topic or theme.

                    Transcription:
                    {transcription}

                    One sentence summary:"""
            }]
        )
        
        # Extract summary from response
        summary = message.content[0].text.strip()
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error summarizing with Claude: {str(e)}"
        )


def generate_notes_with_claude(transcription: str) -> list:
    """
    Generate detailed bullet point notes from transcription using Claude 3.5 Sonnet
    
    Args:
        transcription: The transcribed text
        
    Returns:
        List of detailed note strings
    """
    if not anthropic_client:
        return ["Transcription available but notes could not be generated."]
    
    try:
        message = anthropic_client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"""Create detailed bullet point notes from this video transcription. 
                    Extract key points, facts, tips, and actionable insights. 
                    Return ONLY the bullet points, one per line, without bullets or numbers.
                    Each point should be a complete, informative sentence.

                    Transcription:
                    {transcription}

                    Notes:"""
            }]
        )
        
        # Parse response into list of notes
        notes_text = message.content[0].text.strip()
        notes = [line.strip() for line in notes_text.split('\n') if line.strip()]
        return notes[:10]  # Limit to 10 notes max
        
    except Exception as e:
        print(f"Error generating notes with Claude: {str(e)}")
        return ["Error generating detailed notes."]


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


def get_relative_time(created_at: str) -> str:
    """Convert ISO timestamp to relative time like '2 days ago'"""
    try:
        created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        diff = now - created
        
        seconds = diff.total_seconds()
        if seconds < 60:
            return "just now"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif seconds < 604800:
            days = int(seconds / 86400)
            return f"{days} day{'s' if days != 1 else ''} ago"
        elif seconds < 2592000:
            weeks = int(seconds / 604800)
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"
        elif seconds < 31536000:
            months = int(seconds / 2592000)
            return f"{months} month{'s' if months != 1 else ''} ago"
        else:
            years = int(seconds / 31536000)
            return f"{years} year{'s' if years != 1 else ''} ago"
    except:
        return "unknown"


def extract_platform_from_url(url: str) -> str:
    """Extract platform name from URL"""
    if not url:
        return "Unknown"
    url_lower = url.lower()
    if "youtube.com" in url_lower or "youtu.be" in url_lower:
        return "YouTube"
    elif "tiktok.com" in url_lower:
        return "TikTok"
    elif "instagram.com" in url_lower:
        return "Instagram"
    elif "facebook.com" in url_lower:
        return "Facebook"
    else:
        return "Unknown"


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
            
            # Summarize the transcription using Claude 3.5 Sonnet (one sentence)
            summary = summarize_with_claude(transcription)
            # Generate detailed notes using Claude
            notes = generate_notes_with_claude(transcription)
            
            # Categorize the content using Claude
            backend_category = categorize_with_claude(summary)
            
            try:
                # Validate user_id is a valid UUID
                if not request.user_id:
                    raise ValueError("user_id is required")
                
                # Try to parse as UUID to validate
                import uuid as uuid_lib
                try:
                    uuid_lib.UUID(request.user_id)
                except ValueError:
                    raise ValueError(f"user_id must be a valid UUID, got: {request.user_id}")
                
                insert_data = {
                    "user_id": request.user_id,
                    "title": video_title,
                    "url": video_url,
                    "summary": summary,
                    "notes": notes,  # List of strings
                    "thumbnail": None,  # Optional for now
                    "transcription": transcription,
                    "category": backend_category,
                    "duration": duration,
                }
                result = supabase.table("videos").insert(insert_data).execute()
                video_id = result.data[0]["id"] if result.data else None  # id is the primary key
                print(f"✅ Saved to supabase with ID: {video_id}")

            except Exception as db_error:
                print(f"❌ Warning: could not save to Supabase: {db_error}")
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
@app.get("/videos", response_model=VideosListResponse)
async def get_videos(user_id: str = Query(None)):
    """
    Get all saved videos for a specific user.
    Returns formatted data with id, title, platform, date, thumbnail, summary, and notes.
    """
    try:
        query = supabase.table("videos").select("*")

        if user_id:
            query = query.eq("user_id", user_id)

        result = query.order("created_at", desc=True).execute()

        # Transform the data to match frontend format
        formatted_videos = []
        for video in result.data:
            # Parse notes from JSON string if needed
            notes = video.get("notes", [])
            if isinstance(notes, str):
                import json
                try:
                    notes = json.loads(notes)
                except:
                    notes = [notes] if notes else []
            
            formatted_video = {
                "id": str(video.get("id", "")),  # id is the primary key for each video
                "title": video.get("title", "Untitled Video"),
                "platform": extract_platform_from_url(video.get("url", "")),
                "date": get_relative_time(video.get("created_at", "")),
                "thumbnail": video.get("thumbnail"),  # Optional, can be None
                "summary": video.get("summary", "No summary available"),
                "notes": notes if isinstance(notes, list) else []
            }
            formatted_videos.append(formatted_video)

        return {"videos": formatted_videos}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching videos: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
