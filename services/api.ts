import AsyncStorage from "@react-native-async-storage/async-storage";

// Using ngrok URL for Spotify OAuth callback support
const API_BASE_URL = "https://piranha-coherent-usefully.ngrok-free.app";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

class ApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem("spotify_access_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      if (!response.ok) {
        // Don't try to refresh if we're already handling a 401
        if (response.status === 401) {
          return {
            success: false,
            error: "Session expired. Please login again.",
          };
        }

        return {
          success: false,
          error: data.error || `Request failed with status ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("API Error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshTokenValue = await AsyncStorage.getItem("spotify_refresh_token");
      if (!refreshTokenValue) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem("spotify_access_token", data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }

  // User Profile Endpoints
  async getUserProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: "GET",
        headers: await this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch user profile",
      };
    }
  }

  async updateUserPreferences(preferences: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
        method: "PUT",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ preferences }),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to update preferences",
      };
    }
  }

  async getUserHistory(limit = 20, offset = 0) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/history?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch user history",
      };
    }
  }

  // Spotify Endpoints
  async getTopTracks(timeRange = "medium_term", limit = 20) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/spotify/top-tracks?time_range=${timeRange}&limit=${limit}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch top tracks",
      };
    }
  }

  async searchTracks(query: string, limit = 20) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/spotify/search?q=${encodeURIComponent(
          query
        )}&type=track&limit=${limit}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to search tracks",
      };
    }
  }

  // Playlist Endpoints
  async createPlaylist(name: string, description: string, trackUris: string[]) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/playlists/create`, {
        method: "POST",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ name, description, trackUris }),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to create playlist",
      };
    }
  }

  async getUserPlaylists() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/playlists/user`, {
        method: "GET",
        headers: await this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch playlists",
      };
    }
  }

  async exportPlaylistToSpotify(playlistId: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/playlists/${playlistId}/export-to-spotify`,
        {
          method: "POST",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to export playlist to Spotify",
      };
    }
  }

  async getPlaylist(playlistId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/playlists/${playlistId}`, {
        method: "GET",
        headers: await this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch playlist",
      };
    }
  }

  async deletePlaylist(playlistId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/playlists/${playlistId}`, {
        method: "DELETE",
        headers: await this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to delete playlist",
      };
    }
  }

  // Auth Endpoints
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: await this.getAuthHeaders(),
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await AsyncStorage.multiRemove([
        "spotify_access_token",
        "spotify_refresh_token",
        "is_authenticated",
      ]);
    }
  }
}

export const apiService = new ApiService();
