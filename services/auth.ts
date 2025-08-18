import AsyncStorage from '@react-native-async-storage/async-storage';

// Using ngrok URL for Spotify OAuth callback support
const API_BASE_URL = 'https://piranha-coherent-usefully.ngrok-free.app';
// For local testing without OAuth:
// const API_BASE_URL = 'http://localhost:3000';

export const authService = {
  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem('spotify_access_token');
  },

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem('spotify_refresh_token');
  },

  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('spotify_access_token', data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.multiRemove([
        'spotify_access_token',
        'spotify_refresh_token',
        'is_authenticated',
      ]);
    }
  },

  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let accessToken = await this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const makeRequest = async (token: string) => {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
    };

    let response = await makeRequest(accessToken);

    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        accessToken = await this.getAccessToken();
        if (accessToken) {
          response = await makeRequest(accessToken);
        }
      }
    }

    return response;
  },
};