import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Song } from '../constants/MockData';

interface SongCardProps {
  song: Song;
  onPress: () => void;
  showAddButton?: boolean;
  onAddPress?: () => void;
}

export const SongCard: React.FC<SongCardProps> = ({ 
  song, 
  onPress, 
  showAddButton = false,
  onAddPress 
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: song.albumArt }} style={styles.albumArt} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist} • {song.album}
        </Text>
        <View style={styles.metadata}>
          <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
          <View style={styles.tags}>
            {song.mood.slice(0, 2).map((mood, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{mood}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      {showAddButton && (
        <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
          <Ionicons name="add" size={24} color={Colors.background} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    alignItems: 'center',
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginRight: 8,
  },
  tags: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  tagText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});