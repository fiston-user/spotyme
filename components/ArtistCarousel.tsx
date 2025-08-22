import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.35;

interface Artist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  genres?: string[];
  followers?: {
    total: number;
  };
}

interface ArtistCarouselProps {
  title: string;
  artists: Artist[];
  onArtistPress: (artist: Artist) => void;
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
  isLoading?: boolean;
}

export const ArtistCarousel: React.FC<ArtistCarouselProps> = ({
  title,
  artists,
  onArtistPress,
  showSeeAll = false,
  onSeeAllPress,
  isLoading = false,
}) => {
  const [pressedId, setPressedId] = React.useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const formatFollowers = (count?: number) => {
    if (!count) return '';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M followers`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K followers`;
    }
    return `${count} followers`;
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

  if (!artists || artists.length === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }]
    }]}>
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
        {artists.map((artist, index) => (
          <TouchableOpacity
            key={artist.id}
            style={[
              styles.artistCard,
              index === 0 && styles.firstCard,
              index === artists.length - 1 && styles.lastCard,
            ]}
            onPress={() => onArtistPress(artist)}
            onPressIn={() => setPressedId(artist.id)}
            onPressOut={() => setPressedId(null)}
            activeOpacity={0.9}
          >
            <View style={[
              styles.imageContainer,
              pressedId === artist.id && styles.imageContainerPressed
            ]}>
              <Image
                source={{ uri: artist.images?.[0]?.url || 'https://picsum.photos/seed/artist/300/300' }}
                style={styles.artistImage}
              />
              <View style={[
                styles.imageRing,
                pressedId === artist.id && styles.imageRingActive
              ]} />
            </View>
            
            <View style={styles.artistInfo}>
              <Text style={styles.artistName} numberOfLines={1}>
                {artist.name}
              </Text>
              {artist.genres && artist.genres.length > 0 && (
                <Text style={styles.genre} numberOfLines={1}>
                  {artist.genres[0]}
                </Text>
              )}
              {artist.followers && (
                <Text style={styles.followers}>
                  {formatFollowers(artist.followers.total)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
    fontWeight: '600',
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  artistCard: {
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
    borderRadius: CARD_WIDTH / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: Colors.surface,
  },
  artistImage: {
    width: '100%',
    height: '100%',
    borderRadius: CARD_WIDTH / 2,
  },
  imageRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: (CARD_WIDTH + 8) / 2,
    borderWidth: 3,
    borderColor: Colors.primary,
    opacity: 0,
  },
  imageContainerPressed: {
    transform: [{ scale: 0.93 }],
  },
  imageRingActive: {
    opacity: 1,
  },
  artistInfo: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  genre: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 3,
    textTransform: 'capitalize',
    opacity: 0.9,
  },
  followers: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
});