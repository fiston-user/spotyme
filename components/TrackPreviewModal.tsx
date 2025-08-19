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
  ScrollView,
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
      console.log('Audio features response:', response);
      if (response.success && response.data) {
        console.log('Audio features data:', response.data);
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
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject}>
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.modalContentWrapper}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
          {/* Blurred Album Art Background */}
          {(track?.album?.images?.[0]?.url || track?.albumArt) && (
            <>
              <Image
                source={{ uri: track.album?.images?.[0]?.url || track.albumArt }}
                style={styles.backgroundImage}
                blurRadius={25}
              />
              <LinearGradient
                colors={[
                  'rgba(18, 18, 18, 0.4)',
                  'rgba(18, 18, 18, 0.85)',
                  Colors.background,
                ]}
                style={styles.backgroundGradient}
                locations={[0, 0.5, 1]}
              />
            </>
          )}
          
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <BlurView intensity={80} style={styles.closeButtonBlur}>
                  <MaterialIcons name="close" size={20} color={Colors.text} />
                </BlurView>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Track Options</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Track Info */}
            <View style={styles.trackInfo}>
            <Image
              source={{ uri: track.album?.images?.[0]?.url || track.albumArt || 'https://picsum.photos/seed/track/300/300' }}
              style={styles.albumArt}
            />
            <Text style={styles.trackName}>{track.name || track.title}</Text>
            <Text style={styles.artistName}>
              {track.artists?.map((a: any) => a.name).join(', ') || track.artist}
            </Text>
            <Text style={styles.albumName}>{track.album?.name || track.album}</Text>
            
            {/* Track Meta */}
            <View style={styles.trackMeta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={16} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  {track.duration_ms ? formatDuration(track.duration_ms) : track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}
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
          {audioFeatures && (() => {
            const allTags = [];
            
            // Energy tag (always show one)
            if (audioFeatures.energy >= 0.65) {
              allTags.push({
                icon: "whatshot",
                label: "High Energy",
                bgColor: 'rgba(226, 33, 52, 0.15)',
                color: Colors.danger
              });
            } else if (audioFeatures.energy >= 0.45) {
              allTags.push({
                icon: "flash-on",
                label: "Moderate Energy",
                bgColor: 'rgba(255, 165, 0, 0.15)',
                color: Colors.warning
              });
            } else {
              allTags.push({
                icon: "nightlight",
                label: "Chill",
                bgColor: 'rgba(69, 10, 245, 0.15)',
                color: "#450AF5"
              });
            }
            
            // Mood tag (always show one)
            if (audioFeatures.valence >= 0.65) {
              allTags.push({
                icon: "sentiment-very-satisfied",
                label: "Feel Good",
                bgColor: 'rgba(255, 205, 0, 0.15)',
                color: "#FFCD00"
              });
            } else if (audioFeatures.valence >= 0.35) {
              allTags.push({
                icon: "mood",
                label: "Neutral Mood",
                bgColor: 'rgba(29, 185, 84, 0.15)',
                color: Colors.primary
              });
            } else {
              allTags.push({
                icon: "nights-stay",
                label: "Moody",
                bgColor: 'rgba(92, 67, 232, 0.15)',
                color: "#5C43E8"
              });
            }
            
            // Additional tags (count them but don't show all)
            let additionalCount = 0;
            if (audioFeatures.danceability >= 0.6) additionalCount++;
            if (audioFeatures.acousticness >= 0.6) additionalCount++;
            if (track.popularity >= 70) additionalCount++;
            if (audioFeatures.instrumentalness >= 0.5) additionalCount++;
            
            const visibleTags = allTags.slice(0, 2);
            
            return (
              <View style={styles.vibeSection}>
                <View style={styles.vibeTags}>
                  {visibleTags.map((tag, index) => (
                    <View key={index} style={[styles.vibeTag, { backgroundColor: tag.bgColor }]}>
                      <MaterialIcons name={tag.icon as any} size={14} color={tag.color} />
                      <Text style={[styles.vibeTagText, { color: tag.color }]}>
                        {tag.label}
                      </Text>
                    </View>
                  ))}
                  {additionalCount > 0 && (
                    <View style={[styles.vibeTag, styles.moreTag]}>
                      <Text style={styles.moreTagText}>+{additionalCount} more</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })()}

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
          
          {/* Bottom padding for scroll */}
          <View style={{ height: 40 }} />
          </ScrollView>
        </View>
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalContentWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.85,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    width: '100%',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  closeButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  closeButtonBlur: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  trackInfo: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  albumArt: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
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
  moreTag: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moreTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
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