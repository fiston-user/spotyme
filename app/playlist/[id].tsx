import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { SongCard } from '../../components/SongCard';
import { Button } from '../../components/ui/Button';
import { apiService } from '../../services/api';
import { Card } from '../../components/ui/Card';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [playlist, setPlaylist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPlaylist();
    }
  }, [id]);

  const fetchPlaylist = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getPlaylist(id as string);
      
      if (response.success && response.data) {
        setPlaylist(response.data);
        if (response.data.spotifyPlaylistId) {
          setSpotifyUrl(`https://open.spotify.com/playlist/${response.data.spotifyPlaylistId}`);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to load playlist');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      Alert.alert('Error', 'Failed to load playlist');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToSpotify = async () => {
    setIsExporting(true);
    try {
      const response = await apiService.exportPlaylistToSpotify(id as string);
      
      if (response.success && response.data) {
        setSpotifyUrl(response.data.spotifyUrl);
        Alert.alert(
          'Success!',
          'Your playlist has been exported to Spotify',
          [
            {
              text: 'Open in Spotify',
              onPress: () => {
                if (response.data.spotifyUrl) {
                  Linking.openURL(response.data.spotifyUrl);
                }
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to export playlist');
      }
    } catch (error) {
      console.error('Error exporting playlist:', error);
      Alert.alert('Error', 'Failed to export playlist to Spotify');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete Playlist',
      'Are you sure you want to delete this playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const response = await apiService.deletePlaylist(id as string);
              
              if (response.success) {
                Alert.alert('Success', 'Playlist deleted successfully');
                router.replace('/(tabs)/playlists');
              } else {
                Alert.alert('Error', response.error || 'Failed to delete playlist');
              }
            } catch (error) {
              console.error('Error deleting playlist:', error);
              Alert.alert('Error', 'Failed to delete playlist');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading playlist...</Text>
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>Playlist not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="primary"
          size="medium"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={playlist.tracks || []}
        keyExtractor={(item, index) => item.spotifyId || index.toString()}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={Colors.gradients.blue as any}
              style={styles.header}
            >
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
              </TouchableOpacity>
              
              {playlist.tracks?.[0]?.albumArt && (
                <Image 
                  source={{ uri: playlist.tracks[0].albumArt }} 
                  style={styles.coverArt}
                />
              )}
              <Text style={styles.playlistName}>{playlist.name}</Text>
              <Text style={styles.playlistDescription}>{playlist.description}</Text>
              <Text style={styles.playlistStats}>
                {playlist.tracks?.length || 0} tracks • {formatDuration(playlist.totalDuration || 0)}
              </Text>
            </LinearGradient>

            <View style={styles.controls}>
              {spotifyUrl ? (
                <Button
                  title="Open in Spotify"
                  onPress={() => Linking.openURL(spotifyUrl)}
                  variant="primary"
                  size="large"
                  style={styles.playButton}
                />
              ) : (
                <Button
                  title={isExporting ? "Exporting..." : "Export to Spotify"}
                  onPress={handleExportToSpotify}
                  variant="primary"
                  size="large"
                  disabled={isExporting}
                  style={styles.playButton}
                />
              )}
              <Button
                title={isDeleting ? "Deleting..." : "Delete"}
                onPress={handleDeletePlaylist}
                variant="outline"
                size="large"
                disabled={isDeleting}
                style={styles.deleteButton}
              />
            </View>

            {playlist.generationParams && (
              <Card style={styles.paramsCard}>
                <Text style={styles.paramsTitle}>Generation Settings</Text>
                <View style={styles.paramRow}>
                  <Text style={styles.paramLabel}>Energy</Text>
                  <View style={styles.paramBar}>
                    <View 
                      style={[
                        styles.paramFill, 
                        { width: `${(playlist.generationParams.targetEnergy || 0.5) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.paramValue}>
                    {Math.round((playlist.generationParams.targetEnergy || 0.5) * 100)}%
                  </Text>
                </View>
                <View style={styles.paramRow}>
                  <Text style={styles.paramLabel}>Mood</Text>
                  <View style={styles.paramBar}>
                    <View 
                      style={[
                        styles.paramFill, 
                        { width: `${(playlist.generationParams.targetValence || 0.5) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.paramValue}>
                    {Math.round((playlist.generationParams.targetValence || 0.5) * 100)}%
                  </Text>
                </View>
              </Card>
            )}

            <Text style={styles.songsTitle}>Tracks</Text>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.songRow}>
            <Text style={styles.songIndex}>{index + 1}</Text>
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {item.artist} • {item.album}
              </Text>
            </View>
            <Text style={styles.trackDuration}>
              {Math.floor(item.duration / 60000)}:{((item.duration % 60000) / 1000).toFixed(0).padStart(2, '0')}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 18,
    color: '#FF6B6B',
    marginBottom: 20,
    marginTop: 16,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  coverArt: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  playlistName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  playlistDescription: {
    fontSize: 16,
    color: Colors.text,
    opacity: 0.9,
    marginBottom: 8,
    textAlign: 'center',
  },
  playlistStats: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  playButton: {
    flex: 1,
    marginRight: 10,
  },
  shuffleButton: {
    flex: 1,
    marginLeft: 10,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 10,
    borderColor: '#FF6B6B',
  },
  paramsCard: {
    margin: 16,
    padding: 16,
  },
  paramsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paramLabel: {
    width: 60,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  paramBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginHorizontal: 12,
  },
  paramFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  paramValue: {
    width: 40,
    fontSize: 12,
    color: Colors.text,
    textAlign: 'right',
  },
  songsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  songIndex: {
    width: 30,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  trackDuration: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingBottom: 40,
  },
});