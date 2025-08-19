import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from '../ui/Skeleton';
import { Colors } from '../../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

export const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <View style={styles.profileSection}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <View style={styles.profileInfo}>
        <Skeleton width="60%" height={20} borderRadius={4} />
        <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <View style={styles.statsSection}>
      <Skeleton width={120} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Skeleton width={28} height={28} borderRadius={4} />
          <Skeleton width={40} height={24} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width={60} height={11} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.statCard}>
          <Skeleton width={28} height={28} borderRadius={4} />
          <Skeleton width={40} height={24} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width={60} height={11} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.statCard}>
          <Skeleton width={28} height={28} borderRadius={4} />
          <Skeleton width={40} height={24} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width={60} height={11} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
};

export const ActionCardSkeleton: React.FC = () => {
  return (
    <View style={styles.actionCard}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={styles.actionContent}>
        <Skeleton width="60%" height={16} borderRadius={4} />
        <Skeleton width="90%" height={13} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
      <Skeleton width={20} height={20} borderRadius={4} />
    </View>
  );
};

export const QuickActionsSkeleton: React.FC = () => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Skeleton width={20} height={20} borderRadius={4} />
        <Skeleton width={120} height={18} borderRadius={4} />
      </View>
      <ActionCardSkeleton />
      <ActionCardSkeleton />
    </View>
  );
};

export const SettingItemSkeleton: React.FC = () => {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Skeleton width={22} height={22} borderRadius={4} />
      </View>
      <Skeleton width="60%" height={15} borderRadius={4} />
      <Skeleton width={20} height={20} borderRadius={4} />
    </View>
  );
};

export const SettingsSectionSkeleton: React.FC = () => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Skeleton width={20} height={20} borderRadius={4} />
        <Skeleton width={80} height={18} borderRadius={4} />
      </View>
      <View style={styles.settingsGroup}>
        <SettingItemSkeleton />
        <SettingItemSkeleton />
        <SettingItemSkeleton />
        <SettingItemSkeleton />
      </View>
    </View>
  );
};

export const ProfileLoadingSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Skeleton width={80} height={12} borderRadius={4} />
            <Skeleton width={30} height={30} borderRadius={15} />
          </View>
          <Skeleton width={120} height={36} borderRadius={4} style={{ marginBottom: 20 }} />
          <ProfileHeaderSkeleton />
        </View>
      </View>

      {/* Content */}
      <View style={styles.scrollContent}>
        <StatsSkeleton />
        <QuickActionsSkeleton />
        <SettingsSectionSkeleton />
        
        {/* Logout button skeleton */}
        <View style={styles.logoutButtonContainer}>
          <Skeleton width="100%" height={56} borderRadius={12} />
        </View>

        {/* Footer skeleton */}
        <View style={styles.footer}>
          <Skeleton width={100} height={16} borderRadius={4} />
          <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width={140} height={32} borderRadius={16} style={{ marginTop: 12 }} />
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
  header: {
    backgroundColor: `${Colors.primary}15`,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingsGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingIconContainer: {
    width: 32,
    marginRight: 12,
  },
  logoutButtonContainer: {
    marginHorizontal: 20,
    marginVertical: 12,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },
});