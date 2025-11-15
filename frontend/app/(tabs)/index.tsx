import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Alert, Animated, ActivityIndicator, Linking, Modal, TextInput, RefreshControl } from 'react-native';
import { ChevronRight, Menu, Plus, X } from 'lucide-react-native';
import VideoSummaryModal from '../../components/VideoSummaryModal';
import { fetchUserVideos, Video, transcribeVideo } from '../../lib/api';

export default function HomeScreen() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Add Video Modal State
  const [isAddVideoModalVisible, setIsAddVideoModalVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation value for sidebar
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Fetch videos from backend
  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedVideos = await fetchUserVideos();
        console.log('Fetched videos:', fetchedVideos);
        console.log('Categories in videos:', fetchedVideos.map(v => ({ id: v.id, category: v.category })));
        setVideos(fetchedVideos);
      } catch (err) {
        console.error('Failed to fetch videos:', err);
        setError('Failed to load videos. Make sure the backend is running on http://localhost:8000');
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const fetchedVideos = await fetchUserVideos();
      setVideos(fetchedVideos);
    } catch (err) {
      console.error('Failed to refresh videos:', err);
      setError('Failed to refresh videos. Make sure the backend is running.');
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate category counts dynamically from videos
  const uniqueCategories = Array.from(new Set(videos.map(v => v.category).filter(Boolean)));
  console.log('Unique categories found:', uniqueCategories);
  const categories = [
    { id: '1', name: 'All', count: videos.length },
    ...uniqueCategories.map((name, index) => ({
      id: String(index + 2),
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
      count: videos.filter(video => video.category === name).length
    }))
  ];
  console.log('Categories with counts:', categories);

  // Filter videos based on selected category
  const filteredVideos = selectedCategory === 'All'
    ? videos
    : videos.filter(video => {
        const categoryName = video.category.charAt(0).toUpperCase() + video.category.slice(1);
        return categoryName === selectedCategory;
      });

  // Animate sidebar on state change
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isSidebarOpen ? 0 : -256, // -256px is the sidebar width
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: isSidebarOpen ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  const handleVideoPress = (video: any) => {
    setSelectedVideo(video);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedVideo(null);
  };

  const handleOpenOriginal = async () => {
    if (selectedVideo?.video_url) {
      try {
        const supported = await Linking.canOpenURL(selectedVideo.video_url);
        if (supported) {
          await Linking.openURL(selectedVideo.video_url);
        } else {
          Alert.alert('Error', `Cannot open URL: ${selectedVideo.video_url}`);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to open video');
        console.error('Error opening URL:', error);
      }
    } else {
      Alert.alert('Error', 'Video URL not available');
    }
  };

  const handleSubmitVideo = async () => {
    if (!videoUrl.trim()) {
      Alert.alert('Error', 'Please enter a video URL');
      return;
    }

    try {
      setIsSubmitting(true);
      await transcribeVideo(videoUrl);

      Alert.alert(
        'Success',
        'Video submitted for processing! It will appear in your list shortly.',
        [{ text: 'OK', onPress: () => {
          setIsAddVideoModalVisible(false);
          setVideoUrl('');
          // Refresh the video list
          const loadVideos = async () => {
            try {
              const fetchedVideos = await fetchUserVideos();
              setVideos(fetchedVideos);
            } catch (err) {
              console.error('Failed to refresh videos:', err);
            }
          };
          loadVideos();
        }}]
      );
    } catch (error) {
      console.error('Error submitting video:', error);
      Alert.alert('Error', 'Failed to submit video. Please try again.');
    } finally {
      setIsSubmitting(false);
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

        <TouchableOpacity
          onPress={() => setIsAddVideoModalVisible(true)}
          className="bg-blue-500 rounded-full p-2"
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 relative">
        {/* Main Content Area (fills available width) */}
        <View className="flex-1">
          <ScrollView
            className="p-4"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2196F3']}
                tintColor="#2196F3"
              />
            }
          >
            <View className="mb-6">
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                {selectedCategory} Videos
              </Text>
              <Text className="text-gray-600">
                {filteredVideos.length} summarized videos
              </Text>
            </View>

            {/* Loading State */}
            {loading && (
              <View className="flex-1 items-center justify-center py-12">
                <ActivityIndicator size="large" color="#2196F3" />
                <Text className="text-gray-600 mt-4">Loading videos...</Text>
              </View>
            )}

            {/* Error State */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-4">
                <Text className="text-red-700 font-medium mb-1">Error</Text>
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            )}

            {/* Empty State */}
            {!loading && !error && filteredVideos.length === 0 && (
              <View className="items-center justify-center py-12">
                <Text className="text-gray-500 text-center">
                  No videos found{selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
                </Text>
              </View>
            )}

            {/* Video Cards */}
            {!loading && !error && filteredVideos.length > 0 && (
              <View className="gap-4">
                {filteredVideos.map((video) => (
                  <TouchableOpacity
                    key={video.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden"
                    onPress={() => handleVideoPress(video)}
                  >
                    <View className="flex-row">
                      <View className="flex-1 p-3">
                        <Text className="font-semibold text-gray-800 mb-1" numberOfLines={2}>
                          {video.title || 'Untitled Video'}
                        </Text>

                        <View className="flex-row items-center mb-2">
                          <View className={`${getCategoryColor(video.category).bg} rounded-full px-2 py-1 mr-2`}>
                            <Text className={`${getCategoryColor(video.category).text} text-xs font-medium`}>
                              {video.category ? video.category.charAt(0).toUpperCase() + video.category.slice(1) : 'Uncategorized'}
                            </Text>
                          </View>
                          <Text className="text-gray-500 text-sm">{video.date}</Text>
                        </View>

                        <Text className="text-gray-600 text-sm" numberOfLines={2}>
                          {video.summary || 'No summary available'}
                        </Text>
                      </View>
                      
                      <View className="justify-center pr-3">
                        <ChevronRight size={20} color="#757575" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>

        {/* Sidebar overlay (appears above content, doesn't change layout) */}
        <>
          {/* Backdrop that closes the sidebar when tapped */}
            <Animated.View
              style={{ opacity: fadeAnim }}
              className="absolute inset-0 z-40"
              pointerEvents={isSidebarOpen ? 'auto' : 'none'}
            >
              <TouchableOpacity
                onPress={toggleSidebar}
                className="flex-1 bg-black/20"
              />
            </Animated.View>

          <Animated.View
            style={{
              transform: [{ translateX: slideAnim }],
            }}
            className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 shadow-lg"
            pointerEvents={isSidebarOpen ? 'auto' : 'none'}
          >
              <ScrollView className="p-4">
                <Text className="text-lg font-bold text-gray-800 mb-4">Categories</Text>
                {categories.map((category) => {
                  const isAll = category.name === 'All';
                  const categoryColor = isAll ? { bg: 'bg-blue-50', text: 'text-blue-600' } : getCategoryColor(category.name.toLowerCase());
                  const isSelected = selectedCategory === category.name;

                  return (
                    <TouchableOpacity
                      key={category.id}
                      className={`flex-row items-center justify-between py-3 px-2 rounded-lg ${
                        isSelected ? categoryColor.bg : ''
                      }`}
                      onPress={() => setSelectedCategory(category.name)}
                    >
                      <View className="flex-row items-center">
                        {!isAll && (
                          <View className={`w-2 h-2 rounded-full ${categoryColor.bg.replace('100', '500')} mr-2`} />
                        )}
                        <Text
                          className={`${
                            isSelected
                              ? `${categoryColor.text} font-semibold`
                              : 'text-gray-700'
                          }`}
                        >
                          {category.name}
                        </Text>
                      </View>
                      <View className="bg-gray-100 rounded-full px-2 py-1">
                        <Text className="text-gray-600 text-xs">{category.count}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </>
      </View>

      {/* Video Summary Modal */}
      <VideoSummaryModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        video={selectedVideo || {}}
        onOpenOriginal={handleOpenOriginal}
      />

      {/* Add Video Modal */}
      <Modal
        visible={isAddVideoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddVideoModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">Add New Video</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsAddVideoModalVisible(false);
                  setVideoUrl('');
                }}
                className="p-1"
              >
                <X size={24} color="#757575" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text className="text-gray-600 mb-4">
              Paste a link to a video from YouTube, TikTok, or Instagram to get it summarized.
            </Text>

            {/* Input Field */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Video URL</Text>
              <TextInput
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor="#9CA3AF"
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!isSubmitting}
              />
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setIsAddVideoModalVisible(false);
                  setVideoUrl('');
                }}
                className="flex-1 bg-gray-100 rounded-lg py-3 items-center"
                disabled={isSubmitting}
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitVideo}
                className={`flex-1 rounded-lg py-3 items-center ${
                  isSubmitting ? 'bg-blue-300' : 'bg-blue-500'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}