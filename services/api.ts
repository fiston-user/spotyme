import AsyncStorage from "@react-native-async-storage/async-storage";

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
        // Handle authentication errors
        if (response.status === 401) {
          // Clear auth state to trigger redirect to login
          await AsyncStorage.multiRemove([
            "spotify_access_token",
            "spotify_refresh_token",
            "is_authenticated",
          ]);

          return {
            success: false,
            error: "Session expired. Please login again.",
          };
        }

        return {
          success: false,
          error:
            data.error?.message ||
            data.error ||
            `Request failed with status ${response.status}`,
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
      const refreshTokenValue = await AsyncStorage.getItem(
        "spotify_refresh_token"
      );
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
        `${API_BASE_URL}/api/spotify/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
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

  async getTopArtists(timeRange = "medium_term", limit = 20) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/spotify/me/top/artists?time_range=${timeRange}&limit=${limit}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch top artists",
      };
    }
  }

  async getFeaturedContent(country = "US", limit = 20) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/spotify/featured?country=${country}&limit=${limit}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch featured content",
      };
    }
  }

  async getNewReleases(country = "US", limit = 20) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/spotify/new-releases?country=${country}&limit=${limit}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch new releases",
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

  // Spotify Track Endpoints
  async getTrack(trackId: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/spotify/track/${trackId}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch track details",
      };
    }
  }

  async getTrackAudioFeatures(trackId: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/spotify/track/${trackId}/features`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch audio features",
      };
    }
  }

  async getSpotifyPlaylistDetails(playlistId: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/spotify/playlist/${playlistId}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch playlist details",
      };
    }
  }

  async getRecommendations(
    seedTracks: string,
    limit: number,
    targetEnergy?: number,
    targetValence?: number
  ) {
    try {
      const params = new URLSearchParams({
        seed_tracks: seedTracks,
        limit: limit.toString(),
      });

      if (targetEnergy !== undefined) {
        params.append("target_energy", targetEnergy.toString());
      }
      if (targetValence !== undefined) {
        params.append("target_valence", targetValence.toString());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/spotify/recommendations?${params}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to get recommendations",
      };
    }
  }

  // Playlist Endpoints
  async generatePlaylist(data: {
    seedTracks: string[];
    selectedTracks?: string[];
    name: string;
    description: string;
    options?: {
      limit?: number;
      targetEnergy?: number;
      targetValence?: number;
      generateSmartTitle?: boolean;
    };
  }) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/playlists/generate`, {
        method: "POST",
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: "Failed to generate playlist",
      };
    }
  }

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
      const response = await fetch(
        `${API_BASE_URL}/api/playlists/${playlistId}`,
        {
          method: "GET",
          headers: await this.getAuthHeaders(),
        }
      );
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
      const response = await fetch(
        `${API_BASE_URL}/api/playlists/${playlistId}`,
        {
          method: "DELETE",
          headers: await this.getAuthHeaders(),
        }
      );
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
