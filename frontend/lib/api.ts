import { HARDCODED_USER_ID } from './auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.48.112.8:8000';

export interface Video {
  id: string;
  title: string;
  platform: string;
  category: string;
  date: string;
  thumbnail?: string;
  summary: string;
  notes: string[];
  video_url: string;
}

export interface FetchVideosResponse {
  videos: Video[];
}

/**
 * Fetch all videos for the hardcoded user
 */
export async function fetchUserVideos(): Promise<Video[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/videos?user_id=${HARDCODED_USER_ID}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FetchVideosResponse = await response.json();
    return data.videos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
}

/**
 * Submit a new video URL for transcription
 */
export async function transcribeVideo(videoUrl: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: videoUrl,
        user_id: HARDCODED_USER_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error transcribing video:', error);
    throw error;
  }
}
