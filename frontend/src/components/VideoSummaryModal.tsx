import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { X, Play } from 'lucide-react-native';

interface VideoSummaryModalProps {
  isVisible: boolean;
  onClose: () => void;
  video: {
    id: string;
    title: string;
    platform: string;
    date: string;
    thumbnail: string;
    summary: string;
    notes: string[];
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
          <Text className="text-xl font-bold text-gray-800 mb-2">{video.title}</Text>
          
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-100 rounded-full px-3 py-1 mr-3">
              <Text className="text-blue-700 text-sm font-medium">{video.platform}</Text>
            </View>
            <Text className="text-gray-500">{video.date}</Text>
          </View>
          
          <Image 
            source={{ uri: video.thumbnail }} 
            className="w-full h-48 rounded-xl mb-4"
            resizeMode="cover"
          />
        </View>

        {/* Summary content */}
        <ScrollView className="flex-1 mb-4">
          <Text className="text-gray-800 font-semibold mb-3">Key Points:</Text>
          
          {video.notes && video.notes.length > 0 ? (
            <View className="ml-2">
              {video.notes.map((note, index) => (
                <View key={index} className="flex-row mb-2">
                  <Text className="text-gray-700 mr-2">•</Text>
                  <Text className="text-gray-700 flex-1">{note}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="ml-2">
              <View className="flex-row mb-2">
                <Text className="text-gray-700 mr-2">•</Text>
                <Text className="text-gray-700 flex-1">{video.summary || "No summary available"}</Text>
              </View>
            </View>
          )}
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