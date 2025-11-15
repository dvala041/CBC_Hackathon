# Frontend-Backend Integration Guide

## Overview
The React Native frontend is now connected to the FastAPI backend. The app will fetch and display videos for the hardcoded user ID: `887eb738-f3a0-4546-ad55-9faaa8e85d43`.

## What Was Changed

### 1. Environment Configuration
- **File**: `frontend/.env`
- **Added**: `EXPO_PUBLIC_API_URL=http://localhost:8000`
- This tells the app where to find the backend API

### 2. Authentication Setup
- **File**: `frontend/lib/auth.ts` (created)
- Exports hardcoded user ID for development
- No actual authentication required - bypasses login flow

### 3. API Client
- **File**: `frontend/lib/api.ts` (created)
- **Functions**:
  - `fetchUserVideos()`: Calls `GET /videos?user_id=<HARDCODED_USER_ID>`
  - `transcribeVideo(videoUrl)`: Calls `POST /transcribe` with video URL
- Returns properly typed Video objects matching backend schema

### 4. Main Screen Updates
- **File**: `frontend/app/(tabs)/index.tsx`
- Removed mock video data
- Added API integration with `useEffect` to fetch videos on mount
- Added loading, error, and empty states
- Updated video cards to display backend data:
  - `video_title` instead of `title`
  - `category` instead of `platform`
  - `created_at` formatted as date instead of `date`
- Added ability to open original video URL using `Linking.openURL()`

### 5. Modal Component Updates
- **File**: `frontend/components/VideoSummaryModal.tsx`
- Updated interface to match backend Video schema
- Displays:
  - Video title, category, and date
  - Summary text
  - Full transcription (if available)
- "Open Original Video" button now opens the actual video URL

## How to Test

### 1. Start the Backend
```bash
cd backend
# Make sure you have Python dependencies installed
# pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload
```
The backend should be running on `http://localhost:8000`

### 2. Start the Frontend
```bash
cd frontend
npx expo start
```

### 3. Expected Behavior
- App loads and immediately fetches videos for user `887eb738-f3a0-4546-ad55-9faaa8e85d43`
- Videos are displayed in cards with:
  - Title from backend
  - Category badge
  - Date created
  - Summary preview
- Tap a video to see full summary and transcription
- "Open Original Video" button opens the video URL in browser
- Categories in sidebar are dynamically generated from video data

### 4. Error Handling
- If backend is not running: Shows error message "Failed to load videos. Make sure the backend is running on http://localhost:8000"
- If no videos exist: Shows "No videos found" message
- If video URL cannot open: Shows error alert

## Backend Endpoints Used

### GET /videos
- **URL**: `http://localhost:8000/videos?user_id=887eb738-f3a0-4546-ad55-9faaa8e85d43`
- **Returns**: `{ videos: Video[] }`
- **Video Schema**:
  ```typescript
  {
    id: number
    user_id: string
    video_url: string
    video_title: string
    category: string
    duration: number
    transcription: string
    summary: string
    created_at: string
  }
  ```

### POST /transcribe (for future use)
- **URL**: `http://localhost:8000/transcribe`
- **Body**: `{ url: string, user_id: string }`
- **Returns**: Transcribed video data
- Note: This endpoint is ready in the API client but not yet wired to the UI

## Next Steps

To add video submission functionality:
1. Add a "+" button or input field to the UI
2. Call `transcribeVideo(videoUrl)` from `lib/api.ts`
3. Refresh the video list after successful transcription

## Troubleshooting

### TypeScript Import Errors
If you see "Cannot find module './auth'", this is a temporary cache issue. The file exists at `frontend/lib/auth.ts`. Solutions:
- Restart the TypeScript server in VS Code
- Run `npx expo start --clear`
- The error should disappear when the app rebuilds

### Network Errors
- Make sure backend is running on port 8000
- Check that `EXPO_PUBLIC_API_URL` in `.env` is correct
- If testing on physical device, use your computer's local IP instead of `localhost`

### No Videos Showing
- Check that videos exist in Supabase for user ID `887eb738-f3a0-4546-ad55-9faaa8e85d43`
- Verify backend is returning data: `curl http://localhost:8000/videos?user_id=887eb738-f3a0-4546-ad55-9faaa8e85d43`
- Check console logs in Expo for error messages
