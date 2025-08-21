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
} from "react-native";
import { useRouter, Redirect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Colors } from "../constants/Colors";
import LoginBackgroundImage from "../components/LoginBackgroundImage";
import { useAuthStore, useUIStore } from "../stores";

WebBrowser.maybeCompleteAuthSession();

// Using ngrok URL for Spotify OAuth callback support
const API_BASE_URL = "https://api.spotyme.space";
// For local testing without OAuth:
// const API_BASE_URL = "http://localhost:3000";

export default function LoginScreen() {
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();
  const [localLoading, setLocalLoading] = useState(false);

  // Animation values - must be declared before any returns
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Button pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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

      // Get auth URL from backend
      const response = await fetch(`${API_BASE_URL}/auth/login`);
      const data = await response.json();

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
      console.error("Login error:", error);

      // More specific error messages
      let errorMessage = "Unable to connect to Spotify. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message.includes("authorization")) {
          errorMessage =
            "Authorization failed. Please ensure you have a Spotify account.";
        }
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  // Redirect if already authenticated - must be after all hooks
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/search" />;
  }

  return (
    <View style={styles.container}>
      {/* Enhanced background with images */}
      <LoginBackgroundImage />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={Colors.gradients.green as any}
              style={styles.logoBackground}
            >
              <MaterialIcons
                name="library-music"
                size={40}
                color={Colors.background}
              />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.appName}>SpotYme</Text>
          <Text style={styles.tagline}>Your AI music companion</Text>
        </View>

        {/* Login Button */}
        <View style={styles.ctaSection}>
          <Animated.View
            style={[
              styles.loginButton,
              {
                transform: [{ scale: buttonPulse }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleSpotifyLogin}
              disabled={isLoading || localLoading}
              activeOpacity={0.8}
              style={styles.touchableButton}
            >
              <LinearGradient
                colors={
                  isLoading || localLoading
                    ? [Colors.surface, Colors.surface]
                    : (Colors.gradients.green as any)
                }
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading || localLoading ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <View style={styles.buttonContent}>
                    <MaterialIcons
                      name="music-note"
                      size={20}
                      color={Colors.background}
                    />
                    <Text style={styles.loginButtonText} numberOfLines={1}>
                      Continue with Spotify
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.disclaimer}>Secure login via Spotify</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const { width } = Dimensions.get("window");

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
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoBackground: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 46,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },

  // CTA Section
  ctaSection: {
    alignItems: "center",
    width: "100%",
  },
  loginButton: {
    width: "100%",
    maxWidth: Math.min(320, width - 48), // Responsive width
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  touchableButton: {
    width: "100%",
  },
  loginButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    minHeight: 56, // Consistent height
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.background,
    letterSpacing: 0.3,
    flexShrink: 1, // Allow text to shrink if needed
  },
  disclaimer: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 20,
    letterSpacing: 0.2,
  },
});
