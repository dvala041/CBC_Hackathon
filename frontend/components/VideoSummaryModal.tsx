import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, Play, ClipboardList } from 'lucide-react-native';

interface VideoSummaryModalProps {
  isVisible: boolean;
  onClose: () => void;
  video: {
    id?: string;
    video_title?: string;
    category?: string;
    created_at?: string;
    video_url?: string;
    summary?: string;
    transcription?: string;
  };
  onOpenOriginal: () => void;
}

export default function VideoSummaryModal({
  isVisible,
  onClose,
  video,
  onOpenOriginal
}: VideoSummaryModalProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <View className="absolute inset-0 bg-black/50 flex-1 justify-end z-50">
      <View className="bg-white rounded-t-3xl h-3/4 p-4">
        {/* Header with close button */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="w-8" />
          <Text className="text-lg font-bold text-gray-800">Video Summary</Text>
          <TouchableOpacity onPress={onClose} className="w-8 items-center">
            <X size={24} color="#757575" />
          </TouchableOpacity>
        </View>

        {/* Video info header */}
        <View className="mb-4">
          <Text className="text-xl font-bold text-gray-800 mb-2">
            {video.video_title || 'Untitled Video'}
          </Text>
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-100 rounded-full px-3 py-1 mr-3">
              <Text className="text-blue-700 text-sm font-medium">
                {video.category || 'Uncategorized'}
              </Text>
            </View>
            <Text className="text-gray-500">
              {video.created_at ? new Date(video.created_at).toLocaleDateString() : 'Unknown date'}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View className="border-b border-gray-200 mb-4" />

        {/* Summary content */}
        <ScrollView className="flex-1 mb-4">
          {/* Header with Icon */}
          <View className="flex-row items-center mb-3">
            <ClipboardList size={20} color="#4B5563" className="mr-2" />
            <Text className="text-gray-800 font-semibold text-base">Summary</Text>
          </View>
          
          <View className="ml-2">
            <Text className="text-gray-700 flex-1 leading-6 mb-4">
              {video.summary || "No summary available"}
            </Text>
            
            {video.transcription && (
              <>
                <Text className="text-gray-800 font-semibold text-base mb-2 mt-4">Transcription</Text>
                <Text className="text-gray-600 flex-1 leading-6">
                  {video.transcription}
                </Text>
              </>
            )}
          </View>
        </ScrollView>

        {/* Action button */}
        <TouchableOpacity 
          className="bg-blue-500 rounded-xl py-4 flex-row items-center justify-center"
          onPress={onOpenOriginal}
        >
          <Play size={20} color="white" className="mr-2" />
          <Text className="text-white font-semibold">Open Original Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}