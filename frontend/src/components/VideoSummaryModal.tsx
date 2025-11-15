import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '75%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    alignItems: 'center',
  },
  videoInfo: {
    marginBottom: 16,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  platformBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 12,
  },
  platformText: {
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '500',
  },
  dateText: {
    color: '#6b7280',
  },
  thumbnail: {
    width: '100%',
    height: 192,
    borderRadius: 12,
    marginBottom: 16,
  },
  scrollContent: {
    flex: 1,
    marginBottom: 16,
  },
  keyPointsTitle: {
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: 12,
  },
  notesList: {
    marginLeft: 8,
  },
  noteItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  noteBullet: {
    color: '#374151',
    marginRight: 8,
  },
  noteText: {
    color: '#374151',
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

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
    <View style={styles.container}>
      <View style={styles.modal}>
        {/* Header with close button */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Video Summary</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#757575" />
          </TouchableOpacity>
        </View>

        {/* Video info header */}
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          
          <View style={styles.platformRow}>
            <View style={styles.platformBadge}>
              <Text style={styles.platformText}>{video.platform}</Text>
            </View>
            <Text style={styles.dateText}>{video.date}</Text>
          </View>
          
          <Image 
            source={{ uri: video.thumbnail }} 
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>

        {/* Summary content */}
        <ScrollView style={styles.scrollContent}>
          <Text style={styles.keyPointsTitle}>Key Points:</Text>
          
          {video.notes && video.notes.length > 0 ? (
            <View style={styles.notesList}>
              {video.notes.map((note, index) => (
                <View key={index} style={styles.noteItem}>
                  <Text style={styles.noteBullet}>•</Text>
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.notesList}>
              <View style={styles.noteItem}>
                <Text style={styles.noteBullet}>•</Text>
                <Text style={styles.noteText}>{video.summary || "No summary available"}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onOpenOriginal}
        >
          <View style={styles.playIcon}>
            <Play size={20} color="white" />
          </View>
          <Text style={styles.buttonText}>Open Original Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}