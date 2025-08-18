import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 100 : 85,
        },
        tabBarBackground: () => (
          <View style={{
            flex: 1,
            overflow: 'visible',
          }}>
            {/* Extended fade area above tab bar */}
            <LinearGradient
              colors={['transparent', 'rgba(18, 18, 18, 0.3)', 'rgba(18, 18, 18, 0.6)', 'rgba(18, 18, 18, 0.85)']}
              locations={[0, 0.3, 0.6, 1]}
              style={{
                position: 'absolute',
                top: -40,
                left: 0,
                right: 0,
                height: 40,
              }}
            />
            
            {/* Main blur background */}
            <BlurView 
              intensity={85} 
              tint="dark"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
              }}
            />
            
            {/* Smooth gradient overlay without any borders */}
            <LinearGradient
              colors={['rgba(18, 18, 18, 0.75)', 'rgba(18, 18, 18, 0.88)', 'rgba(18, 18, 18, 0.92)']}
              locations={[0, 0.5, 1]}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </View>
        ),
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 0 : 6,
        },
        tabBarItemStyle: {
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Hide index.tsx from tabs */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
      
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 35,
            }}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  width: 48,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: `${Colors.primary}15`,
                }} />
              )}
              <MaterialIcons 
                name="search" 
                size={24} 
                color={focused ? Colors.primary : Colors.textTertiary} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="playlists"
        options={{
          title: 'My Playlists',
          headerShown: false,
          tabBarLabel: 'Playlists',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 35,
            }}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  width: 48,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: `${Colors.primary}15`,
                }} />
              )}
              <MaterialIcons 
                name="library-music" 
                size={24} 
                color={focused ? Colors.primary : Colors.textTertiary} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 35,
            }}>
              {focused && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  width: 48,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: `${Colors.primary}15`,
                }} />
              )}
              <MaterialIcons 
                name="person" 
                size={24} 
                color={focused ? Colors.primary : Colors.textTertiary} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}