import { apiClient } from "./apiClient";

class ApiService {
  // User Profile Endpoints
  async getUserProfile() {
    return apiClient.get("/api/user/profile");
  }

  async updateUserPreferences(preferences: any) {
    return apiClient.put("/api/user/preferences", { preferences });
  }

  async getUserHistory(limit = 20, offset = 0) {
    return apiClient.get(`/api/user/history?limit=${limit}&offset=${offset}`);
  }

  // Spotify Endpoints
  async getTopTracks(timeRange = "medium_term", limit = 20) {
    return apiClient.get(
      `/api/spotify/me/top/tracks?time_range=${timeRange}&limit=${limit}`
    );
  }

  async getTopArtists(timeRange = "medium_term", limit = 20) {
    return apiClient.get(
      `/api/spotify/me/top/artists?time_range=${timeRange}&limit=${limit}`
    );
  }

  async getFeaturedContent(country = "US", limit = 20) {
    return apiClient.get(
      `/api/spotify/featured?country=${country}&limit=${limit}`
    );
  }

  async getNewReleases(country = "US", limit = 20) {
    return apiClient.get(
      `/api/spotify/new-releases?country=${country}&limit=${limit}`
    );
  }

  async searchTracks(query: string, limit = 20) {
    return apiClient.get(
      `/api/spotify/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
    );
  }

  // Spotify Track Endpoints
  async getTrack(trackId: string) {
    return apiClient.get(`/api/spotify/track/${trackId}`);
  }

  async getTrackAudioFeatures(trackId: string) {
    return apiClient.get(`/api/spotify/track/${trackId}/features`);
  }

  async getSpotifyPlaylistDetails(playlistId: string) {
    return apiClient.get(`/api/spotify/playlist/${playlistId}`);
  }

  async getRecommendations(
    seedTracks: string,
    limit: number,
    targetEnergy?: number,
    targetValence?: number
  ) {
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

    return apiClient.get(`/api/spotify/recommendations?${params}`);
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
    return apiClient.post("/api/playlists/generate", data);
  }

  async createPlaylist(name: string, description: string, trackUris: string[]) {
    return apiClient.post("/api/playlists/create", {
      name,
      description,
      trackUris,
    });
  }

  async getUserPlaylists() {
    return apiClient.get("/api/playlists/user");
  }

  async exportPlaylistToSpotify(playlistId: string) {
    return apiClient.post(`/api/playlists/${playlistId}/export-to-spotify`);
  }

  async getPlaylist(playlistId: string) {
    return apiClient.get(`/api/playlists/${playlistId}`);
  }

  async deletePlaylist(playlistId: string) {
    return apiClient.delete(`/api/playlists/${playlistId}`);
  }

  // Auth Endpoints
  async logout() {
    return apiClient.logout();
  }

  // Token management (exposed for backward compatibility)
  async refreshToken() {
    return apiClient.checkTokenExpiry();
  }
}

export const apiService = new ApiService();