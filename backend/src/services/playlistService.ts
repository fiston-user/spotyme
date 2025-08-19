import { Playlist, IPlaylist } from "../models/Playlist";
import { spotifyApiService } from "./spotifyApi";
import { aiRecommendationService } from "./aiRecommendations";
import { createLogger } from "../utils/logger";

const logger = createLogger('playlistService');

interface GeneratePlaylistOptions {
  name: string;
  description: string;
  targetEnergy?: number;
  targetValence?: number;
  genres?: string[];
  limit?: number;
  generateSmartTitle?: boolean;
}

class PlaylistService {
  private generateSmartPlaylistName(
    seedTrack: any,
    energy: number,
    valence: number
  ): string {
    const timeOfDay = new Date().getHours();
    const month = new Date().getMonth();
    
    // Time-based prefixes
    let timePrefix = '';
    if (timeOfDay >= 5 && timeOfDay < 12) timePrefix = 'Morning';
    else if (timeOfDay >= 12 && timeOfDay < 17) timePrefix = 'Afternoon';
    else if (timeOfDay >= 17 && timeOfDay < 21) timePrefix = 'Evening';
    else timePrefix = 'Late Night';
    
    // Season-based terms
    let seasonalTerm = '';
    if (month >= 2 && month <= 4) seasonalTerm = 'Spring';
    else if (month >= 5 && month <= 7) seasonalTerm = 'Summer';
    else if (month >= 8 && month <= 10) seasonalTerm = 'Autumn';
    else seasonalTerm = 'Winter';
    
    // Energy and mood-based descriptors
    let moodDescriptor = '';
    let energyDescriptor = '';
    
    if (valence >= 0.7 && energy >= 0.7) {
      moodDescriptor = 'Euphoric';
      energyDescriptor = 'Energy';
    } else if (valence >= 0.7 && energy < 0.7) {
      moodDescriptor = 'Blissful';
      energyDescriptor = 'Vibes';
    } else if (valence < 0.3 && energy >= 0.7) {
      moodDescriptor = 'Intense';
      energyDescriptor = 'Drive';
    } else if (valence < 0.3 && energy < 0.3) {
      moodDescriptor = 'Melancholic';
      energyDescriptor = 'Reflections';
    } else if (energy >= 0.7) {
      moodDescriptor = 'Dynamic';
      energyDescriptor = 'Momentum';
    } else if (energy < 0.3) {
      moodDescriptor = 'Chill';
      energyDescriptor = 'Flow';
    } else {
      moodDescriptor = 'Balanced';
      energyDescriptor = 'Mix';
    }
    
    // Creative name patterns
    const patterns = [
      `${timePrefix} ${energyDescriptor}`,
      `${moodDescriptor} ${seasonalTerm} Session`,
      `${seedTrack.artists?.[0]?.name || 'Artist'}-Inspired ${energyDescriptor}`,
      `${moodDescriptor} ${timePrefix} Playlist`,
      `The ${seedTrack.name} Experience`,
      `${seasonalTerm} ${moodDescriptor} Mix`,
    ];
    
    // Pick a random pattern
    return patterns[Math.floor(Math.random() * patterns.length)];
  }
  
