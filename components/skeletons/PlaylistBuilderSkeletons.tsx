import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../ui/Skeleton';
import { Colors } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

export const PlaylistBuilderLoadingSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginBottom: 16 }} />
            <Skeleton width={120} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
            <Skeleton width="80%" height={32} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Seed track section */}
      <View style={styles.seedSection}>
        <View style={styles.sectionHeader}>
          <Skeleton width={20} height={20} borderRadius={4} />
          <Skeleton width={180} height={16} borderRadius={4} />
        </View>
        
        <View style={styles.seedTrackCard}>
          <Skeleton width={80} height={80} borderRadius={12} />
          <View style={styles.seedTrackInfo}>
            <Skeleton width="70%" height={18} borderRadius={4} />
            <Skeleton width="90%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
            <View style={styles.miniFeatures}>
              <View style={styles.miniFeature}>
                <Skeleton width="100%" height={3} borderRadius={2} />
                <Skeleton width={40} height={10} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
              <View style={styles.miniFeature}>
                <Skeleton width="100%" height={3} borderRadius={2} />
                <Skeleton width={40} height={10} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Customization section */}
      <View style={styles.customizationSection}>
        <View style={styles.sectionHeader}>
          <Skeleton width={20} height={20} borderRadius={4} />
          <Skeleton width={150} height={16} borderRadius={4} />
        </View>

        <View style={styles.customizationCards}>
          {/* Energy card skeleton */}
          <View style={styles.parameterCard}>
            <View style={styles.parameterHeader}>
              <Skeleton width={18} height={18} borderRadius={4} />
              <Skeleton width={60} height={14} borderRadius={4} style={{ marginLeft: 6 }} />
              <Skeleton width={35} height={14} borderRadius={4} />
            </View>
            <Skeleton width="100%" height={30} borderRadius={4} style={{ marginVertical: 8 }} />
            <View style={styles.sliderLabels}>
              <Skeleton width={50} height={11} borderRadius={4} />
              <Skeleton width={60} height={11} borderRadius={4} />
            </View>
          </View>

          {/* Mood card skeleton */}
          <View style={styles.parameterCard}>
            <View style={styles.parameterHeader}>
              <Skeleton width={18} height={18} borderRadius={4} />
              <Skeleton width={50} height={14} borderRadius={4} style={{ marginLeft: 6 }} />
              <Skeleton width={35} height={14} borderRadius={4} />
            </View>
            <Skeleton width="100%" height={30} borderRadius={4} style={{ marginVertical: 8 }} />
            <View style={styles.sliderLabels}>
              <Skeleton width={70} height={11} borderRadius={4} />
              <Skeleton width={40} height={11} borderRadius={4} />
            </View>
          </View>

          {/* Track count card skeleton */}
          <View style={styles.trackCountCard}>
            <View style={styles.trackCountHeader}>
              <Skeleton width={18} height={18} borderRadius={4} />
              <Skeleton width={80} height={14} borderRadius={4} style={{ marginLeft: 6 }} />
            </View>
            <View style={styles.trackCountOptions}>
              {[1, 2, 3, 4].map((_, index) => (
                <Skeleton 
                  key={index} 
                  width={(screenWidth - 80) / 4} 
                  height={40} 
                  borderRadius={10} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Generate button skeleton */}
        <Skeleton width="100%" height={48} borderRadius={12} style={{ marginTop: 16 }} />
      </View>

      {/* Recommendations section */}
      <View style={styles.recommendationsSection}>
        <View style={styles.recommendationsHeader}>
          <View style={styles.sectionHeader}>
            <Skeleton width={20} height={20} borderRadius={4} />
            <Skeleton width={80} height={16} borderRadius={4} />
          </View>
          <View style={styles.selectionInfo}>
            <Skeleton width={100} height={14} borderRadius={4} />
            <Skeleton width={70} height={28} borderRadius={16} />
          </View>
        </View>

        {/* Track list skeleton */}
        <View style={styles.trackList}>
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={styles.trackItem}>
              <View style={styles.trackItemContent}>
                <Skeleton width={24} height={14} borderRadius={4} />
                <Skeleton width={48} height={48} borderRadius={8} style={{ marginHorizontal: 12 }} />
                <View style={styles.trackInfo}>
                  <Skeleton width="70%" height={15} borderRadius={4} />
                  <Skeleton width="50%" height={13} borderRadius={4} style={{ marginTop: 3 }} />
                </View>
                <Skeleton width={28} height={28} borderRadius={14} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    height: 280,
    backgroundColor: `${Colors.primary}15`,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 60,
  },
  seedSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  seedTrackCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  seedTrackInfo: {
    flex: 1,
    marginLeft: 16,
  },
  miniFeatures: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  miniFeature: {
    flex: 1,
  },
  customizationSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  customizationCards: {
    marginTop: 16,
    gap: 12,
  },
  parameterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  parameterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackCountCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  trackCountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackCountOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  recommendationsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  recommendationsHeader: {
    marginBottom: 16,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  trackList: {
    gap: 8,
  },
  trackItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trackItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  trackInfo: {
    flex: 1,
  },
});