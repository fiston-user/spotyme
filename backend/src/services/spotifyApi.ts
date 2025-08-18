import SpotifyWebApi from "spotify-web-api-node";
import { aiRecommendationService } from "./aiRecommendations";

class SpotifyApiService {
  private createApiInstance(accessToken: string): SpotifyWebApi {
    const api = new SpotifyWebApi();
    api.setAccessToken(accessToken);
    return api;
  }

  async search(
    accessToken: string,
    query: string,
    type: string,
    limit: number
  ): Promise<any> {
    try {
      const api = this.createApiInstance(accessToken);
      const searchTypes = type.split(",") as any;
      const data = await api.search(query, searchTypes, { limit });
      return data.body;
    } catch (error) {
      console.error("Search error:", error);
      throw new Error("Failed to search Spotify");
    }
  }

  async getTrack(accessToken: string, trackId: string): Promise<any> {
    try {
      const api = this.createApiInstance(accessToken);
      const data = await api.getTrack(trackId);
      return data.body;
    } catch (error) {
      console.error("Get track error:", error);
      throw new Error("Failed to get track");
    }
  }

  async getAudioFeatures(accessToken: string, trackId: string): Promise<any> {
    try {
      const api = this.createApiInstance(accessToken);
      const data = await api.getAudioFeaturesForTrack(trackId);
      return data.body;
    } catch (error: any) {
      console.error("Get audio features error:", error);
      if (error.statusCode === 404 || error.statusCode === 403) {
        // Return default values if audio features not available or forbidden
        console.log("Audio features not available, using defaults");
        return {
          energy: 0.5,
          valence: 0.5,
          danceability: 0.5,
          acousticness: 0.5,
          instrumentalness: 0.5,
          liveness: 0.5,
          speechiness: 0.5,
        };
      }
      throw new Error("Failed to get audio features");
    }
  }

  async getRecommendations(
    accessToken: string,
    seedTracks: string,
    limit: number,
    targetEnergy?: number,
    targetValence?: number
  ): Promise<any> {
    try {
      const api = this.createApiInstance(accessToken);
      const trackIds = seedTracks.split(",").filter(id => id.trim()).slice(0, 5);
      
      // Clean track IDs - remove any spotify:track: prefix
      const cleanTrackIds = trackIds.map(id => id.replace('spotify:track:', ''));

      const params: any = {
        seed_tracks: cleanTrackIds,
        limit,
      };

      // Add optional target parameters
      if (targetEnergy !== undefined) {
        params.target_energy = targetEnergy;
      }
      if (targetValence !== undefined) {
        params.target_valence = targetValence;
      }

      const data = await api.getRecommendations(params);
      return data.body;
    } catch (error: any) {
      console.error("Spotify recommendations failed, switching to AI-based recommendations");
      
      // Get the seed track details first
      try {
        const trackId = seedTracks.split(",")[0].replace('spotify:track:', '');
        const seedTrack = await this.getTrack(accessToken, trackId);
        
        // Use AI-based recommendations as fallback
        const aiRecommendations = await aiRecommendationService.getAIRecommendations(
          accessToken,
          seedTrack,
          targetEnergy,
          targetValence,
          limit
        );
        
        return aiRecommendations;
      } catch (aiError) {
        console.error("AI recommendations also failed:", aiError);
        // Return empty recommendations instead of failing completely
        return {
          tracks: [],
          seeds: []
        };
      }
    }
  }

  async getTopItems(
    accessToken: string,
    type: "artists" | "tracks",
    limit: number,
    timeRange: string
  ): Promise<any> {
    try {
      const api = this.createApiInstance(accessToken);

      if (type === "artists") {
        const data = await api.getMyTopArtists({
          limit,
          time_range: timeRange as any,
        });
        return data.body;
      } else {
        const data = await api.getMyTopTracks({
          limit,
          time_range: timeRange as any,
        });
        return data.body;
      }
    } catch (error) {
      console.error("Get top items error:", error);
      throw new Error("Failed to get top items");
    }
  }

  async createPlaylist(
    accessToken: string,
    _userId: string,
    name: string,
    description: string,
    trackIds: string[]
  ): Promise<any> {
    try {
      const api = this.createApiInstance(accessToken);

      // Get the user's Spotify ID
      const userProfile = await api.getMe();
      const spotifyUserId = userProfile.body.id;

      // Create the playlist
      const playlistData = await (api.createPlaylist as any)(
        spotifyUserId,
        name,
        {
          description,
          public: false,
        }
      );
      const playlist = (playlistData as any).body;

      // Add tracks to the playlist
      if (trackIds.length > 0) {
        const trackUris = trackIds.map((id) => `spotify:track:${id}`);
        await api.addTracksToPlaylist(playlist.id, trackUris);
      }

      return playlist;
    } catch (error) {
      console.error("Create playlist error:", error);
      throw new Error("Failed to create Spotify playlist");
    }
  }

  async getPlaylistTracks(
    accessToken: string,
    playlistId: string
  ): Promise<any> {
    try {
      const api = this.createApiInstance(accessToken);
      const data = await api.getPlaylistTracks(playlistId);
      return data.body;
    } catch (error) {
      console.error("Get playlist tracks error:", error);
      throw new Error("Failed to get playlist tracks");
    }
  }
}

export const spotifyApiService = new SpotifyApiService();
