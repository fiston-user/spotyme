import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../stores";
import { Colors } from "../constants/Colors";

export default function Index() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  // Wait for store to hydrate from AsyncStorage
  if (!isHydrated) {
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
