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
      // Skip Spotify recommendations API entirely, use AI-based recommendations directly
      console.log("Using AI-based recommendations for playlist generation");
      
      // Get the seed track details first
      const trackId = seedTracks.split(",")[0].replace('spotify:track:', '');
      const seedTrack = await this.getTrack(accessToken, trackId);
      
      // Use AI-based recommendations as primary method
      const aiRecommendations = await aiRecommendationService.getAIRecommendations(
        accessToken,
        seedTrack,
        targetEnergy,
        targetValence,
        limit
      );
      
      return aiRecommendations;
    } catch (error: any) {
      console.error("AI recommendations failed:", error);
      
      // Fallback: Return some popular tracks as a last resort
      try {
        const searchResults = await this.search(
          accessToken,
          "year:2024",
          "track",
          limit
        );
        
        return {
          tracks: searchResults.tracks?.items || [],
          seeds: []
        };
      } catch (fallbackError) {
        console.error("Fallback search also failed:", fallbackError);
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

      // Create the playlist for the current user
      const playlistData = await api.createPlaylist(name, {
        description: description,
        public: false,
        collaborative: false
      });
      
      const playlist = playlistData.body;

      // Add tracks to the playlist
      if (trackIds.length > 0) {
        const trackUris = trackIds.map((id) => `spotify:track:${id}`);
        await api.addTracksToPlaylist(playlist.id, trackUris);
      }

      return playlist;
    } catch (error) {
      console.error("Create playlist error:", error);
      // Log more detailed error info
      if ((error as any).response) {
        console.error("Error response:", (error as any).response.body);
      }
      if ((error as any).body) {
        console.error("Error body:", (error as any).body);
      }
      if ((error as any).statusCode) {
        console.error("Error status:", (error as any).statusCode);
      }
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

  async getPlaylistDetails(
    accessToken: string,
    playlistId: string
  ): Promise<any> {
    try {
      const api = this.createApiInstance(accessToken);
      
      // Get playlist metadata
      const playlistData = await api.getPlaylist(playlistId);
      
      // Get first 10 tracks for preview
      const tracksData = await api.getPlaylistTracks(playlistId, { limit: 10 });
      
      return {
        id: playlistData.body.id,
        name: playlistData.body.name,
        description: playlistData.body.description,
        images: playlistData.body.images,
        owner: playlistData.body.owner,
        followers: playlistData.body.followers,
        public: playlistData.body.public,
        tracks: {
          total: playlistData.body.tracks.total,
          items: tracksData.body.items
        },
        external_urls: playlistData.body.external_urls
      };
    } catch (error) {
      console.error("Get playlist details error:", error);
      throw new Error("Failed to get playlist details");
    }
  }

  async getFeaturedContent(
    accessToken: string,
    country: string,
    limit: number
  ): Promise<any> {
    try {
      const api = this.createApiInstance(accessToken);
      
      // Try to get user's playlists as featured content
      try {
        const userPlaylists = await api.getUserPlaylists({ limit });
        
        // Also try to get some category playlists
        let categoryPlaylists: any[] = [];
        try {
          const categories = await api.getCategories({ limit: 3, country });
          if (categories.body.categories.items.length > 0) {
            const categoryId = categories.body.categories.items[0].id;
            const catPlaylists = await api.getPlaylistsForCategory(categoryId, { limit: 5, country });
            categoryPlaylists = catPlaylists.body.playlists.items;
          }
        } catch (catError) {
          console.log("Categories not available, using user playlists only");
        }
        
        return {
          playlists: {
            items: [...userPlaylists.body.items, ...categoryPlaylists].slice(0, limit)
          },
          message: "Your Music",
        };
      } catch (userError) {
        console.log("User playlists not available, trying browse features");
        
        // Fallback: Try to get browse new releases as playlists
        try {
          const newReleases = await this.getNewReleases(accessToken, country, limit);
          // Convert albums to playlist-like format
          const playlistLikeItems = newReleases.albums?.items?.map((album: any) => ({
            id: album.id,
            name: album.name,
            description: `Album by ${album.artists?.map((a: any) => a.name).join(', ')}`,
            images: album.images,
            owner: { display_name: album.artists?.[0]?.name || 'Artist' },
            tracks: { total: album.total_tracks }
          })) || [];
          
          return {
            playlists: { items: playlistLikeItems },
            message: "Discover New Music",
          };
        } catch (browseError) {
          console.error("All featured content methods failed");
          return {
            playlists: { items: [] },
            message: "Discover Music",
          };
        }
      }
    } catch (error) {
      console.error("Get featured content error:", error);
      // Return default content if API fails
      return {
        playlists: { items: [] },
        message: "Discover Music",
      };
    }
  }

  async getNewReleases(
    accessToken: string,
    country: string,
    limit: number
  ): Promise<any> {
    try {
      const api = this.createApiInstance(accessToken);
      const data = await api.getNewReleases({
        limit,
        country,
      });
      return data.body;
    } catch (error) {
      console.error("Get new releases error:", error);
      // Return empty albums if API fails
      return {
        albums: { items: [] },
      };
    }
  }
}

export const spotifyApiService = new SpotifyApiService();
