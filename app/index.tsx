import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useAuthStore } from "../stores";
import { Colors } from "../constants/Colors";

export default function Index() {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Check auth status on mount
    checkAuthStatus();
  }, []);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Redirect based on auth status
  return <Redirect href={isAuthenticated ? "/(tabs)/search" : "/login"} />;
}
