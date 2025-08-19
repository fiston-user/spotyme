import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../ui/Skeleton';
import { Colors } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 52) / 2; // 20px padding on each side + 12px gap

export const PlaylistStatsSkeleton: React.FC = () => {
  return (
    <View style={styles.quickStats}>
      <View style={styles.statCard}>
        <Skeleton width={24} height={24} borderRadius={4} />
        <View style={styles.statInfo}>
          <Skeleton width={60} height={24} borderRadius={4} />
          <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.statCard}>
        <Skeleton width={24} height={24} borderRadius={4} />
        <View style={styles.statInfo}>
          <Skeleton width={60} height={24} borderRadius={4} />
          <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
};

export const PlaylistCardSkeleton: React.FC = () => {
  return (
    <View style={styles.playlistCard}>
      <Skeleton width="100%" height={CARD_WIDTH} borderRadius={16} />
      <View style={styles.cardInfo}>
        <Skeleton width="80%" height={16} borderRadius={4} />
        <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        <View style={styles.cardMeta}>
          <Skeleton width={50} height={12} borderRadius={4} />
          <Skeleton width={50} height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

export const PlaylistGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <View style={styles.playlistsSection}>
      <View style={styles.sectionHeader}>
        <Skeleton width={140} height={20} borderRadius={4} />
        <Skeleton width={80} height={28} borderRadius={16} />
      </View>
      
      <View style={styles.playlistGrid}>
        {Array.from({ length: count }).map((_, index) => (
          <PlaylistCardSkeleton key={index} />
        ))}
      </View>
    </View>
  );
};

export const PlaylistsLoadingSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <PlaylistStatsSkeleton />
      <PlaylistGridSkeleton count={6} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  statInfo: {
    flex: 1,
  },
  playlistsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  playlistCard: {
    width: CARD_WIDTH,
    marginBottom: 20,
  },
  cardInfo: {
    marginTop: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});