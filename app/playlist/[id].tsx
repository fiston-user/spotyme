import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { mockPlaylists } from '../../constants/MockData';
import { SongCard } from '../../components/SongCard';
import { Button } from '../../components/ui/Button';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const playlist = mockPlaylists.find(p => p.id === id);

  if (!playlist) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Playlist not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="secondary"
        />
      </View>
    );
  }

  const handleSongPress = () => {
    Alert.alert('Playing', 'This would play the song in a real app!');
  };

  const handlePlayAll = () => {
    Alert.alert('Playing All', `Playing ${playlist.songs.length} songs from ${playlist.name}`);
  };

  const handleShuffle = () => {
    Alert.alert('Shuffle Play', `Shuffling ${playlist.songs.length} songs from ${playlist.name}`);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={playlist.songs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <LinearGradient
              colors={Colors.gradients.blue as any}
              style={styles.header}
            >
              <Image 
                source={{ uri: playlist.coverArt }} 
                style={styles.coverArt}
              />
              <Text style={styles.playlistName}>{playlist.name}</Text>
              <Text style={styles.playlistDescription}>{playlist.description}</Text>
              <Text style={styles.playlistStats}>
                {playlist.songs.length} songs • {formatDuration(playlist.totalDuration)}
              </Text>
            </LinearGradient>

            <View style={styles.controls}>
              <Button
                title="Play All"
                onPress={handlePlayAll}
                variant="primary"
                size="large"
                style={styles.playButton}
              />
              <Button
                title="Shuffle"
                onPress={handleShuffle}
                variant="outline"
                size="large"
                style={styles.shuffleButton}
              />
            </View>

            <Text style={styles.songsTitle}>Songs</Text>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.songRow}>
            <Text style={styles.songIndex}>{index + 1}</Text>
            <SongCard
              song={item}
              onPress={handleSongPress}
              showAddButton={false}
            />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
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
  },
  songIndex: {
    width: 30,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    marginLeft: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
});