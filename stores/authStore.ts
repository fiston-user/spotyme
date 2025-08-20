import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  display_name: string;
  images?: Array<{ url: string }>;
  spotify_id?: string;
  country?: string;
  product?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isHydrated: boolean; // Track if store has been hydrated from storage
  error: string | null;
  
  // Actions
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearError: () => void;
  setHydrated: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isHydrated: false,
      error: null,

      login: async (accessToken: string, refreshToken: string) => {
        set({ isLoading: true, error: null });
        try {
          // Store tokens
          await AsyncStorage.multiSet([
            ['spotify_access_token', accessToken],
            ['spotify_refresh_token', refreshToken],
            ['is_authenticated', 'true'],
          ]);

          // Fetch user info
          const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user info');
          }

          const userData = await response.json();
          
          const user: User = {
            id: userData.id,
            email: userData.email,
            display_name: userData.display_name,
            images: userData.images,
            spotify_id: userData.id,
            country: userData.country,
            product: userData.product,
          };

          await AsyncStorage.setItem('user_info', JSON.stringify(user));

          set({
            isAuthenticated: true,
            user,
            accessToken,
            refreshToken,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          // Use the existing apiService logout method
          await apiService.logout();

          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Logout failed',
            isLoading: false,
          });
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          // Use apiService's refreshToken method
          const success = await apiService.refreshToken();
          
          if (success) {
            // Get the new token from AsyncStorage (apiService already stored it)
            const newAccessToken = await AsyncStorage.getItem('spotify_access_token');
            
            set({
              accessToken: newAccessToken,
              isLoading: false,
            });
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          // If refresh fails, logout user
          await get().logout();
          set({
            error: 'Session expired. Please login again.',
            isLoading: false,
          });
        }
      },

      checkAuthStatus: async () => {
        set({ isLoading: true });
        try {
          const [
            [, isAuth],
            [, accessToken],
            [, refreshToken],
            [, userInfo],
          ] = await AsyncStorage.multiGet([
            'is_authenticated',
            'spotify_access_token',
            'spotify_refresh_token',
            'user_info',
          ]);

          if (isAuth === 'true' && accessToken && userInfo) {
            const user = JSON.parse(userInfo) as User;
            set({
              isAuthenticated: true,
              user,
              accessToken,
              refreshToken,
              isLoading: false,
            });
          } else {
            set({
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Auth check error:', error);
          set({
            isAuthenticated: false,
            error: 'Failed to check authentication status',
            isLoading: false,
          });
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },

      setUser: (user: User) => {
        set({ user });
      },

      clearError: () => {
        set({ error: null });
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        // Called when hydration finishes
        state?.setHydrated();
      },
    }
  )
);

export default useAuthStore;