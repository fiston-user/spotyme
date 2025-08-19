import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";

const { width: screenWidth } = Dimensions.get("window");

interface UserProfile {
  id: string;
  spotifyId: string;
  displayName: string;
  email: string;
  imageUrl?: string;
  createdAt: string;
}

interface PlaylistStats {
  totalPlaylists: number;
  totalTracks: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlaylistStats>({
    totalPlaylists: 0,
    totalTracks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      setError(null);
      const response = await apiService.getUserProfile();

      if (response.success && response.data) {
        setProfile(response.data as UserProfile);
      } else {
        // Check if session expired
        if (
          response.error?.includes("Session expired") ||
          response.error?.includes("Unauthorized")
        ) {
          // Clear tokens and redirect to login
          await AsyncStorage.clear();
          router.replace("/login");
          return;
        }
        throw new Error(response.error || "Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Check if it's a session error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (
        errorMessage.includes("Session expired") ||
        errorMessage.includes("Unauthorized")
      ) {
        await AsyncStorage.clear();
        router.replace("/login");
        return;
      }
      setError("Unable to load profile. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getUserPlaylists();

      if (response.success && response.data) {
        const playlists = response.data as any[];
        if (Array.isArray(playlists)) {
          const totalTracks = playlists.reduce(
            (sum: number, playlist: any) =>
              sum + (playlist.tracks?.length || 0),
            0
          );

          setStats({
            totalPlaylists: playlists.length || 0,
            totalTracks: totalTracks,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadProfile(), loadStats()]);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to disconnect your Spotify account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.logout();
              await AsyncStorage.clear();
              router.replace("/login");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={[`${Colors.primary}30`, Colors.background]}
        style={styles.header}
        locations={[0, 0.7]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerLabel}>ACCOUNT</Text>
            <TouchableOpacity
              style={styles.headerAction}
              onPress={loadProfile}
              activeOpacity={0.7}
            >
              <MaterialIcons name="refresh" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Profile</Text>

          {/* Profile Info Section */}
          <View style={styles.profileSection}>
            {profile?.imageUrl ? (
              <Image source={{ uri: profile.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons
                  name="person"
                  size={40}
                  color={Colors.textSecondary}
                />
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={styles.name}>
                {profile?.displayName || "Spotify User"}
              </Text>
              <Text style={styles.email}>{profile?.email || ""}</Text>
              {profile?.createdAt && (
                <View style={styles.joinDateRow}>
                  <MaterialIcons
                    name="calendar-today"
                    size={12}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.joinDate}>
                    Member since {formatDate(profile.createdAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Enhanced Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Your Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={["rgba(29, 185, 84, 0.1)", "rgba(30, 215, 96, 0.05)"]}
                style={styles.statGradient}
              >
                <MaterialIcons
                  name="library-music"
                  size={28}
                  color={Colors.primary}
                />
                <Text style={styles.statNumber}>{stats.totalPlaylists}</Text>
                <Text style={styles.statLabel}>Playlists</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={["rgba(69, 10, 245, 0.1)", "rgba(192, 116, 178, 0.05)"]}
                style={styles.statGradient}
              >
                <MaterialIcons name="queue-music" size={28} color="#8B5CF6" />
                <Text style={styles.statNumber}>{stats.totalTracks}</Text>
                <Text style={styles.statLabel}>Tracks</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={["rgba(255, 107, 0, 0.1)", "rgba(255, 165, 0, 0.05)"]}
                style={styles.statGradient}
              >
                <MaterialIcons name="schedule" size={28} color="#FFA500" />
                <Text style={styles.statNumber}>
                  {Math.floor((stats.totalTracks * 3.5) / 60)}
                </Text>
                <Text style={styles.statLabel}>Hours</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Enhanced Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="flash-on" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/search")}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={Colors.gradients.green as any}
              style={styles.actionIcon}
            >
              <MaterialIcons name="add" size={24} color={Colors.background} />
            </LinearGradient>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create Playlist</Text>
              <Text style={styles.actionDescription}>
                Build AI-powered playlists from any song
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(tabs)/playlists")}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={Colors.gradients.purple as any}
              style={styles.actionIcon}
            >
              <MaterialIcons
                name="library-music"
                size={22}
                color={Colors.text}
              />
            </LinearGradient>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>My Playlists</Text>
              <Text style={styles.actionDescription}>
                View and manage your music collections
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Enhanced Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons
              name="settings"
              size={20}
              color={Colors.textSecondary}
            />
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>

          <View style={styles.settingsGroup}>
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingIconContainer}>
                <MaterialIcons
                  name="notifications"
                  size={22}
                  color={Colors.text}
                />
              </View>
              <Text style={styles.settingText}>Notifications</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingIconContainer}>
                <MaterialIcons name="lock" size={22} color={Colors.text} />
              </View>
              <Text style={styles.settingText}>Privacy & Security</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingIconContainer}>
                <MaterialIcons name="help" size={22} color={Colors.text} />
              </View>
              <Text style={styles.settingText}>Help & Support</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={styles.settingIconContainer}>
                <MaterialIcons name="info" size={22} color={Colors.text} />
              </View>
              <Text style={styles.settingText}>About</Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(226, 33, 52, 0.1)", "rgba(226, 33, 52, 0.05)"]}
            style={styles.logoutGradient}
          >
            <MaterialIcons name="logout" size={22} color={Colors.danger} />
            <Text style={styles.logoutText}>Disconnect Spotify</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerTitle}>SpotYme</Text>
            <Text style={styles.footerVersion}>Version 1.0.0</Text>
          </View>
          {profile?.spotifyId && (
            <View style={styles.footerConnection}>
              <MaterialIcons
                name="check-circle"
                size={14}
                color={Colors.primary}
              />
              <Text style={styles.footerConnectionText}>
                Connected • {profile.spotifyId.substring(0, 10)}...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  headerAction: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  joinDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  joinDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  statGradient: {
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  settingsGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingIconContainer: {
    width: 32,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.danger,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },
  footerInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footerConnection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  footerConnectionText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
