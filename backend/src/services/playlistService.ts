import { Playlist, IPlaylist } from "../models/Playlist";
import { spotifyApiService } from "./spotifyApi";

interface GeneratePlaylistOptions {
  name: string;
  description: string;
  targetEnergy?: number;
  targetValence?: number;
  genres?: string[];
  limit?: number;
}

class PlaylistService {
  async createPlaylistWithTracks(
    accessToken: string,
    userId: string,
    trackIds: string[],
    options: GeneratePlaylistOptions & { seedTracks?: string[] }
  ): Promise<IPlaylist> {
    try {
      // Fetch track details from Spotify for each track ID
      const tracks = await Promise.all(
        trackIds.map(async (trackId) => {
          const track = await spotifyApiService.getTrack(accessToken, trackId);
          return {
            spotifyId: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            duration: track.duration_ms,
            albumArt: track.album.images[0]?.url,
            previewUrl: track.preview_url,
          };
        })
      );

      // Create playlist in database
      const playlist = await Playlist.create({
        userId,
        name: options.name,
        description: options.description,
        tracks,
        seedTracks: options.seedTracks || [],
        generationParams: {
          targetEnergy: options.targetEnergy,
          targetValence: options.targetValence,
          genres: options.genres || [],
        },
        totalDuration: tracks.reduce(
          (sum: number, t: any) => sum + t.duration,
          0
        ),
      });

      return playlist;
    } catch (error) {
      console.error("Error creating playlist with tracks:", error);
      throw new Error("Failed to create playlist with selected tracks");
    }
  }

  async generatePlaylist(
    accessToken: string,
    userId: string,
    seedTracks: string[],
    options: GeneratePlaylistOptions
  ): Promise<IPlaylist> {
    try {
      // Get AI-based recommendations directly
      const recommendations = await spotifyApiService.getRecommendations(
        accessToken,
        seedTracks.join(","),
        options.limit || 20,
        options.targetEnergy,
        options.targetValence
      );

      // Use provided values or defaults for energy/valence
      // Default to moderate values if not specified
      const targetEnergy = options.targetEnergy ?? 0.5;
      const targetValence = options.targetValence ?? 0.5;

      // Process recommendations into track format
      const tracks = recommendations.tracks.map((track: any) => ({
        spotifyId: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        duration: track.duration_ms,
        albumArt: track.album.images[0]?.url,
        previewUrl: track.preview_url,
      }));

      // Create playlist in database
      const playlist = await Playlist.create({
        userId,
        name: options.name,
        description: options.description,
        tracks,
        seedTracks,
        generationParams: {
          targetEnergy: targetEnergy,
          targetValence: targetValence,
          genres: options.genres || [],
        },
        totalDuration: tracks.reduce(
          (sum: number, t: any) => sum + t.duration,
          0
        ),
      });

      return playlist;
    } catch (error) {
      console.error("Error generating playlist:", error);
      throw new Error("Failed to generate playlist");
    }
  }

  async getUserPlaylists(userId: string): Promise<IPlaylist[]> {
    try {
      return await Playlist.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error getting user playlists:", error);
      throw new Error("Failed to get user playlists");
    }
  }

  async getPlaylist(
    playlistId: string,
    userId: string
  ): Promise<IPlaylist | null> {
    try {
      return await Playlist.findOne({ _id: playlistId, userId });
    } catch (error) {
      console.error("Error getting playlist:", error);
      throw new Error("Failed to get playlist");
    }
  }

  async updatePlaylist(
    playlistId: string,
    userId: string,
    updates: Partial<IPlaylist>
  ): Promise<IPlaylist | null> {
    try {
      return await Playlist.findOneAndUpdate(
        { _id: playlistId, userId },
        updates,
        { new: true }
      );
    } catch (error) {
      console.error("Error updating playlist:", error);
      throw new Error("Failed to update playlist");
    }
  }

  async deletePlaylist(playlistId: string, userId: string): Promise<void> {
    try {
      await Playlist.findOneAndDelete({ _id: playlistId, userId });
    } catch (error) {
      console.error("Error deleting playlist:", error);
      throw new Error("Failed to delete playlist");
    }
  }

  async addTrackToPlaylist(
    playlistId: string,
    userId: string,
    track: any
  ): Promise<IPlaylist | null> {
    try {
      return await Playlist.findOneAndUpdate(
        { _id: playlistId, userId },
        {
          $push: { tracks: track },
          $inc: { totalDuration: track.duration },
        },
        { new: true }
      );
    } catch (error) {
      console.error("Error adding track to playlist:", error);
      throw new Error("Failed to add track to playlist");
    }
  }

  async removeTrackFromPlaylist(
    playlistId: string,
    userId: string,
    trackId: string
  ): Promise<IPlaylist | null> {
    try {
      const playlist = await Playlist.findOne({ _id: playlistId, userId });
      if (!playlist) return null;

      const track = playlist.tracks.find((t: any) => t.spotifyId === trackId);
      if (!track) return playlist;

      return await Playlist.findOneAndUpdate(
        { _id: playlistId, userId },
        {
          $pull: { tracks: { spotifyId: trackId } },
          $inc: { totalDuration: -track.duration },
        },
        { new: true }
      );
    } catch (error) {
      console.error("Error removing track from playlist:", error);
      throw new Error("Failed to remove track from playlist");
    }
  }
}

export const playlistService = new PlaylistService();