  private generateSmartDescription(
    seedTrack: any,
    energy: number,
    valence: number,
    trackCount: number
  ): string {
    const artistName = seedTrack.artists?.[0]?.name || 'various artists';
    const trackName = seedTrack.name || 'selected track';
    
    let moodText = '';
    if (valence >= 0.7) moodText = 'uplifting and positive';
    else if (valence >= 0.5) moodText = 'balanced and versatile';
    else if (valence >= 0.3) moodText = 'introspective and thoughtful';
    else moodText = 'deep and emotional';
    
    let energyText = '';
    if (energy >= 0.7) energyText = 'high-energy';
    else if (energy >= 0.5) energyText = 'moderately energetic';
    else if (energy >= 0.3) energyText = 'relaxed';
    else energyText = 'calm and peaceful';
    
    const descriptions = [
      `A ${energyText}, ${moodText} journey inspired by "${trackName}" by ${artistName}. ${trackCount} carefully selected tracks.`,
      `Discover ${trackCount} tracks that capture the essence of ${artistName}'s style with a ${moodText} twist.`,
      `AI-curated ${energyText} playlist featuring ${trackCount} songs similar to "${trackName}". Perfect for your ${moodText} moments.`,
      `${trackCount} handpicked tracks blending ${artistName}'s influence with ${energyText}, ${moodText} vibes.`,
      `Experience a ${moodText} collection of ${trackCount} songs, each echoing the spirit of "${trackName}".`,
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }
  async createPlaylistWithTracks(
    accessToken: string,
    userId: string,
    trackIds: string[],
    options: GeneratePlaylistOptions & { seedTracks?: string[] }
  ): Promise<IPlaylist> {
    try {
      // Get seed track details for smart naming if needed
      let seedTrackDetails = null;
      if (options.generateSmartTitle && options.seedTracks && options.seedTracks.length > 0) {
        try {
          const trackId = options.seedTracks[0].replace('spotify:track:', '');
          seedTrackDetails = await spotifyApiService.getTrack(accessToken, trackId);
        } catch (error) {
          logger.debug('Could not fetch seed track details for smart naming');
        }
      }
      
      // Fetch track details from Spotify for each track ID
      const tracks = await Promise.all(
        trackIds.map(async (trackId) => {
          try {
            const track = await spotifyApiService.getTrack(accessToken, trackId);
            return {
              spotifyId: track.id,
              name: track.name || 'Unknown Track',
              artist: track.artists?.[0]?.name || 'Unknown Artist',
              album: track.album?.name || 'Unknown Album',
              duration: track.duration_ms || 0,
              albumArt: track.album?.images?.[0]?.url || null,
              previewUrl: track.preview_url || null,
            };
          } catch (error) {
            logger.error({ error, trackId }, `Failed to fetch track ${trackId}`);
            // Return a placeholder track if fetch fails
            return {
              spotifyId: trackId,
              name: 'Unknown Track',
              artist: 'Unknown Artist',
              album: 'Unknown Album',
              duration: 0,
              albumArt: null,
              previewUrl: null,
            };
          }
        })
      );
      
      // Generate smart name and description if requested
      let playlistName = options.name;
      let playlistDescription = options.description;
      
      if (options.generateSmartTitle && seedTrackDetails) {
        const targetEnergy = options.targetEnergy ?? 0.5;
        const targetValence = options.targetValence ?? 0.5;
        
        // Use AI to generate creative title and description
        try {
          playlistName = await aiRecommendationService.generateAIPlaylistTitle(
            seedTrackDetails,
            targetEnergy,
            targetValence,
            trackIds.length
          );
          
          playlistDescription = await aiRecommendationService.generateAIPlaylistDescription(
            seedTrackDetails,
            tracks,
            targetEnergy,
            targetValence
          );
        } catch (error) {
          logger.info('AI naming failed, using algorithmic fallback');
          playlistName = this.generateSmartPlaylistName(
            seedTrackDetails,
            targetEnergy,
            targetValence
          );
          playlistDescription = this.generateSmartDescription(
            seedTrackDetails,
            targetEnergy,
            targetValence,
            trackIds.length
          );
        }
      }

      // Create playlist in database
      const playlist = await Playlist.create({
        userId,
        name: playlistName,
        description: playlistDescription,
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
      logger.error({ error }, 'Error creating playlist with tracks');
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
      // Get seed track details for smart naming
      let seedTrackDetails = null;
      if (options.generateSmartTitle && seedTracks.length > 0) {
        try {
          const trackId = seedTracks[0].replace('spotify:track:', '');
          seedTrackDetails = await spotifyApiService.getTrack(accessToken, trackId);
        } catch (error) {
          logger.debug('Could not fetch seed track details for smart naming');
        }
      }
      
      // Get AI-based recommendations directly
      const recommendations = await spotifyApiService.getRecommendations(
        accessToken,
        seedTracks.join(","),
        options.limit || 20,
        options.targetEnergy,
        options.targetValence
      );

      // Validate recommendations
      if (!recommendations || !recommendations.tracks || recommendations.tracks.length === 0) {
        throw new Error('No recommendations found. Please try a different seed track.');
      }

      // Use provided values or defaults for energy/valence
      // Default to moderate values if not specified
      const targetEnergy = options.targetEnergy ?? 0.5;
      const targetValence = options.targetValence ?? 0.5;
      
      // Generate smart name and description if requested
      let playlistName = options.name;
      let playlistDescription = options.description;
      
      if (options.generateSmartTitle && seedTrackDetails) {
        // Use AI to generate creative title and description
        try {
          playlistName = await aiRecommendationService.generateAIPlaylistTitle(
            seedTrackDetails,
            targetEnergy,
            targetValence,
            options.limit || 20
          );
          
          // For generation, we need to get the actual tracks first
          // We'll update description after we have the recommendations
        } catch (error) {
          logger.info('AI naming failed, using algorithmic fallback');
          playlistName = this.generateSmartPlaylistName(
            seedTrackDetails,
            targetEnergy,
            targetValence
          );
          playlistDescription = this.generateSmartDescription(
            seedTrackDetails,
            targetEnergy,
            targetValence,
            options.limit || 20
          );
        }
      }

      // Process recommendations into track format
      const tracks = recommendations.tracks.map((track: any) => ({
        spotifyId: track.id,
        name: track.name || 'Unknown Track',
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        album: track.album?.name || 'Unknown Album',
        duration: track.duration_ms || 0,
        albumArt: track.album?.images?.[0]?.url || null,
        previewUrl: track.preview_url || null,
      }));
      
      // Generate AI description now that we have the actual recommendations
      if (options.generateSmartTitle && seedTrackDetails && !playlistDescription) {
        try {
          playlistDescription = await aiRecommendationService.generateAIPlaylistDescription(
            seedTrackDetails,
            recommendations.tracks,
            targetEnergy,
            targetValence
          );
        } catch (error) {
          logger.info('AI description generation failed, using fallback');
          playlistDescription = this.generateSmartDescription(
            seedTrackDetails,
            targetEnergy,
            targetValence,
            tracks.length
          );
        }
      }

      // Create playlist in database
      const playlist = await Playlist.create({
        userId,
        name: playlistName,
        description: playlistDescription,
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
      logger.error({ error }, 'Error generating playlist');
      throw new Error("Failed to generate playlist");
    }
  }

  async getUserPlaylists(userId: string): Promise<IPlaylist[]> {
    try {
      return await Playlist.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error({ error }, 'Error getting user playlists');
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
      logger.error({ error }, 'Error getting playlist');
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
      logger.error({ error }, 'Error updating playlist');
      throw new Error("Failed to update playlist");
    }
  }

  async deletePlaylist(playlistId: string, userId: string): Promise<void> {
    try {
      await Playlist.findOneAndDelete({ _id: playlistId, userId });
    } catch (error) {
      logger.error({ error }, 'Error deleting playlist');
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
      logger.error({ error }, 'Error adding track to playlist');
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
      logger.error({ error }, 'Error removing track from playlist');
      throw new Error("Failed to remove track from playlist");
    }
  }
}

export const playlistService = new PlaylistService();
