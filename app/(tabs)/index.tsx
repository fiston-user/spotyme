import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { 
  mockSongs, 
  getRecommendedSongs, 
  Song 
} from '../../constants/MockData';
import { SearchBar } from '../../components/ui/SearchBar';
import { SongCard } from '../../components/SongCard';
import { RecommendationList } from '../../components/RecommendationList';
import { Button } from '../../components/ui/Button';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
    const recommended = getRecommendedSongs(song, 8);
    setRecommendations(recommended);
    setSearchQuery('');
  };

  const handleAddToPlaylist = (song: Song) => {
    if (!playlistSongs.find(s => s.id === song.id)) {
      setPlaylistSongs([...playlistSongs, song]);
      Alert.alert('Added!', `${song.title} added to your new playlist`);
    } else {
      Alert.alert('Already Added', `${song.title} is already in your playlist`);
    }
  };

  const handleCreatePlaylist = () => {
    if (playlistSongs.length === 0) {
      Alert.alert('No Songs', 'Add some songs to create a playlist');
      return;
    }
    Alert.alert(
      'Playlist Created!', 
      `Your playlist with ${playlistSongs.length} songs has been created`
    );
    setPlaylistSongs([]);
  };

  const filteredSongs = mockSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {filteredSongs.slice(0, 5).map(song => (
              <SongCard
                key={song.id}
                song={song}
                onPress={() => handleSongSelect(song)}
              />
            ))}
          </View>
        )}

        {selectedSong && !searchQuery && (
          <>
            <View style={styles.selectedSection}>
              <Text style={styles.sectionTitle}>Based on</Text>
              <SongCard
                song={selectedSong}
                onPress={() => {}}
              />
            </View>

            {recommendations.length > 0 && (
              <RecommendationList
                title="Recommended for You"
                songs={recommendations}
                onSongPress={(song) => handleSongSelect(song)}
                onAddToPlaylist={handleAddToPlaylist}
                showAddButton={true}
              />
            )}

            {playlistSongs.length > 0 && (
              <View style={styles.playlistPreview}>
                <Text style={styles.sectionTitle}>
                  New Playlist ({playlistSongs.length} songs)
                </Text>
                <Button
                  title="Create Playlist"
                  onPress={handleCreatePlaylist}
                  variant="primary"
                  size="large"
                  style={styles.createButton}
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