import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  SafeAreaView,
} from "react-native";
import { useRouter, Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Colors } from "../constants/Colors";
import LoginBackgroundImage from "../components/LoginBackgroundImage";
import { useAuthStore, useUIStore } from "../stores";
import SpotifyLogo from "../components/logos/Spotify";
import AppleMusicLogo from "../components/logos/Apple";

WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL = "https://piranha-coherent-usefully.ngrok-free.app";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();
  const [localLoading, setLocalLoading] = useState(false);

  // Animation values - must be declared before any returns
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonSlideAnim = useRef(new Animated.Value(100)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Button animations
    Animated.parallel([
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 800,
        useNativeDriver: true,
      }),
      Animated.timing(buttonFadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Handle deep link when app returns from browser
    const handleDeepLink = async (url: string) => {
      console.log("Deep link received:", url);
      if (
        url.includes("spotyme://callback") ||
        url.includes("spotyme:///callback")
      ) {
        // Navigate to callback screen to handle the token exchange
        router.replace("/callback");
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

  const exchangeSessionToken = async (sessionToken: string, retryCount = 0) => {
    try {
      setLocalLoading(true);

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
          // Use Zustand store to handle login
          await login(data.accessToken, data.refreshToken);
          showToast("Successfully logged in!", "success");
          // Navigation will happen automatically via auth state change
        } else {
          throw new Error("Failed to get tokens from exchange");
        }
      } else {
        // Retry logic for failed exchange (up to 2 retries)
        if (retryCount < 2) {
          console.log(`Retrying token exchange (attempt ${retryCount + 2})...`);
          setTimeout(() => {
            exchangeSessionToken(sessionToken, retryCount + 1);
          }, 1000);
          return;
        }
        throw new Error("Failed to exchange session token");
      }
    } catch (error) {
      console.error("Session token exchange error:", error);

      // Retry on network errors
      if (
        retryCount < 2 &&
        error instanceof TypeError &&
        error.message.includes("fetch")
      ) {
        console.log(`Network error, retrying (attempt ${retryCount + 2})...`);
        setTimeout(() => {
          exchangeSessionToken(sessionToken, retryCount + 1);
        }, 1500);
        return;
      }

      showToast("Authentication failed. Please try again.", "error");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      setLocalLoading(true);

      console.log("Attempting to connect to:", `${API_BASE_URL}/auth/login`);

      // Get auth URL from backend
      const response = await fetch(`${API_BASE_URL}/auth/login`);

      if (!response.ok) {
        console.error("Response not OK:", response.status, response.statusText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Auth response received:", data);

      if (!data.authUrl) {
        throw new Error("Failed to get authorization URL");
      }

      // Open Spotify auth in browser with timeout recovery
      const authPromise = WebBrowser.openAuthSessionAsync(
        data.authUrl,
        "spotyme://callback",
        {
          showInRecents: true,
          createTask: false,
        }
      );

      // Add timeout for Android auth sessions that might hang
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Auth session timeout")), 60000); // 60 second timeout
      });

      try {
        const result = (await Promise.race([
          authPromise,
          timeoutPromise,
        ])) as any;

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
          showToast("Login cancelled", "info");
        }
      } catch (timeoutError) {
        if (
          timeoutError instanceof Error &&
          timeoutError.message === "Auth session timeout"
        ) {
          console.log("Auth session timed out, checking for pending deep link");
          showToast(
            "Taking longer than expected... Please complete login in the browser",
            "info"
          );

          // Wait a bit more for potential deep link
          setTimeout(() => {
            if (!isAuthenticated) {
              Alert.alert(
                "Login Timeout",
                "The login process is taking longer than expected. Please try again or check if the app opened in the background.",
                [{ text: "OK" }]
              );
            }
          }, 5000);
        } else {
          throw timeoutError;
        }
      }
    } catch (error) {
      console.error("Login error details:", error);
      console.error("Error type:", typeof error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown"
      );

      // More specific error messages
      let errorMessage = "Unable to connect to Spotify. Please try again.";
      if (error instanceof Error) {
        console.error("Full error:", error.toString());
        if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage = `Network error connecting to ${API_BASE_URL}. Please check your connection.`;
        } else if (error.message.includes("Server error")) {
          errorMessage = error.message;
        } else if (error.message.includes("authorization")) {
          errorMessage =
            "Authorization failed. Please ensure you have a Spotify account.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleAppleMusicLogin = () => {
    showToast("Apple Music support coming soon!", "info");
  };

  // Redirect if already authenticated - must be after all hooks
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/search" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced background with images */}
      <LoginBackgroundImage />

      <View style={styles.content}>
        {/* Top Section with Logo and Text */}
        <Animated.View
          style={[
            styles.topSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={Colors.gradients.green as any}
              style={styles.logoBackground}
            >
              <MaterialIcons
                name="library-music"
                size={48}
                color={Colors.background}
              />
            </LinearGradient>
          </View>

          {/* Welcome Text */}
          <View style={styles.textContainer}>
            <Text style={styles.welcomeText}>Welcome!</Text>
            <Text style={styles.subtitleText}>
              Choose your streaming service to continue
            </Text>
          </View>
        </Animated.View>

        {/* Bottom Section with Login Buttons */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: buttonFadeAnim,
              transform: [{ translateY: buttonSlideAnim }],
            },
          ]}
        >
          {/* Spotify Login Button */}
          <TouchableOpacity
            onPress={handleSpotifyLogin}
            disabled={isLoading || localLoading}
            activeOpacity={0.8}
            style={styles.loginButton}
          >
            <View style={[styles.buttonInner, styles.spotifyButton]}>
              {isLoading || localLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <SpotifyLogo width={24} height={24} />
                  <Text style={styles.buttonText}>Continue with Spotify</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Apple Music Login Button */}
          {/* <TouchableOpacity
            onPress={handleAppleMusicLogin}
            activeOpacity={0.8}
            style={styles.loginButton}
          >
            <View style={[styles.buttonInner, styles.appleButton]}>
              <AppleMusicLogo width={24} height={24} />
              <Text style={[styles.buttonText, styles.appleButtonText]}>
                Continue with Apple Music
              </Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </TouchableOpacity> */}

          {/* Footer Text */}
          <Text style={styles.footerText}>
            Your music, intelligently organized
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },

  // Top Section
  topSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: height * 0.1,
  },
  logoContainer: {
    marginBottom: 40,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 20,
  },

  // Bottom Section
  bottomSection: {
    paddingBottom: 40,
    alignItems: "center",
    width: "100%",
  },
  loginButton: {
    width: "100%",
    maxWidth: Math.min(360, width - 48),
    marginBottom: 16,
    position: "relative",
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 12,
  },
  spotifyButton: {
    backgroundColor: "#1DB954",
    shadowColor: "#1DB954",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  appleButton: {
    backgroundColor: "#FA243C",
    shadowColor: "#FA243C",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  appleButtonText: {
    color: "#FFFFFF",
  },
  comingSoonBadge: {
    position: "absolute",
    top: -8,
    right: 20,
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.background,
    letterSpacing: 0.5,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginTop: 24,
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
