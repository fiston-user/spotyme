import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../constants/Colors";

WebBrowser.maybeCompleteAuthSession();

// Using ngrok URL for Spotify OAuth callback support
const API_BASE_URL = "https://piranha-coherent-usefully.ngrok-free.app";
// For local testing without OAuth:
// const API_BASE_URL = "http://localhost:3000";

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Handle deep link when app returns from browser
    const handleDeepLink = (url: string) => {
      if (url.includes("spotyme://callback")) {
        const urlObj = new URL(url);
        const accessToken = urlObj.searchParams.get("accessToken");
        const refreshToken = urlObj.searchParams.get("refreshToken");

        if (accessToken && refreshToken) {
          handleTokens(accessToken, refreshToken);
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleTokens = async (accessToken: string, refreshToken: string) => {
    try {
      await AsyncStorage.setItem("spotify_access_token", accessToken);
      await AsyncStorage.setItem("spotify_refresh_token", refreshToken);
      await AsyncStorage.setItem("is_authenticated", "true");
      
      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error storing tokens:", error);
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      setIsLoading(true);

      // Get auth URL from backend
      const response = await fetch(`${API_BASE_URL}/auth/login`);
      const data = await response.json();

      if (!data.authUrl) {
        throw new Error("Failed to get authorization URL");
      }

      // Open Spotify auth in browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.authUrl,
        "spotyme://callback",
        {
          showInRecents: true,
          createTask: false,
        }
      );

      console.log("Auth result:", result);

      if (result.type === "success" && result.url) {
        // Parse the callback URL to extract tokens
        const url = new URL(result.url);
        const accessToken = url.searchParams.get("accessToken");
        const refreshToken = url.searchParams.get("refreshToken");

        if (accessToken && refreshToken) {
          // Use the shared handler
          await handleTokens(accessToken, refreshToken);
        } else {
          throw new Error("Failed to get tokens from callback");
        }
      } else if (result.type === "dismiss") {
        console.log("User dismissed the auth flow");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        "Unable to connect to Spotify. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#1DB954", "#121212"] as any}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="musical-notes" size={80} color={Colors.text} />
          <Text style={styles.appName}>SpotYme</Text>
          <Text style={styles.tagline}>Your AI-Powered Playlist Creator</Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="search" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Discover new music</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="analytics" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Smart recommendations</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="list" size={24} color={Colors.primary} />
            <Text style={styles.featureText}>Create perfect playlists</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleSpotifyLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <>
              <Ionicons
                name="musical-note"
                size={24}
                color={Colors.background}
              />
              <Text style={styles.loginButtonText}>Connect with Spotify</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          We'll need access to your Spotify account to create playlists
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  appName: {
    fontSize: 48,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 20,
  },
  tagline: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  featuresContainer: {
    marginBottom: 60,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.background,
    marginLeft: 10,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
