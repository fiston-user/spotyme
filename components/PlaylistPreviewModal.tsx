import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { apiService } from '../services/api';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PlaylistPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  playlistId: string;
  playlistBasicInfo?: {
    name: string;
    description?: string;
    images?: Array<{ url: string }>;
  };
}

export const PlaylistPreviewModal: React.FC<PlaylistPreviewModalProps> = ({
  visible,
  onClose,
  playlistId,
  playlistBasicInfo,
}) => {
  const router = useRouter();
  const [playlistDetails, setPlaylistDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (visible && playlistId) {
      fetchPlaylistDetails();
    }
  }, [visible, playlistId]);

  const fetchPlaylistDetails = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getSpotifyPlaylistDetails(playlistId);
      if (response.success && response.data) {
        setPlaylistDetails(response.data);
      } else {
        Alert.alert('Error', 'Failed to load playlist details');
      }
    } catch (error) {
      console.error('Error fetching playlist details:', error);
      Alert.alert('Error', 'Failed to load playlist details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateTotalDuration = () => {
    if (!playlistDetails?.tracks?.items) return '0 min';
    const totalMs = playlistDetails.tracks.items.reduce((acc: number, item: any) => {
      return acc + (item.track?.duration_ms || 0);
    }, 0);
    const totalMinutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
  };

  const handleBuildSimilar = () => {
    if (!playlistDetails?.tracks?.items || playlistDetails.tracks.items.length === 0) {
      Alert.alert('No tracks', 'This playlist has no tracks to use as seeds');
      return;
    }
    
    // Use first track as seed for playlist builder
    const firstTrack = playlistDetails.tracks.items[0].track;
    if (firstTrack) {
      onClose();
      router.push(`/playlist-builder/${firstTrack.id}`);
    }
  };

  const handleImportToLibrary = async () => {
    setIsImporting(true);
    try {
      // Get all tracks from the playlist
      const tracks = playlistDetails.tracks.items.map((item: any) => item.track.id);
      
      // Create a new playlist with these tracks
      const response = await apiService.createPlaylist(
        `${playlistDetails.name} (Copy)`,
        playlistDetails.description || `Imported from Spotify - ${playlistDetails.owner?.display_name || 'Unknown'}`,
        tracks
      );
      
      if (response.success) {
        Alert.alert('Success', 'Playlist imported to your library!', [
          { text: 'View Playlist', onPress: () => {
            onClose();
            router.push('/playlists');
          }},
          { text: 'OK' }
        ]);
      } else {
        Alert.alert('Error', 'Failed to import playlist');
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import playlist');
    } finally {
      setIsImporting(false);
    }
  };

  const handleViewOnSpotify = () => {
    if (playlistDetails?.external_urls?.spotify) {
      Linking.openURL(playlistDetails.external_urls.spotify);
    }
  };

  const data = playlistDetails || playlistBasicInfo;

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
            <Text style={styles.headerTitle}>Playlist Preview</Text>
            <View style={{ width: 24 }} />
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading playlist details...</Text>
            </View>
          ) : data ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Playlist Info */}
              <View style={styles.playlistInfo}>
                <Image
                  source={{ uri: data.images?.[0]?.url || 'https://picsum.photos/seed/playlist/300/300' }}
                  style={styles.playlistImage}
                />
                <Text style={styles.playlistName}>{data.name}</Text>
                {data.description && (
                  <Text style={styles.playlistDescription}>{data.description}</Text>
                )}
                <View style={styles.playlistMeta}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="person" size={16} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {data.owner?.display_name || 'Spotify'}
                    </Text>
                  </View>
                  {data.tracks && (
                    <>
                      <View style={styles.metaDivider} />
                      <View style={styles.metaItem}>
                        <MaterialIcons name="queue-music" size={16} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>
                          {data.tracks.total} tracks
                        </Text>
                      </View>
                    </>
                  )}
                  {playlistDetails && (
                    <>
                      <View style={styles.metaDivider} />
                      <View style={styles.metaItem}>
                        <MaterialIcons name="schedule" size={16} color={Colors.textSecondary} />
                        <Text style={styles.metaText}>
                          {calculateTotalDuration()}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleBuildSimilar}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={Colors.gradients.green as any}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialIcons name="auto-awesome" size={24} color={Colors.background} />
                    <Text style={styles.actionButtonText}>Build Similar Playlist</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleImportToLibrary}
                  activeOpacity={0.8}
                  disabled={isImporting}
                >
                  <LinearGradient
                    colors={Colors.gradients.purple as any}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isImporting ? (
                      <ActivityIndicator size="small" color={Colors.text} />
                    ) : (
                      <MaterialIcons name="library-add" size={24} color={Colors.text} />
                    )}
                    <Text style={[styles.actionButtonText, { color: Colors.text }]}>
                      {isImporting ? 'Importing...' : 'Import to Library'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleViewOnSpotify}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionButtonGradient, styles.spotifyButton]}>
                    <Ionicons name="logo-spotify" size={24} color={Colors.primary} />
                    <Text style={[styles.actionButtonText, { color: Colors.text }]}>
                      View on Spotify
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Track Preview */}
              {playlistDetails?.tracks?.items && playlistDetails.tracks.items.length > 0 && (
                <View style={styles.trackPreview}>
                  <Text style={styles.sectionTitle}>Track Preview</Text>
                  {playlistDetails.tracks.items.slice(0, 5).map((item: any, index: number) => (
                    <View key={item.track.id} style={styles.trackItem}>
                      <Text style={styles.trackNumber}>{index + 1}</Text>
                      <Image
                        source={{ uri: item.track.album?.images?.[0]?.url || 'https://picsum.photos/seed/track/50/50' }}
                        style={styles.trackImage}
                      />
                      <View style={styles.trackInfo}>
                        <Text style={styles.trackName} numberOfLines={1}>
                          {item.track.name}
                        </Text>
                        <Text style={styles.trackArtist} numberOfLines={1}>
                          {item.track.artists?.map((a: any) => a.name).join(', ')}
                        </Text>
                      </View>
                      <Text style={styles.trackDuration}>
                        {formatDuration(item.track.duration_ms)}
                      </Text>
                    </View>
                  ))}
                  {data.tracks.total > 5 && (
                    <Text style={styles.moreTracksText}>
                      +{data.tracks.total - 5} more tracks
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          ) : null}
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
    maxHeight: screenHeight * 0.85,
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
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  playlistInfo: {
    alignItems: 'center',
    padding: 20,
  },
  playlistImage: {
    width: 160,
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  playlistMeta: {
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
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  spotifyButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trackPreview: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  trackNumber: {
    width: 20,
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  trackImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  trackDuration: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  moreTracksText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});