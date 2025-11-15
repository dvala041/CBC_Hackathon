import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/(tabs)');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'frontend://login',
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in with Google');
      setIsLoading(false);
    }
  };

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
        onPress={handleGoogleSignIn}
        disabled={isLoading}
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
