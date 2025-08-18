import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Playlist } from '../../constants/MockData';
import { PlaylistCard } from '../../components/PlaylistCard';
import { Button } from '../../components/ui/Button';
import { apiService } from '../../services/api';

export default function PlaylistsScreen() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform backend playlist data to match our Playlist interface
  const transformPlaylist = (backendPlaylist: any): Playlist => {
    return {
      id: backendPlaylist._id || backendPlaylist.id,
      name: backendPlaylist.name,
      description: backendPlaylist.description || '',
      songs: backendPlaylist.tracks || [],
      coverArt: backendPlaylist.tracks?.[0]?.albumArt || 'https://picsum.photos/seed/playlist/300/300',
      createdAt: new Date(backendPlaylist.createdAt),
      totalDuration: backendPlaylist.totalDuration || 0,
    };
  };

  // Fetch playlists from backend
  const fetchPlaylists = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await apiService.getUserPlaylists();
      
      if (response.success && response.data) {
        const transformedPlaylists = response.data.map(transformPlaylist);
        setPlaylists(transformedPlaylists);
      } else {
        setError(response.error || 'Failed to load playlists');
      }
    } catch (err) {
      console.error('Fetch playlists error:', err);
      setError('Failed to load playlists');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load playlists on mount
  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handlePlaylistPress = (playlist: Playlist) => {
    router.push(`/playlist/${playlist.id}`);
  };

  const handleCreatePlaylist = () => {
    router.push('/(tabs)/');
  };

  const handleRefresh = () => {
    fetchPlaylists(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.green as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Your Playlists</Text>
        <Text style={styles.headerSubtitle}>
          {playlists.length} playlists • Curated just for you
        </Text>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your playlists...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={() => fetchPlaylists()}
            variant="primary"
            size="medium"
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={playlists.length > 1 ? styles.row : null}
          renderItem={({ item }) => (
            <PlaylistCard
              playlist={item}
              onPress={() => handlePlaylistPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            playlists.length > 0 ? (
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {playlists.reduce((acc, p) => acc + (p.songs?.length || 0), 0)}
                  </Text>
                  <Text style={styles.statLabel}>Total Songs</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {Math.floor(playlists.reduce((acc, p) => acc + (p.totalDuration || 0), 0) / 60)}
                  </Text>
                  <Text style={styles.statLabel}>Minutes</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Playlists Yet</Text>
              <Text style={styles.emptyText}>Create your first playlist from the Discover tab!</Text>
              <Button
                title="Create Playlist"
                onPress={handleCreatePlaylist}
                variant="primary"
                size="large"
                style={styles.emptyButton}
              />
            </View>
          }
          ListFooterComponent={
            playlists.length > 0 ? (
              <View style={styles.footer}>
                <Button
                  title="Create New Playlist"
                  onPress={handleCreatePlaylist}
                  variant="primary"
                  size="large"
                  style={styles.createButton}
                />
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreatePlaylist}>
        <Ionicons name="add" size={28} color={Colors.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 20,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginVertical: 20,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 0.45,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  footer: {
    padding: 16,
    marginTop: 20,
  },
  createButton: {
    width: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
  },
});