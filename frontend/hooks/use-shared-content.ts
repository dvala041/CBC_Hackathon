import { useEffect, useState, useCallback } from 'react';
import * as Clipboard from 'expo-clipboard';
import { AppState } from 'react-native';

export interface SharedContent {
  text?: string;
  webUrl?: string;
}

export function useSharedContent() {
  const [sharedContent, setSharedContent] = useState<SharedContent | null>(null);
  const [lastCheckedUrl, setLastCheckedUrl] = useState<string | null>(null);

  const checkClipboard = useCallback(async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      
      // Check if clipboard contains a video URL and hasn't been checked already
      if (clipboardContent && clipboardContent !== lastCheckedUrl && (
        clipboardContent.includes('youtube.com') ||
        clipboardContent.includes('youtu.be') ||
        clipboardContent.includes('tiktok.com') ||
        clipboardContent.includes('instagram.com/reel') ||
        clipboardContent.includes('instagram.com/p')
      )) {
        console.log('Detected video URL in clipboard:', clipboardContent);
        setLastCheckedUrl(clipboardContent);
        setSharedContent({
          text: clipboardContent,
          webUrl: clipboardContent,
        });
      }
    } catch (error) {
      console.error('Error reading clipboard:', error);
    }
  }, [lastCheckedUrl]);

  useEffect(() => {
    // Check clipboard immediately when component mounts
    checkClipboard();

    // Check clipboard when app comes to foreground
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        checkClipboard();
      }
    });

    // Also check clipboard periodically (every 2 seconds when app is active)
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        checkClipboard();
      }
    }, 2000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkClipboard]);

  const clearSharedContent = () => {
    setSharedContent(null);
  };

  return { sharedContent, clearSharedContent };
}
