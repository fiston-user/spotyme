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


// Using ngrok URL for Spotify OAuth callback support
const API_BASE_URL = "https://piranha-coherent-usefully.ngrok-free.app";
// For local testing without OAuth:
// const API_BASE_URL = "http://localhost:3000";

export default function LoginScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Handle deep link when app returns from browser
    const handleDeepLink = async (url: string) => {
      if (url.includes("spotyme://callback")) {
        // For mobile app, we need to exchange the session token for actual tokens
        const urlObj = new URL(url);
        const sessionToken = urlObj.searchParams.get("sessionToken");

        if (sessionToken) {
          await exchangeSessionToken(sessionToken);
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

  const exchangeSessionToken = async (sessionToken: string) => {
    try {
      setIsLoading(true);
      
      // Exchange session token for actual tokens using the secure endpoint
      const response = await fetch(`${API_BASE_URL}/auth/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.accessToken && data.refreshToken) {
          await handleTokens(data.accessToken, data.refreshToken);
          
          // Also store user info if provided
          if (data.user) {
            await AsyncStorage.setItem("user_info", JSON.stringify(data.user));
          }
        } else {
          throw new Error("Failed to get tokens from exchange");
        }
      } else {
        throw new Error("Failed to exchange session token");
      }
    } catch (error) {
      console.error("Session token exchange error:", error);
      Alert.alert(
        "Authentication Failed",
        "Unable to complete authentication. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
        // Parse the callback URL to get the session token
        const url = new URL(result.url);
        const sessionToken = url.searchParams.get("sessionToken");
        
        if (sessionToken) {
          // Exchange the session token for actual tokens
          await exchangeSessionToken(sessionToken);
        } else {
          throw new Error("No session token in callback URL");
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
