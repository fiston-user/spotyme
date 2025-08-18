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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Playlist } from '../constants/MockData';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const cardWidth = (width - 52) / 2;

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

  // Generate gradient colors based on playlist index or name
  const getGradientColors = () => {
    const gradients = [
      Colors.gradients.purple,
      Colors.gradients.blue,
      Colors.gradients.green,
      Colors.gradients.orange,
    ];
    const index = playlist.name.charCodeAt(0) % gradients.length;
    return gradients[index] as any;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: playlist.coverArt }} style={styles.coverArt} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />
          
          {/* Overlay Info */}
          <View style={styles.overlayInfo}>
            <BlurView intensity={80} style={styles.blurContainer}>
              <View style={styles.playButton}>
                <MaterialIcons name="play-arrow" size={20} color={Colors.background} />
              </View>
            </BlurView>
            
            <View style={styles.trackCount}>
              <Text style={styles.trackCountText}>{playlist.songs.length}</Text>
              <MaterialIcons name="queue-music" size={14} color={Colors.text} />
            </View>
          </View>
        </View>
        
        <LinearGradient
          colors={getGradientColors()}
          style={styles.infoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={2}>{playlist.name}</Text>
            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <MaterialIcons name="schedule" size={12} color={Colors.text} />
                <Text style={styles.details}>{formatDuration(playlist.totalDuration)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: cardWidth,
    height: cardWidth * 0.85,
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
    height: '60%',
  },
  overlayInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trackCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  infoGradient: {
    opacity: 0.9,
  },
  info: {
    padding: 12,
    minHeight: 70,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    lineHeight: 18,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  details: {
    fontSize: 11,
    color: Colors.text,
    opacity: 0.9,
  },
});