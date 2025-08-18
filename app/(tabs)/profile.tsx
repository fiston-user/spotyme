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
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { authService } from "../../services/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
  product: string;
  followers: { total: number };
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // For now, using mock data since we need to implement the profile endpoint
      // In production, this would call the backend API
      setProfile({
        id: "user123",
        display_name: "John Doe",
        email: "john.doe@example.com",
        images: [{ url: "https://picsum.photos/200" }],
        product: "premium",
        followers: { total: 42 },
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
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
            await authService.logout();
            await AsyncStorage.clear();
            router.replace("/login");
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={Colors.gradients.blue as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileInfo}>
          {profile?.images?.[0]?.url ? (
            <Image
              source={{ uri: profile.images[0].url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color={Colors.textSecondary} />
            </View>
          )}
          <Text style={styles.name}>{profile?.display_name || "User"}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {profile?.product === "premium" ? "Premium" : "Free"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {profile?.followers?.total || 0}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>256</Text>
            <Text style={styles.statLabel}>Songs</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="heart-outline" size={24} color={Colors.text} />
            <Text style={styles.menuText}>Liked Songs</Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="history" size={24} color={Colors.text} />
            <Text style={styles.menuText}>Recently Played</Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={Colors.text}
            />
            <Text style={styles.menuText}>About SpotYme</Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={Colors.text}
            />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF4444" />
          <Text style={styles.logoutText}>Disconnect Spotify</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileInfo: {
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.text,
    opacity: 0.8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4444",
    marginLeft: 8,
  },
});
