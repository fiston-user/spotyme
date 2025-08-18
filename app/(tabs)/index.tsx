import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Song } from '../../constants/MockData';
import { SearchBar } from '../../components/ui/SearchBar';
import { SongCard } from '../../components/SongCard';
import { RecommendationList } from '../../components/RecommendationList';
import { Button } from '../../components/ui/Button';
import { apiService } from '../../services/api';

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Transform Spotify track data to our Song interface
  const transformSpotifyTrack = (track: any): Song => {
    return {
      id: track.id,
      title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      duration: Math.floor(track.duration_ms / 1000),
      albumArt: track.album?.images?.[0]?.url || 'https://picsum.photos/seed/spotify/300/300',
      genre: [],
      mood: [],
      energy: 0.5,
      popularity: track.popularity || 0,
    };
  };

  // Search for songs
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiService.searchTracks(query, 10);
      if (response.success && response.data?.tracks?.items) {
        const transformedTracks = response.data.tracks.items.map(transformSpotifyTrack);
        setSearchResults(transformedTracks);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim()) {
      const newTimeout = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);
      setSearchTimeout(newTimeout);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  // Get recommendations based on selected song
  const getRecommendations = async (song: Song) => {
    setIsLoadingRecommendations(true);
    try {
      const response = await apiService.getRecommendations(song.id, 12);

      if (response.success && response.data) {
        const data = response.data;
        if (data.tracks) {
          const transformedTracks = data.tracks.map(transformSpotifyTrack);
          setRecommendations(transformedTracks);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to get recommendations');
      }
    } catch (err) {
      console.error('Recommendations error:', err);
      Alert.alert('Error', 'Failed to get recommendations');
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleSongSelect = async (song: Song) => {
    setSelectedSong(song);
    setSearchQuery('');
    setSearchResults([]);
    await getRecommendations(song);
  };

  const handleAddToPlaylist = (song: Song) => {
    if (!playlistSongs.find(s => s.id === song.id)) {
      setPlaylistSongs([...playlistSongs, song]);
      Alert.alert(
        'Added to Collection!', 
        `${song.title} added. You have ${playlistSongs.length + 1} songs collected.\n\nClick "Create Playlist" below to save them.`
      );
    } else {
      Alert.alert('Already Added', `${song.title} is already in your collection`);
    }
  };

  const handleCreatePlaylist = async () => {
    if (playlistSongs.length === 0) {
      Alert.alert('No Songs', 'Add some songs to create a playlist');
      return;
    }

    setIsCreatingPlaylist(true);
    try {
      const seedTracks = selectedSong ? [selectedSong.id] : [];
      const selectedTrackIds = playlistSongs.map(s => s.id);
      
      const response = await apiService.generatePlaylist({
        seedTracks,
        selectedTracks: selectedTrackIds, // Send the actual selected tracks
        name: `SpotYme Playlist - ${new Date().toLocaleDateString()}`,
        description: `Created based on ${selectedSong?.title || 'your selections'} with ${playlistSongs.length} tracks`,
        options: {
          limit: playlistSongs.length,
        },
      });

      if (response.success && response.data) {
        Alert.alert(
          'Playlist Created!',
          `Your playlist has been created and saved to your library`,
          [
            {
              text: 'View Playlists',
              onPress: () => router.push('/(tabs)/playlists'),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
        setPlaylistSongs([]);
        setSelectedSong(null);
        setRecommendations([]);
      } else {
        Alert.alert('Error', response.error || 'Failed to create playlist');
      }
    } catch (err) {
      console.error('Create playlist error:', err);
      Alert.alert('Error', 'Failed to create playlist');
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={Colors.gradients.purple as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Discover Your Sound</Text>
        <Text style={styles.headerSubtitle}>
          Find your perfect playlist based on songs you love
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for a song you love..."
          onClear={() => setSearchQuery('')}
        />

        {searchQuery.length > 0 && (
          <View style={styles.searchResults}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Searching Spotify...</Text>
              </View>
            ) : (
              searchResults.slice(0, 5).map(song => (
                <SongCard
                  key={song.id}
                  song={song}
                  onPress={() => handleSongSelect(song)}
                />
              ))
            )}
          </View>
        )}

        {selectedSong && !searchQuery && (
          <>
            <View style={styles.selectedSection}>
              <Text style={styles.sectionTitle}>Based on</Text>
              <SongCard
                song={selectedSong}
                onPress={() => {}}
                showPlaylistButton={true}
                onPlaylistPress={() => router.push(`/playlist-builder/${selectedSong.id}`)}
              />
            </View>

            {isLoadingRecommendations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Getting recommendations...</Text>
              </View>
            ) : recommendations.length > 0 ? (
              <RecommendationList
                title="Recommended for You"
                songs={recommendations}
                onSongPress={(song) => handleSongSelect(song)}
                onAddToPlaylist={handleAddToPlaylist}
                showAddButton={true}
              />
            ) : null}

            {playlistSongs.length > 0 && (
              <View style={styles.playlistPreview}>
                <Text style={styles.sectionTitle}>
                  Song Collection ({playlistSongs.length} songs)
                </Text>
                <Text style={styles.collectionHint}>
                  These songs will be saved when you create the playlist
                </Text>
                <Button
                  title={isCreatingPlaylist ? "Creating..." : "Create Playlist"}
                  onPress={handleCreatePlaylist}
                  variant="primary"
                  size="large"
                  style={styles.createButton}
                  disabled={isCreatingPlaylist}
                />
              </View>
            )}
          </>
        )}

        {!selectedSong && !searchQuery && (
          <View style={styles.emptyState}>
            <Ionicons name="headset" size={64} color={Colors.primary} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Start Your Journey</Text>
            <Text style={styles.emptyText}>
              Search for a song you love and we'll create the perfect playlist for you
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.text,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  searchResults: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  selectedSection: {
    marginTop: 10,
  },
  playlistPreview: {
    padding: 16,
    marginTop: 20,
  },
  createButton: {
    marginTop: 12,
  },
  collectionHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});