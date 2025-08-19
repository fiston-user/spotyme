import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Skeleton, SkeletonGroup } from '../ui/Skeleton';
import { Colors } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

export const TrackSkeleton: React.FC = () => {
  return (
    <View style={styles.trackContainer}>
      <Skeleton width={56} height={56} borderRadius={8} />
      <View style={styles.trackInfo}>
        <Skeleton width="70%" height={16} borderRadius={4} />
        <Skeleton width="50%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        <View style={styles.trackMeta}>
          <Skeleton width={80} height={12} borderRadius={4} />
          <Skeleton width={40} height={12} borderRadius={4} />
        </View>
      </View>
      <Skeleton width={40} height={40} borderRadius={20} />
    </View>
  );
};

export const TrackListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.trackList}>
      <View style={styles.sectionHeader}>
        <Skeleton width={120} height={20} borderRadius={4} />
        <Skeleton width={60} height={16} borderRadius={4} />
      </View>
      <View style={styles.listContainer}>
        {Array.from({ length: count }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.trackSkeletonWrapper,
              index === 0 && styles.firstItem,
              index === count - 1 && styles.lastItem,
            ]}
          >
            <TrackSkeleton />
          </View>
        ))}
      </View>
    </View>
  );
};

export const CarouselSkeleton: React.FC<{ title?: boolean }> = ({ title = true }) => {
  return (
    <View style={styles.carouselContainer}>
      {title && (
        <View style={styles.carouselHeader}>
          <Skeleton width={150} height={20} borderRadius={4} />
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.carouselContent}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.carouselItem}>
            <Skeleton width={140} height={140} borderRadius={12} />
            <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <Skeleton width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export const ArtistCarouselSkeleton: React.FC = () => {
  return (
    <View style={styles.carouselContainer}>
      <View style={styles.carouselHeader}>
        <Skeleton width={180} height={20} borderRadius={4} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.carouselContent}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.artistItem}>
            <Skeleton width={100} height={100} borderRadius={50} />
            <Skeleton width="70%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export const FeaturedSectionSkeleton: React.FC = () => {
  return (
    <View style={styles.carouselContainer}>
      <View style={styles.carouselHeader}>
        <Skeleton width={160} height={20} borderRadius={4} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.carouselContent}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.featuredItem}>
            <Skeleton width={screenWidth * 0.4} height={screenWidth * 0.4} borderRadius={16} />
            <Skeleton width="75%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
            <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export const RecommendationsSkeleton: React.FC = () => {
  return (
    <View style={styles.recommendationsContainer}>
      <CarouselSkeleton title={true} />
      <ArtistCarouselSkeleton />
      <FeaturedSectionSkeleton />
      <FeaturedSectionSkeleton />
    </View>
  );
};

const styles = StyleSheet.create({
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  trackList: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  listContainer: {
    gap: 1,
  },
  trackSkeletonWrapper: {
    backgroundColor: Colors.surface,
  },
  firstItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  carouselContainer: {
    marginBottom: 24,
  },
  carouselHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  carouselItem: {
    width: 140,
    alignItems: 'center',
  },
  artistItem: {
    width: 100,
    alignItems: 'center',
  },
  featuredItem: {
    width: screenWidth * 0.4,
  },
  recommendationsContainer: {
    paddingTop: 20,
  },
});