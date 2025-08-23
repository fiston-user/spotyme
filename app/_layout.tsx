import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthToast } from '../components/AuthToast';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <AuthToast />
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
        <Stack.Screen name="callback" options={{ headerShown: false }} />
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