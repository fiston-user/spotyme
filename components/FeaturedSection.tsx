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
const CARD_WIDTH = screenWidth * 0.42;

interface Playlist {
  id: string;
  name: string;
  description?: string;
  images: Array<{ url: string }>;
  owner?: {
    display_name: string;
  };
  tracks?: {
    total: number;
  };
}

interface Album {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  images: Array<{ url: string }>;
  release_date?: string;
  total_tracks?: number;
}

interface FeaturedSectionProps {
  title: string;
  items: Playlist[] | Album[];
  type: 'playlist' | 'album';
  onItemPress: (item: any) => void;
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
  isLoading?: boolean;
  gradientColors?: string[];
}

export const FeaturedSection: React.FC<FeaturedSectionProps> = ({
  title,
  items,
  type,
  onItemPress,
  showSeeAll = false,
  onSeeAllPress,
  isLoading = false,
  gradientColors = Colors.gradients.purple as string[],
}) => {
  const isAlbum = (item: any): item is Album => {
    return 'artists' in item;
  };

  const getSubtitle = (item: Playlist | Album) => {
    if (isAlbum(item)) {
      return item.artists?.map(a => a.name).join(', ');
    }
    return item.owner?.display_name || 'Spotify';
  };

  const getMetaInfo = (item: Playlist | Album) => {
    if (isAlbum(item)) {
      const year = item.release_date ? new Date(item.release_date).getFullYear() : '';
      return `${year} • ${item.total_tracks || 0} tracks`;
    }
    return `${item.tracks?.total || 0} tracks`;
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

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <LinearGradient
            colors={gradientColors as any}
            style={styles.titleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.title}>{title}</Text>
        </View>
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
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              index === 0 && styles.firstCard,
              index === items.length - 1 && styles.lastCard,
            ]}
            onPress={() => onItemPress(item)}
            activeOpacity={0.8}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.images?.[0]?.url || 'https://picsum.photos/seed/featured/300/300' }}
                style={styles.image}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.imageOverlay}
              />
              <View style={styles.playButton}>
                <LinearGradient
                  colors={Colors.gradients.purple as any}
                  style={styles.playButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="library-add" size={22} color={Colors.text} />
                </LinearGradient>
              </View>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {getSubtitle(item)}
              </Text>
              <View style={styles.metaContainer}>
                <MaterialIcons 
                  name={type === 'album' ? 'album' : 'queue-music'} 
                  size={12} 
                  color={Colors.textTertiary} 
                />
                <Text style={styles.metaText}>
                  {getMetaInfo(item)}
                </Text>
              </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleGradient: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
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
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
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
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  playButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  playButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoContainer: {
    paddingHorizontal: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
});