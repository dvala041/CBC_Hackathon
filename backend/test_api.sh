#!/bin/bash

# Test script for Video Transcription API

echo "=========================================="
echo "Testing Video Transcription API"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1. Testing health check endpoint..."
echo "GET http://localhost:8000/"
curl -s http://localhost:8000/ | python3 -m json.tool
echo ""
echo ""

# Test 2: POST - Transcribe a video
echo "=========================================="
echo "2. Testing POST /transcribe endpoint..."
echo "This will take a while (transcription + AI processing)..."
echo ""
curl -X POST http://localhost:8000/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "user_id": "887eb738-f3a0-4546-ad55-9faaa8e85d43"
  }' | python3 -m json.tool
echo ""
echo ""

# Test 3: GET - Fetch videos for specific user
echo "=========================================="
echo "3. Testing GET /videos with user_id..."
echo "GET http://localhost:8000/videos?user_id=887eb738-f3a0-4546-ad55-9faaa8e85d43"
curl -s "http://localhost:8000/videos?user_id=887eb738-f3a0-4546-ad55-9faaa8e85d43" | python3 -m json.tool
echo ""
echo ""

# Test 4: GET - Fetch all videos
echo "=========================================="
echo "4. Testing GET /videos (all videos)..."
echo "GET http://localhost:8000/videos"
curl -s http://localhost:8000/videos | python3 -m json.tool
echo ""
echo ""

echo "=========================================="
echo "Testing complete!"
echo "=========================================="
