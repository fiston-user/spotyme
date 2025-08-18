import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Song } from '../../constants/MockData';
import { SearchBar } from '../../components/ui/SearchBar';
import { SongCard } from '../../components/SongCard';
import { Card } from '../../components/ui/Card';
import { apiService } from '../../services/api';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

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
        setError(response.error || 'Failed to search tracks');
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
    Alert.alert(
      song.title,
      `By ${song.artist}\nAlbum: ${song.album}\nDuration: ${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}\nPopularity: ${song.popularity}/100`
    );
  };

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search songs, artists, albums on Spotify..."
        onClear={() => setSearchQuery('')}
      />

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching Spotify...</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SongCard
              song={item}
              onPress={() => handleSongPress(item)}
              showAddButton={false}
            />
          )}
          ListHeaderComponent={
            searchResults.length > 0 ? (
              <Text style={styles.resultsCount}>
                {searchResults.length} {searchResults.length === 1 ? 'song' : 'songs'} found
              </Text>
            ) : null
          }
          ListEmptyComponent={
            searchQuery.trim() && !isLoading ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="search" size={48} color={Colors.textSecondary} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No songs found</Text>
                <Text style={styles.emptyText}>
                  Try different search terms or check your connection
                </Text>
              </Card>
            ) : !searchQuery.trim() ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="musical-notes" size={48} color={Colors.primary} style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>Search Spotify</Text>
                <Text style={styles.emptyText}>
                  Search for your favorite songs, artists, or albums
                </Text>
              </Card>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorCard: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    backgroundColor: '#FF6B6B20',
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 40,
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});