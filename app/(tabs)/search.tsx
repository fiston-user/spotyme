import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Song } from '../../constants/MockData';
import { SearchBar } from '../../components/ui/SearchBar';
import { Card } from '../../components/ui/Card';
import { LinearGradient } from 'expo-linear-gradient';
import { TrackCarousel } from '../../components/TrackCarousel';
import { ArtistCarousel } from '../../components/ArtistCarousel';
import { FeaturedSection } from '../../components/FeaturedSection';
import { PlaylistPreviewModal } from '../../components/PlaylistPreviewModal';
import { TrackPreviewModal } from '../../components/TrackPreviewModal';
import { 
  TrackListSkeleton, 
  RecommendationsSkeleton 
} from '../../components/skeletons/SearchSkeletons';
import { useSearchStore, useUIStore } from '../../stores';

const { width: screenWidth } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Use Zustand stores
  const {
    searchQuery,
    searchResults,
    searchHistory,
    topTracks,
    topArtists,
    featuredPlaylists,
    newReleases,
    isSearching,
    isLoadingRecommendations,
    searchError,
    recommendationsError,
    setSearchQuery,
    searchTracks,
    clearSearch,
    fetchRecommendations,
  } = useSearchStore();
  
  const {
    playlistPreviewModal,
    trackPreviewModal,
    showPlaylistPreview,
    hidePlaylistPreview,
    showTrackPreview,
    hideTrackPreview,
    showToast,
  } = useUIStore();


  // Handle search input with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim()) {
      const newTimeout = setTimeout(() => {
        searchTracks(searchQuery);
      }, 500); // 500ms debounce
      setSearchTimeout(newTimeout);
    } else {
      clearSearch();
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const handleSongPress = (song: Song) => {
    showTrackPreview(song);
  };

  const handleTrackPress = (track: any) => {
    showTrackPreview(track);
  };

  const handleArtistPress = (artist: any) => {
    // Search for artist's songs
    setSearchQuery(artist.name);
  };

  const handlePlaylistPress = (playlist: any) => {
    showPlaylistPreview(playlist);
  };

  const handleAlbumPress = (album: any) => {
    // Search for album
    const query = `${album.name} ${album.artists?.[0]?.name || ''}`;
    setSearchQuery(query);
  };

  // Load recommendations when component mounts
  const loadRecommendations = async () => {
    await fetchRecommendations();
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
        {searchError && (
          <View style={styles.errorCard}>
            <MaterialIcons name="error-outline" size={24} color={Colors.danger} />
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        )}

        {isSearching ? (
          <TrackListSkeleton count={6} />
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
        ) : searchQuery.trim() && !isSearching ? (
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
            {isLoadingRecommendations ? (
              <RecommendationsSkeleton />
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

      {/* Playlist Preview Modal */}
      {playlistPreviewModal.data && (
        <PlaylistPreviewModal
          visible={playlistPreviewModal.visible}
          onClose={hidePlaylistPreview}
          playlistId={playlistPreviewModal.data.id}
          playlistBasicInfo={playlistPreviewModal.data}
        />
      )}

      {/* Track Preview Modal */}
      {trackPreviewModal.data && (
        <TrackPreviewModal
          visible={trackPreviewModal.visible}
          onClose={hideTrackPreview}
          track={trackPreviewModal.data}
        />
      )}
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