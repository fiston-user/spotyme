import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Song } from '../../constants/MockData';
import { SearchBar } from '../../components/ui/SearchBar';
import { Card } from '../../components/ui/Card';
import { apiService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { TrackCarousel } from '../../components/TrackCarousel';
import { ArtistCarousel } from '../../components/ArtistCarousel';
import { FeaturedSection } from '../../components/FeaturedSection';

const { width: screenWidth } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Recommendation states
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  // Transform Spotify track data to our Song interface
  const transformSpotifyTrack = (track: any): Song => {
    return {
      id: track.id,
      title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      duration: Math.floor(track.duration_ms / 1000), // Convert to seconds
      albumArt: track.album?.images?.[0]?.url || 'https://picsum.photos/seed/spotify/300/300',
      genre: [], // Spotify doesn't return genres with tracks
      mood: [], // We'll need to determine this from audio features
      energy: 0.5, // Default, will update with audio features
      popularity: track.popularity || 0,
    };
  };

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.searchTracks(query, 20);
      
      if (response.success && response.data?.tracks?.items) {
        const transformedTracks = response.data.tracks.items.map(transformSpotifyTrack);
        setSearchResults(transformedTracks);  
      } else {
        // Ensure error is always a string
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'Failed to search tracks';
        setError(errorMessage);
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search input with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim()) {
      const newTimeout = setTimeout(() => {
        performSearch(searchQuery);
      }, 500); // 500ms debounce
      setSearchTimeout(newTimeout);
    } else {
      setSearchResults([]);
      setError(null);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const handleSongPress = (song: Song) => {
    // Navigate directly to playlist builder when song is clicked
    router.push(`/playlist-builder/${song.id}`);
  };

  const handleTrackPress = (track: any) => {
    // Navigate to playlist builder with track ID
    router.push(`/playlist-builder/${track.id}`);
  };

  const handleArtistPress = (artist: any) => {
    // Search for artist's songs
    setSearchQuery(artist.name);
  };

  const handlePlaylistPress = (playlist: any) => {
    // Could navigate to a playlist detail view or search for similar
    Alert.alert('Featured Playlist', `${playlist.name}\n${playlist.description || 'Curated by Spotify'}`);
  };

  const handleAlbumPress = (album: any) => {
    // Search for album
    const query = `${album.name} ${album.artists?.[0]?.name || ''}`;
    setSearchQuery(query);
  };

  // Load recommendations when component mounts
  const loadRecommendations = async () => {
    setRecommendationsLoading(true);
    setRecommendationsError(null);

    try {
      // Fetch all recommendations in parallel
      const [tracksRes, artistsRes, featuredRes, releasesRes] = await Promise.all([
        apiService.getTopTracks('short_term', 10).catch(err => ({ success: false, error: err })),
        apiService.getTopArtists('short_term', 10).catch(err => ({ success: false, error: err })),
        apiService.getFeaturedContent('US', 10).catch(err => ({ success: false, error: err })),
        apiService.getNewReleases('US', 10).catch(err => ({ success: false, error: err })),
      ]);

      // Set data even if some requests fail
      if (tracksRes.success && tracksRes.data?.items) {
        setTopTracks(tracksRes.data.items);
      } else {
        console.log('Failed to load top tracks');
      }

      if (artistsRes.success && artistsRes.data?.items) {
        setTopArtists(artistsRes.data.items);
      } else {
        console.log('Failed to load top artists');
      }

      if (featuredRes.success && featuredRes.data?.playlists?.items && featuredRes.data.playlists.items.length > 0) {
        setFeaturedPlaylists(featuredRes.data.playlists.items);
      } else {
        console.log('Failed to load featured playlists or no playlists available');
      }

      if (releasesRes.success && releasesRes.data?.albums?.items && releasesRes.data.albums.items.length > 0) {
        setNewReleases(releasesRes.data.albums.items);
      } else {
        console.log('Failed to load new releases or no releases available');
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setRecommendationsError('Failed to load recommendations');
    } finally {
      setRecommendationsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.background]}
        style={styles.header}
        locations={[0, 0.9]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>DISCOVER</Text>
          <Text style={styles.headerTitle}>Search Music</Text>
          <Text style={styles.headerSubtitle}>Find tracks to build your perfect playlist</Text>
        </View>
      </LinearGradient>

      {/* Enhanced Search Bar */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search songs, artists, albums..."
          onClear={() => setSearchQuery('')}
        />
        
        {/* Quick Genre Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.genreFilters}
          contentContainerStyle={styles.genreFiltersContent}
        >
          {['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical'].map((genre) => (
            <TouchableOpacity
              key={genre}
              style={styles.genreChip}
              onPress={() => setSearchQuery(genre)}
              activeOpacity={0.7}
            >
              <Text style={styles.genreChipText}>{genre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Section */}
      <ScrollView 
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {error && (
          <View style={styles.errorCard}>
            <MaterialIcons name="error-outline" size={24} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Searching Spotify...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Search Results</Text>
              <Text style={styles.resultsCount}>
                {searchResults.length} {searchResults.length === 1 ? 'track' : 'tracks'}
              </Text>
            </View>
            
            <View style={styles.songsList}>
              {searchResults.map((song, index) => (
                <TouchableOpacity
                  key={song.id}
                  style={[
                    styles.songCard,
                    index === 0 && styles.firstSong,
                    index === searchResults.length - 1 && styles.lastSong
                  ]}
                  onPress={() => handleSongPress(song)}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={{ uri: song.albumArt }} 
                    style={styles.songAlbumArt}
                  />
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text style={styles.songArtist} numberOfLines={1}>
                      {song.artist}
                    </Text>
                    <View style={styles.songMeta}>
                      <View style={styles.songMetaItem}>
                        <MaterialIcons name="album" size={12} color={Colors.textTertiary} />
                        <Text style={styles.songMetaText} numberOfLines={1}>
                          {song.album}
                        </Text>
                      </View>
                      <View style={styles.songMetaItem}>
                        <MaterialIcons name="schedule" size={12} color={Colors.textTertiary} />
                        <Text style={styles.songMetaText}>
                          {formatDuration(song.duration)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.songAction}>
                    <LinearGradient
                      colors={Colors.gradients.green as any}
                      style={styles.playlistButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <MaterialIcons name="playlist-add" size={20} color={Colors.background} />
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : searchQuery.trim() && !isLoading ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={Colors.gradients.purple as any}
                style={styles.emptyIconGradient}
              >
                <MaterialIcons name="search-off" size={32} color={Colors.text} />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>
              Try different keywords or check your spelling
            </Text>
          </View>
        ) : !searchQuery.trim() ? (
          <View style={styles.recommendationsContainer}>
            {recommendationsLoading ? (
              <View style={styles.recommendationsLoadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading personalized recommendations...</Text>
              </View>
            ) : recommendationsError ? (
              <View style={styles.welcomeState}>
                <View style={styles.welcomeCard}>
                  <LinearGradient
                    colors={Colors.gradients.blue as any}
                    style={styles.welcomeGradient}
                  >
                    <MaterialIcons name="library-music" size={48} color={Colors.text} />
                    <Text style={styles.welcomeTitle}>Start Searching</Text>
                    <Text style={styles.welcomeText}>
                      Type to search millions of tracks on Spotify
                    </Text>
                  </LinearGradient>
                </View>
                
                <View style={styles.tipsSection}>
                  <Text style={styles.tipsTitle}>Search Tips</Text>
                  <View style={styles.tipCard}>
                    <MaterialIcons name="lightbulb" size={16} color={Colors.primary} />
                    <Text style={styles.tipText}>Tap any song to create a playlist based on it</Text>
                  </View>
                  <View style={styles.tipCard}>
                    <MaterialIcons name="music-note" size={16} color={Colors.primary} />
                    <Text style={styles.tipText}>Search by song title, artist, or album name</Text>
                  </View>
                  <View style={styles.tipCard}>
                    <MaterialIcons name="trending-up" size={16} color={Colors.primary} />
                    <Text style={styles.tipText}>Use genre chips above for quick searches</Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {/* Refresh button */}
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={loadRecommendations}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="refresh" size={20} color={Colors.textSecondary} />
                  <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>

                {topTracks.length > 0 && (
                  <TrackCarousel
                    title="Your Top Tracks"
                    tracks={topTracks}
                    onTrackPress={handleTrackPress}
                    showSeeAll={false}
                  />
                )}

                {topArtists.length > 0 && (
                  <ArtistCarousel
                    title="Recommended Artists"
                    artists={topArtists}
                    onArtistPress={handleArtistPress}
                    showSeeAll={false}
                  />
                )}

                {featuredPlaylists.length > 0 && (
                  <FeaturedSection
                    title="Featured Playlists"
                    items={featuredPlaylists}
                    type="playlist"
                    onItemPress={handlePlaylistPress}
                    showSeeAll={false}
                    gradientColors={Colors.gradients.purple}
                  />
                )}

                {newReleases.length > 0 && (
                  <FeaturedSection
                    title="New Releases"
                    items={newReleases}
                    type="album"
                    onItemPress={handleAlbumPress}
                    showSeeAll={false}
                    gradientColors={Colors.gradients.orange}
                  />
                )}

                {/* Fallback to tips if no recommendations available */}
                {topTracks.length === 0 && topArtists.length === 0 && 
                 featuredPlaylists.length === 0 && newReleases.length === 0 && (
                  <View style={styles.tipsSection}>
                    <Text style={styles.tipsTitle}>Get Started</Text>
                    <View style={styles.tipCard}>
                      <MaterialIcons name="search" size={16} color={Colors.primary} />
                      <Text style={styles.tipText}>Search for your favorite songs</Text>
                    </View>
                    <View style={styles.tipCard}>
                      <MaterialIcons name="playlist-add" size={16} color={Colors.primary} />
                      <Text style={styles.tipText}>Create playlists from any track</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  searchSection: {
    paddingBottom: 8,
  },
  genreFilters: {
    marginTop: 8,
    marginBottom: 8,
  },
  genreFiltersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  genreChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genreChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  resultsSection: {
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    backgroundColor: 'rgba(226, 33, 52, 0.1)',
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    color: Colors.danger,
    fontSize: 14,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  songsList: {
    gap: 1,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  firstSong: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastSong: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  songAlbumArt: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
  },
  songArtist: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  songMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  songMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '45%',
  },
  songMetaText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  songAction: {
    marginLeft: 12,
  },
  playlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  welcomeState: {
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  welcomeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },
  welcomeGradient: {
    padding: 32,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    opacity: 0.9,
  },
  tipsSection: {
    gap: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  recommendationsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  recommendationsLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    gap: 6,
  },
  refreshText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});