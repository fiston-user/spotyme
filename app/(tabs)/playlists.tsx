import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { mockPlaylists, Playlist } from '../../constants/MockData';
import { PlaylistCard } from '../../components/PlaylistCard';
import { Button } from '../../components/ui/Button';

export default function PlaylistsScreen() {
  const router = useRouter();
  const [playlists] = useState<Playlist[]>(mockPlaylists);

  const handlePlaylistPress = (playlist: Playlist) => {
    router.push(`/playlist/${playlist.id}`);
  };

  const handleCreatePlaylist = () => {
    Alert.alert(
      'Create Playlist',
      'Go to the Discover tab to create a new playlist based on songs you love!'
    );
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

      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <PlaylistCard
            playlist={item}
            onPress={() => handlePlaylistPress(item)}
          />
        )}
        ListHeaderComponent={
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {playlists.reduce((acc, p) => acc + p.songs.length, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Songs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {Math.floor(playlists.reduce((acc, p) => acc + p.totalDuration, 0) / 60)}
              </Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              title="Create New Playlist"
              onPress={handleCreatePlaylist}
              variant="primary"
              size="large"
              style={styles.createButton}
            />
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

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
});