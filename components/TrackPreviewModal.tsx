import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { apiService } from '../services/api';
import { useRouter } from 'expo-router';

const { height: screenHeight } = Dimensions.get('window');

interface TrackPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  track: any;
}

export const TrackPreviewModal: React.FC<TrackPreviewModalProps> = ({
  visible,
  onClose,
  track,
}) => {
  const router = useRouter();
  const [audioFeatures, setAudioFeatures] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  useEffect(() => {
    if (visible && track?.id) {
      fetchAudioFeatures();
    }
  }, [visible, track]);

  const fetchAudioFeatures = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getTrackAudioFeatures(track.id);
      if (response.success && response.data) {
        setAudioFeatures(response.data);
      }
    } catch (error) {
      console.error('Error fetching audio features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


  const handleCreatePlaylist = () => {
    onClose();
    router.push(`/playlist-builder/${track.id}`);
  };

  const handleQuickAdd = async () => {
    setIsCreatingPlaylist(true);
    try {
      // Create a quick playlist with AI recommendations based on this track
      const response = await apiService.generatePlaylist({
        seedTracks: [track.id],
        name: `Mix based on ${track.name}`,
        description: `AI-generated playlist based on "${track.name}" by ${track.artists?.map((a: any) => a.name).join(', ')}`,
        options: {
          limit: 20,
        },
      });

      if (response.success) {
        Alert.alert(
          'Playlist Created!',
          `Successfully created a playlist with 20 tracks`,
          [
            { 
              text: 'View Playlists', 
              onPress: () => {
                onClose();
                router.push('/(tabs)/playlists');
              }
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Quick add error:', error);
      Alert.alert('Error', 'Failed to create playlist');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };


  if (!track) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView intensity={100} tint="dark" style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Track Options</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Track Info */}
          <View style={styles.trackInfo}>
            <Image
              source={{ uri: track.album?.images?.[0]?.url || 'https://picsum.photos/seed/track/300/300' }}
              style={styles.albumArt}
            />
            <Text style={styles.trackName}>{track.name}</Text>
            <Text style={styles.artistName}>
              {track.artists?.map((a: any) => a.name).join(', ')}
            </Text>
            <Text style={styles.albumName}>{track.album?.name}</Text>
            
            {/* Track Meta */}
            <View style={styles.trackMeta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={16} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  {formatDuration(track.duration_ms)}
                </Text>
              </View>
              {track.popularity && (
                <>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaItem}>
                    <MaterialIcons name="trending-up" size={16} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {track.popularity}% popular
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Track Vibe Tags */}
          {audioFeatures && (
            <View style={styles.vibeSection}>
              <View style={styles.vibeTags}>
                {audioFeatures.energy >= 0.7 && (
                  <View style={[styles.vibeTag, { backgroundColor: 'rgba(226, 33, 52, 0.15)' }]}>
                    <MaterialIcons name="whatshot" size={14} color={Colors.danger} />
                    <Text style={[styles.vibeTagText, { color: Colors.danger }]}>
                      High Energy
                    </Text>
                  </View>
                )}
                {audioFeatures.energy < 0.4 && (
                  <View style={[styles.vibeTag, { backgroundColor: 'rgba(69, 10, 245, 0.15)' }]}>
                    <MaterialIcons name="nightlight" size={14} color="#450AF5" />
                    <Text style={[styles.vibeTagText, { color: '#450AF5' }]}>
                      Chill
                    </Text>
                  </View>
                )}
                {audioFeatures.valence >= 0.7 && (
                  <View style={[styles.vibeTag, { backgroundColor: 'rgba(255, 205, 0, 0.15)' }]}>
                    <MaterialIcons name="sentiment-very-satisfied" size={14} color="#FFCD00" />
                    <Text style={[styles.vibeTagText, { color: '#FFCD00' }]}>
                      Feel Good
                    </Text>
                  </View>
                )}
                {audioFeatures.valence < 0.3 && (
                  <View style={[styles.vibeTag, { backgroundColor: 'rgba(92, 67, 232, 0.15)' }]}>
                    <MaterialIcons name="nights-stay" size={14} color="#5C43E8" />
                    <Text style={[styles.vibeTagText, { color: '#5C43E8' }]}>
                      Moody
                    </Text>
                  </View>
                )}
                {audioFeatures.danceability > 0.7 && (
                  <View style={[styles.vibeTag, { backgroundColor: 'rgba(29, 185, 84, 0.15)' }]}>
                    <MaterialIcons name="directions-run" size={14} color={Colors.primary} />
                    <Text style={[styles.vibeTagText, { color: Colors.primary }]}>
                      Danceable
                    </Text>
                  </View>
                )}
                {audioFeatures.acousticness > 0.7 && (
                  <View style={[styles.vibeTag, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                    <MaterialIcons name="piano" size={14} color="#8B5CF6" />
                    <Text style={[styles.vibeTagText, { color: '#8B5CF6' }]}>
                      Acoustic
                    </Text>
                  </View>
                )}
                {track.popularity >= 80 && (
                  <View style={[styles.vibeTag, { backgroundColor: 'rgba(255, 107, 0, 0.15)' }]}>
                    <MaterialIcons name="trending-up" size={14} color="#FF6B00" />
                    <Text style={[styles.vibeTagText, { color: '#FF6B00' }]}>
                      Trending
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreatePlaylist}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Colors.gradients.green as any}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="auto-awesome" size={24} color={Colors.background} />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.primaryButtonText}>Create Custom Playlist</Text>
                  <Text style={styles.buttonSubtext}>Customize energy, mood & more</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleQuickAdd}
              activeOpacity={0.8}
              disabled={isCreatingPlaylist}
            >
              <LinearGradient
                colors={Colors.gradients.purple as any}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isCreatingPlaylist ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <MaterialIcons name="playlist-add" size={24} color={Colors.text} />
                )}
                <View style={styles.buttonTextContainer}>
                  <Text style={[styles.secondaryButtonText]}>
                    {isCreatingPlaylist ? 'Creating...' : 'Quick AI Playlist'}
                  </Text>
                  <Text style={[styles.buttonSubtext, { color: Colors.text, opacity: 0.8 }]}>
                    Instant 20-track mix
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.75,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  trackInfo: {
    alignItems: 'center',
    padding: 20,
  },
  albumArt: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
  },
  trackName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  artistName: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  albumName: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: 12,
  },
  trackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  vibeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  vibeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  vibeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  vibeTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  secondaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  buttonTextContainer: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonSubtext: {
    fontSize: 12,
    color: Colors.background,
    opacity: 0.9,
    marginTop: 2,
  },
});