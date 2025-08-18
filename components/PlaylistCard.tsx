import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Playlist } from '../constants/MockData';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ 
  playlist, 
  onPress 
}) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: playlist.coverArt }} style={styles.coverArt} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />
        <View style={styles.playButton}>
          <Ionicons name="play" size={18} color={Colors.background} />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{playlist.name}</Text>
        <Text style={styles.details}>
          {playlist.songs.length} songs • {formatDuration(playlist.totalDuration)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: 20,
  },
  imageContainer: {
    width: cardWidth,
    height: cardWidth,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  coverArt: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  playButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
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
  info: {
    marginTop: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});