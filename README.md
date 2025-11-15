## Project Overview — What Does It Do?

Our app transforms short-form videos (TikToks, Reels, YouTube Shorts) into organized, searchable knowledge. Users paste a video link, and our backend automatically downloads the video, extracts the audio, transcribes it, and sends the transcript to Claude Sonnet 4.5. Claude generates clean, structured summary notes, which are saved to Supabase and displayed in the mobile app.

The result: a fast, simple way to turn the content you watch into a personal library of insights you can browse, categorize, and revisit anytime.

---

## Installation / Setup Instructions — How Do We Run It?

### Backend
- Create a virtual environment: `python3 -m venv venv`  
- Activate the environment: `source venv/bin/activate`  
- Install requirements: `pip install -r requirements.txt`  
- Install ffmpeg (mac): `brew install ffmpeg`  
- Start the server:  
  `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

### Frontend
- Install dependencies: `npm install`  
- Start the front-end: `npx expo start`  
- Use the Expo Go app to view the app by scanning the QR code from the terminal.  

---

## Usage Guide — How Do We Use It Once It's Running?

- On the app we insert the link to the video. Our backend will take the video link, extract the audio, transcribe the audio, summarize the transcription and return back a summary

---

## Tech Stack — What Technologies, Frameworks, and APIs Did You Use?

- Backend Server: FastAPI  
- Database: Supabase  
- Frontend: React Native, TypeScript, NativeWind  

---

## Claude API Integration — How Did You Use Claude?

- We used `claude-sonnet-4.5` to summarize our audio transcriptions and return structured notes to the frontend.

---

## Challenges & Solutions

- We tried deploying our backend on Heroku, but almost every social media site blocked requests due to bot protections.  
- We attempted using authenticated cookies, but this still failed.  
- Due to time constraints, we pivoted and hosted the backend locally instead.

---

## Future Plans — What Would You Build Next With More Time?

With more time, we would evolve the app into a fully AI-powered personal knowledge engine.  
Our top planned feature was a **RAG system** allowing users to ask questions and receive answers grounded in the videos they've summarized. By embedding the user’s query and searching across stored video notes, the app could act as a personalized “second brain,” making all consumed content searchable and actionable.

---

## Team Members & Contributions

- **David:** FastAPI server, audio extraction, transcription, summarization pipeline  
- **Nathnael:** Supabase setup + backend integration; contributed to the AI summarization pipeline  
- **Felix:** Login page and home page  
- **Anthony:** Created the video modal and contributed to home page UI 