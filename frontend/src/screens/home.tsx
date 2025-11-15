import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, SafeAreaView, Alert } from 'react-native';
import { ChevronRight, Menu, Search, Plus } from 'lucide-react-native';
import VideoSummaryModal from '../components/VideoSummaryModal';

export default function HomeScreen() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Mock categories data
  const categories = [
    { id: '1', name: 'All', count: 24 },
    { id: '2', name: 'AI/ML', count: 8 },
    { id: '3', name: 'Startups', count: 6 },
    { id: '4', name: 'Health', count: 5 },
    { id: '5', name: 'Tech', count: 3 },
    { id: '6', name: 'Finance', count: 2 },
  ];

  // Mock video data with detailed notes
  const videos = [
    {
      id: '1',
      title: 'Top 5 AI Trends in 2024',
      platform: 'YouTube',
      date: '2 days ago',
      thumbnail: 'https://images.unsplash.com/photo-1480694313141-fce5e697ee25?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8c21hcnRwaG9uZXxlbnwwfHwwfHx8MA%3D%3D',
      summary: 'Exploring the latest developments in artificial intelligence...',
      notes: [
        'Generative AI continues to evolve with multimodal capabilities',
        'Large Language Models are becoming more efficient and specialized',
        'AI agents are starting to automate complex workflows',
        'Ethical AI and regulation remain key concerns for 2024',
        'Edge computing is enabling faster, more private AI processing'
      ]
    },
    {
      id: '2',
      title: 'How to Build a Successful Startup',
      platform: 'TikTok',
      date: '1 week ago',
      thumbnail: 'https://images.unsplash.com/photo-1543033906-8f2a9f541af9?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZXNwb3J0cyUyMHZpcnR1YWwlMjByYWNpbmclMjBldmVudHxlbnwwfHwwfHx8MA%3D%3D',
      summary: 'Essential tips for launching your business idea...',
      notes: [
        'Validate your idea before investing heavily in development',
        'Focus on solving a real problem for your target audience',
        'Build a minimum viable product to test market fit',
        'Network with mentors and potential investors early',
        'Plan for scaling from the beginning but stay lean initially'
      ]
    },
    {
      id: '3',
      title: 'Morning Yoga Routine for Beginners',
      platform: 'Instagram',
      date: '2 weeks ago',
      thumbnail: 'https://images.unsplash.com/photo-1517340073101-289191978ae8?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fDMlMjBncmFwaGljc3xlbnwwfHwwfHx8MA%3D%3D',
      summary: 'A simple 15-minute routine to start your day right...',
      notes: [
        'Begin with 5 minutes of deep breathing to center yourself',
        'Cat-Cow stretch warms up the spine effectively',
        'Downward dog strengthens arms and legs simultaneously',
        'Warrior poses build confidence and balance',
        'Finish with 2 minutes of meditation for mental clarity'
      ]
    },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleVideoPress = (video: any) => {
    setSelectedVideo(video);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedVideo(null);
  };

  const handleOpenOriginal = () => {
    if (selectedVideo) {
      Alert.alert(
        'Open Video',
        `Opening ${selectedVideo.platform} video: ${selectedVideo.title}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => console.log('Opening original video') }
        ]
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Top Navigation Bar */}
      <View className="flex-row items-center justify-between bg-white p-4 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={toggleSidebar} className="mr-3">
            <Menu size={24} color="#2196F3" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">ReelSummarizer</Text>
        </View>
        
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4">
            <Search size={24} color="#757575" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Plus size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 flex-row">
        {/* Collapsible Sidebar */}
        {isSidebarOpen && (
          <View className="w-64 bg-white border-r border-gray-200">
            <ScrollView className="p-4">
              <Text className="text-lg font-bold text-gray-800 mb-4">Categories</Text>
              
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  className={`flex-row items-center justify-between py-3 px-2 rounded-lg ${
                    selectedCategory === category.name ? 'bg-blue-50' : ''
                  }`}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Text
                    className={`${
                      selectedCategory === category.name
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    {category.name}
                  </Text>
                  <View className="bg-gray-100 rounded-full px-2 py-1">
                    <Text className="text-gray-600 text-xs">{category.count}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity className="flex-row items-center mt-6 py-3 px-2">
                <Text className="text-blue-600 font-medium">+ Add Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Main Content Area */}
        <View className="flex-1">
          <ScrollView className="p-4">
            <View className="mb-6">
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                {selectedCategory} Videos
              </Text>
              <Text className="text-gray-600">
                {videos.length} summarized videos
              </Text>
            </View>

            {/* Video Cards */}
            <View className="gap-4">
              {videos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                  onPress={() => handleVideoPress(video)}
                >
                  <View className="flex-row">
                    <Image
                      source={{ uri: video.thumbnail }}
                      className="w-24 h-24"
                    />
                    <View className="flex-1 p-3">
                      <Text className="font-semibold text-gray-800 mb-1" numberOfLines={2}>
                        {video.title}
                      </Text>
                      
                      <View className="flex-row items-center mb-2">
                        <View className="bg-blue-100 rounded-full px-2 py-1 mr-2">
                          <Text className="text-blue-700 text-xs font-medium">
                            {video.platform}
                          </Text>
                        </View>
                        <Text className="text-gray-500 text-sm">{video.date}</Text>
                      </View>
                      
                      <Text className="text-gray-600 text-sm" numberOfLines={2}>
                        {video.summary}
                      </Text>
                    </View>
                    
                    <View className="justify-center pr-3">
                      <ChevronRight size={20} color="#757575" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Video Summary Modal */}
      <VideoSummaryModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        video={selectedVideo || {}}
        onOpenOriginal={handleOpenOriginal}
      />

      {/* Floating Action Button */}
      <TouchableOpacity className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg">
        <Plus size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}