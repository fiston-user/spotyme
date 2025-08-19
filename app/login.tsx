import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../constants/Colors";

WebBrowser.maybeCompleteAuthSession();

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

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
    <View style={styles.container}>
      {/* Subtle gradient background */}
      <LinearGradient
        colors={[Colors.background, "rgba(29, 185, 84, 0.02)", Colors.background]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={Colors.gradients.green as any}
              style={styles.logoBackground}
            >
              <MaterialIcons name="library-music" size={40} color={Colors.background} />
            </LinearGradient>
          </View>
          
          <Text style={styles.appName}>SpotYme</Text>
          <Text style={styles.tagline}>Your AI music companion</Text>
        </View>

        {/* Login Button */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleSpotifyLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isLoading ? [Colors.surface, Colors.surface] : (Colors.gradients.green as any)}
              style={styles.loginButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <MaterialIcons name="music-note" size={20} color={Colors.background} />
                  <Text style={styles.loginButtonText}>Continue with Spotify</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Secure login via Spotify
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  
  // Logo Section
  logoSection: {
    alignItems: "center",
    marginBottom: 80,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 42,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  
  // CTA Section
  ctaSection: {
    alignItems: "center",
  },
  loginButton: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    overflow: "hidden",
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.background,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 16,
  },
});
