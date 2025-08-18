import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    
    // Set up an interval to periodically check auth status
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === 'login';
      
      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to login if not authenticated
        router.replace('/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to main app if authenticated
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, segments, isLoading]);

  const checkAuthStatus = async () => {
    try {
      const authStatus = await AsyncStorage.getItem('is_authenticated');
      const accessToken = await AsyncStorage.getItem('spotify_access_token');
      const newAuthStatus = authStatus === 'true' && !!accessToken;
      
      // Only update if status changed to avoid unnecessary re-renders
      setIsAuthenticated(prev => {
        if (prev !== newAuthStatus) {
          return newAuthStatus;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#121212',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: '#121212',
          },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="playlist/[id]" 
          options={{ 
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="playlist-builder/[trackId]" 
          options={{ 
            headerShown: false
          }} 
        />
      </Stack>
    </>
  );
}