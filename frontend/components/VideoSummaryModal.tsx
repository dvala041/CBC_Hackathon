import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, Play, ClipboardList } from 'lucide-react-native';

interface VideoSummaryModalProps {
  isVisible: boolean;
  onClose: () => void;
  video: {
    id?: string;
    title?: string;
    platform?: string;
    category?: string;
    date?: string;
    video_url?: string;
    summary?: string;
    notes?: string[];
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

  // Get color for category badge
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      'fitness': { bg: 'bg-green-100', text: 'text-green-700' },
      'cooking': { bg: 'bg-orange-100', text: 'text-orange-700' },
      'career': { bg: 'bg-purple-100', text: 'text-purple-700' },
      'finance': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      'education': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'entertainment': { bg: 'bg-pink-100', text: 'text-pink-700' },
      'other': { bg: 'bg-gray-100', text: 'text-gray-700' },
    };
    return colors[category?.toLowerCase()] || { bg: 'bg-blue-100', text: 'text-blue-700' };
  };

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
            {video.title || 'Untitled Video'}
          </Text>
          <View className="flex-row items-center mb-3">
            <View className={`${getCategoryColor(video.category || '').bg} rounded-full px-3 py-1 mr-3`}>
              <Text className={`${getCategoryColor(video.category || '').text} text-sm font-medium`}>
                {video.category ? video.category.charAt(0).toUpperCase() + video.category.slice(1) : 'Uncategorized'}
              </Text>
            </View>
            <Text className="text-gray-500">
              {video.date || 'Unknown date'}
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

            {video.notes && video.notes.length > 0 && (
              <>
                <Text className="text-gray-800 font-semibold text-base mb-2 mt-4">Key Notes</Text>
                <View className="space-y-2">
                  {video.notes.map((note, index) => (
                    <View key={index} className="flex-row mb-2">
                      <Text className="text-gray-600 mr-2">•</Text>
                      <Text className="text-gray-600 flex-1 leading-6">{note}</Text>
                    </View>
                  ))}
                </View>
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