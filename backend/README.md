# Video Transcription Backend

FastAPI backend for extracting audio from short-form video content (YouTube Shorts, Instagram Reels, TikTok, etc.) and preparing it for transcription.

## Features

- 🎵 Extract audio from video URLs using `yt-dlp` and `ffmpeg`
- 🎬 Support for YouTube Shorts, Instagram Reels, TikTok, and more
- 🚀 Fast and async with FastAPI
- 🧹 Cleanup endpoints for temporary files

## Prerequisites

- Python 3.8+
- ffmpeg installed on your system

### Install ffmpeg (macOS)
```bash
brew install ffmpeg
```

### Install ffmpeg (Linux)
```bash
sudo apt-get install ffmpeg
```

### Install ffmpeg (Windows)
Download from https://ffmpeg.org/download.html

## Setup

1. **Create and activate virtual environment** (if not already done)
```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
# or
.\venv\Scripts\activate  # Windows
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running the Server

### Development mode
```bash
uvicorn main:app --reload --port 8000
```

### Production mode
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Or run directly
```bash
python main.py
```

The API will be available at http://localhost:8000

## API Documentation

Once running, visit:
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## Endpoints

### `POST /transcribe`
Extract audio from a video URL.

**Request body:**
```json
{
  "url": "https://youtube.com/shorts/..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Audio extracted successfully",
  "audio_file": "temp_audio/audio_abc123.mp3",
  "video_title": "Cool Video Title",
  "duration": 45.5
}
```

**Example with curl:**
```bash
curl -X POST "http://localhost:8000/transcribe" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/shorts/dQw4w9WgXcQ"}'
```

### `DELETE /cleanup/{filename}`
Delete a temporary audio file.

```bash
curl -X DELETE "http://localhost:8000/cleanup/audio_abc123.mp3"
```

### `GET /`
Health check endpoint.

## Supported Platforms

- YouTube (including Shorts)
- Instagram (Reels)
- TikTok
- Twitter/X videos
- Facebook videos
- Reddit videos
- And many more supported by yt-dlp

## Project Structure

```
backend/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
├── .env                # Your local environment (gitignored)
├── README.md           # This file
├── temp_audio/         # Temporary audio files (gitignored)
└── venv/               # Virtual environment (gitignored)
```

## Next Steps

- [ ] Add Claude API integration for transcription
- [ ] Add summarization endpoint
- [ ] Add database for storing transcripts
- [ ] Add user authentication
- [ ] Add rate limiting
- [ ] Deploy to cloud platform

## Troubleshooting

**Error: ffmpeg not found**
- Make sure ffmpeg is installed and in your PATH
- Test with: `ffmpeg -version`

**Error downloading video**
- Some platforms have rate limits or require authentication
- Private videos won't work
- Age-restricted content may fail

**Audio file not created**
- Check temp_audio/ directory exists and is writable
- Check ffmpeg installation
- Check yt-dlp logs for errors
