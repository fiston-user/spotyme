import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../stores";

const API_URL = "https://piranha-coherent-usefully.ngrok-free.app";

export default function CallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    handleCallback();

    // Also listen for URL changes while the screen is mounted
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("URL event received in callback:", event.url);
      handleCallbackUrl(event.url);
    });

    return () => subscription.remove();
  }, []);

  const handleCallback = async () => {
    try {
      // First try to get the current URL from Linking
      const currentUrl = await Linking.getInitialURL();
      console.log("Initial URL in callback:", currentUrl);

      if (currentUrl && currentUrl.includes("callback")) {
        await handleCallbackUrl(currentUrl);
        return;
      }

      // If no URL, wait a bit for the deep link to arrive
      setTimeout(async () => {
        const url = await Linking.getInitialURL();
        console.log("Delayed URL check:", url);
        if (url && url.includes("callback")) {
          await handleCallbackUrl(url);
        } else {
          console.log("No callback URL found, returning to login");
          router.replace("/login");
        }
      }, 1000);
    } catch (error) {
      console.error("Callback error:", error);
      router.replace("/login");
    }
  };

  const handleCallbackUrl = async (url: string) => {
    try {
      console.log("Processing callback URL:", url);

      if (
        url &&
        (url.includes("spotyme://callback") ||
          url.includes("spotyme:///callback"))
      ) {
        const sessionToken = extractSessionToken(url);
        console.log("Session token:", sessionToken);

        if (sessionToken) {
          // Exchange session token for access token
          const response = await fetch(`${API_URL}/auth/exchange`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionToken }),
          });

          if (!response.ok) {
            throw new Error("Failed to exchange session token");
          }

          const data = await response.json();

          if (data.accessToken && data.refreshToken) {
            // Store tokens in AsyncStorage
            await AsyncStorage.setItem(
              "spotify_access_token",
              data.accessToken
            );
            await AsyncStorage.setItem(
              "spotify_refresh_token",
              data.refreshToken
            );
            await AsyncStorage.setItem("is_authenticated", "true");

            // Update auth store
            const authStore = useAuthStore.getState();
            await authStore.login(data.accessToken, data.refreshToken);

            // Small delay to ensure auth state is propagated
            setTimeout(() => {
              // Navigate to main app
              router.replace("/(tabs)");
            }, 100);
          } else {
            throw new Error("Invalid token response");
          }
        } else {
          console.log("No session token found in URL");
        }
      } else {
        console.log("URL doesn't match callback pattern");
      }
    } catch (error) {
      console.error("Callback URL processing error:", error);
      // Navigate back to login on error
      router.replace("/login");
    }
  };

  const extractSessionToken = (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.searchParams.get("sessionToken");
    } catch {
      return null;
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
      }}
    >
      <ActivityIndicator size="large" color="#1DB954" />
      <Text style={{ color: "#fff", marginTop: 16 }}>
        Processing authentication...
      </Text>
    </View>
  );
}
