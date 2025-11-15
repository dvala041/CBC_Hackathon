import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const redirectUri = makeRedirectUri({
    scheme: 'frontend'
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: redirectUri,
  });

  const handleGoogleSignIn = React.useCallback(async (idToken: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;

      if (data.session) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response, handleGoogleSignIn]);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <StatusBar style="auto" />
      
      {/* Logo/Icon */}
      <View className="mb-10 items-center">
        <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-4">
          <View className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center">
            <Text className="text-white text-2xl font-bold">RS</Text>
          </View>
        </View>
        <Text className="text-3xl font-bold text-gray-800">ReelSummarizer</Text>
      </View>

      {/* Tagline */}
      <Text className="text-gray-600 text-center text-lg mb-12 px-4">
        Save and summarize your Reels, TikToks, and Shorts with AI
      </Text>

      {/* Google Sign In Button */}
      <TouchableOpacity 
        className="flex-row items-center justify-center bg-white border border-gray-300 rounded-xl py-4 px-6 w-full max-w-xs shadow-sm"
        onPress={() => promptAsync()}
        disabled={isLoading || !request}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <>
            <View className="w-6 h-6 mr-3">
              <Text className="text-xl">G</Text>
            </View>
            <Text className="text-gray-700 font-medium text-base">
              Continue with Google
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
