import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.4;

interface Track {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms?: number;
}

interface TrackCarouselProps {
  title: string;
  tracks: Track[];
  onTrackPress: (track: Track) => void;
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
  isLoading?: boolean;
}

export const TrackCarousel: React.FC<TrackCarouselProps> = ({
  title,
  tracks,
  onTrackPress,
  showSeeAll = false,
  onSeeAllPress,
  isLoading = false,
}) => {
  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!tracks || tracks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showSeeAll && (
          <TouchableOpacity
            onPress={onSeeAllPress}
            style={styles.seeAllButton}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tracks.map((track, index) => (
          <TouchableOpacity
            key={track.id}
            style={[
              styles.trackCard,
              index === 0 && styles.firstCard,
              index === tracks.length - 1 && styles.lastCard,
            ]}
            onPress={() => onTrackPress(track)}
            activeOpacity={0.8}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: track.album?.images?.[0]?.url || 'https://picsum.photos/seed/track/300/300' }}
                style={styles.albumArt}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.imageGradient}
              />
              <View style={styles.playButton}>
                <LinearGradient
                  colors={Colors.gradients.green as any}
                  style={styles.playButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="playlist-add" size={20} color={Colors.background} />
                </LinearGradient>
              </View>
            </View>
            
            <View style={styles.trackInfo}>
              <Text style={styles.trackName} numberOfLines={1}>
                {track.name}
              </Text>
              <Text style={styles.artistName} numberOfLines={1}>
                {track.artists?.map(a => a.name).join(', ')}
              </Text>
              {track.duration_ms && (
                <View style={styles.durationContainer}>
                  <MaterialIcons name="schedule" size={12} color={Colors.textTertiary} />
                  <Text style={styles.duration}>{formatDuration(track.duration_ms)}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  trackCard: {
    width: CARD_WIDTH,
    marginRight: 12,
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: 20,
  },
  imageContainer: {
    position: 'relative',
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  playButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  playButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    paddingHorizontal: 4,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  artistName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  duration: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
});