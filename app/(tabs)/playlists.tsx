import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Playlist } from '../../constants/MockData';
import { PlaylistCard } from '../../components/PlaylistCard';
import { Button } from '../../components/ui/Button';
import { apiService } from '../../services/api';
import { BlurView } from 'expo-blur';

const { width: screenWidth } = Dimensions.get('window');

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

  // Load playlists on mount and when tab is focused
  useEffect(() => {
    fetchPlaylists();
  }, []);

  // Refresh playlists when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchPlaylists();
    }, [])
  );

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
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[Colors.primary, Colors.background]}
        style={styles.header}
        locations={[0, 0.8]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerLabel}>YOUR LIBRARY</Text>
            <TouchableOpacity 
              style={styles.headerAction}
              onPress={() => fetchPlaylists()}
              activeOpacity={0.7}
            >
              <MaterialIcons name="sync" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Playlists</Text>
          <View style={styles.headerStats}>
            <View style={styles.headerStatItem}>
              <MaterialIcons name="library-music" size={16} color={Colors.textSecondary} />
              <Text style={styles.headerStatText}>
                {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
              </Text>
            </View>
            {playlists.length > 0 && (
              <>
                <View style={styles.headerStatDivider} />
                <View style={styles.headerStatItem}>
                  <MaterialIcons name="music-note" size={16} color={Colors.textSecondary} />
                  <Text style={styles.headerStatText}>
                    {playlists.reduce((acc, p) => acc + (p.songs?.length || 0), 0)} tracks
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your playlists...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={Colors.danger} />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchPlaylists()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.gradients.red as any}
              style={styles.retryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="refresh" size={20} color={Colors.text} />
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {playlists.length > 0 ? (
            <>
              {/* Quick Stats Section */}
              <View style={styles.quickStats}>
                <LinearGradient
                  colors={['rgba(29, 185, 84, 0.1)', 'rgba(30, 215, 96, 0.05)']}
                  style={styles.statCardGradient}
                >
                  <View style={styles.statCardContent}>
                    <MaterialIcons name="queue-music" size={24} color={Colors.primary} />
                    <View style={styles.statInfo}>
                      <Text style={styles.statNumber}>
                        {playlists.reduce((acc, p) => acc + (p.songs?.length || 0), 0)}
                      </Text>
                      <Text style={styles.statLabel}>Total tracks</Text>
                    </View>
                  </View>
                </LinearGradient>
                
                <LinearGradient
                  colors={['rgba(69, 10, 245, 0.1)', 'rgba(192, 116, 178, 0.05)']}
                  style={styles.statCardGradient}
                >
                  <View style={styles.statCardContent}>
                    <MaterialIcons name="schedule" size={24} color="#8B5CF6" />
                    <View style={styles.statInfo}>
                      <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>
                        {(() => {
                          const totalMs = playlists.reduce((acc, p) => acc + (p.totalDuration || 0), 0);
                          const totalMinutes = Math.floor(totalMs / 60000);
                          const hours = Math.floor(totalMinutes / 60);
                          const minutes = totalMinutes % 60;
                          if (hours > 0) {
                            return `${hours}h ${minutes}m`;
                          }
                          return `${minutes}`;
                        })()}
                      </Text>
                      <Text style={styles.statLabel}>{(() => {
                        const totalMs = playlists.reduce((acc, p) => acc + (p.totalDuration || 0), 0);
                        const totalMinutes = Math.floor(totalMs / 60000);
                        const hours = Math.floor(totalMinutes / 60);
                        return hours > 0 ? 'Duration' : 'Minutes';
                      })()}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Playlists Grid */}
              <View style={styles.playlistsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Your Collection</Text>
                  <TouchableOpacity 
                    style={styles.sortButton}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="sort" size={18} color={Colors.textSecondary} />
                    <Text style={styles.sortButtonText}>Recent</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.playlistGrid}>
                  {playlists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      onPress={() => handlePlaylistPress(playlist)}
                    />
                  ))}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={Colors.gradients.purple as any}
                  style={styles.emptyIconGradient}
                >
                  <MaterialIcons name="library-music" size={48} color={Colors.text} />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>Start Your Collection</Text>
              <Text style={styles.emptyText}>
                Create playlists from your favorite tracks
                and discover new music
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleCreatePlaylist}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradients.green as any}
                  style={styles.emptyButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialIcons name="add" size={20} color={Colors.background} />
                  <Text style={styles.emptyButtonText}>Create First Playlist</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Spacer for FAB */}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Enhanced FAB */}
      {playlists.length > 0 && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={handleCreatePlaylist}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={Colors.gradients.green as any}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="add" size={28} color={Colors.background} />
          </LinearGradient>
        </TouchableOpacity>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  headerAction: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerStatText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  headerStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  statCardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playlistsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  sortButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.background,
  },
});