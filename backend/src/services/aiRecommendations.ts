import OpenAI from 'openai';
import { spotifyApiService } from './spotifyApi';

class AIRecommendationService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async getAIRecommendations(
    accessToken: string,
    seedTrack: any,
    targetEnergy?: number,
    targetValence?: number,
    limit: number = 20
  ): Promise<any> {
    try {
      // First, try using OpenAI if available
      if (this.openai) {
        return await this.getOpenAIRecommendations(
          accessToken,
          seedTrack,
          targetEnergy,
          targetValence,
          limit
        );
      }
      
      // Fallback to search-based recommendations
      return await this.getSearchBasedRecommendations(
        accessToken,
        seedTrack,
        targetEnergy,
        targetValence,
        limit
      );
    } catch (error) {
      console.error('AI Recommendations error:', error);
      // Final fallback: return popular tracks
      return await this.getPopularTracks(accessToken, limit);
    }
  }

  private async getOpenAIRecommendations(
    accessToken: string,
    seedTrack: any,
    targetEnergy?: number,
    targetValence?: number,
    limit: number = 20
  ): Promise<any> {
    try {
      const energyDescription = targetEnergy 
        ? targetEnergy > 0.7 ? 'high-energy, upbeat' 
        : targetEnergy < 0.3 ? 'calm, relaxing' 
        : 'moderate energy'
        : 'varied energy';
      
      const moodDescription = targetValence
        ? targetValence > 0.7 ? 'happy, positive'
        : targetValence < 0.3 ? 'melancholic, introspective'
        : 'balanced mood'
        : 'varied mood';

      const prompt = `Based on the song "${seedTrack.name}" by ${seedTrack.artists[0].name}, suggest ${limit} similar songs that match these criteria:
      - Energy: ${energyDescription}
      - Mood: ${moodDescription}
      - Similar genre and style
      
      Return ONLY a JSON array of songs with this exact format, no additional text:
      [{"title": "Song Name", "artist": "Artist Name"}]`;

      const completion = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a music recommendation expert. Return only valid JSON arrays of songs that exist on Spotify."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0].message.content || '[]';
      
      // Parse the AI response
      let suggestedSongs;
      try {
        suggestedSongs = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        throw new Error('Invalid AI response format');
      }

      // Search for each suggested song on Spotify
      const tracks = [];
      for (const song of suggestedSongs.slice(0, limit)) {
        try {
          const searchQuery = `track:${song.title} artist:${song.artist}`;
          const searchResults = await spotifyApiService.search(
            accessToken,
            searchQuery,
            'track',
            1
          );
          
          if (searchResults.tracks?.items?.length > 0) {
            tracks.push(searchResults.tracks.items[0]);
          }
        } catch (searchError) {
          console.log(`Could not find: ${song.title} by ${song.artist}`);
        }
      }

      // If we didn't find enough tracks, add some based on artist
      if (tracks.length < limit / 2) {
        return await this.getSearchBasedRecommendations(
          accessToken,
          seedTrack,
          targetEnergy,
          targetValence,
          limit
        );
      }

      return { tracks, seeds: [] };
    } catch (error) {
      console.error('OpenAI recommendation error:', error);
      throw error;
    }
  }

  private async getSearchBasedRecommendations(
    accessToken: string,
    seedTrack: any,
    targetEnergy?: number,
    targetValence?: number,
    limit: number = 20
  ): Promise<any> {
    try {
      const tracks = [];
      
      // Search for tracks by the same artist
      const artistName = seedTrack.artists[0].name;
      const artistSearch = await spotifyApiService.search(
        accessToken,
        `artist:${artistName}`,
        'track',
        limit / 2
      );
      
      if (artistSearch.tracks?.items) {
        // Filter out the seed track itself
        const artistTracks = artistSearch.tracks.items.filter(
          (t: any) => t.id !== seedTrack.id
        );
        tracks.push(...artistTracks.slice(0, limit / 2));
      }

      // Search for tracks with similar characteristics
      const genres = ['pop', 'rock', 'indie', 'electronic', 'hip-hop', 'r&b', 'alternative'];
      const searchTerms = [];
      
      // Build search based on energy/mood
      if (targetEnergy && targetEnergy > 0.7) {
        searchTerms.push('upbeat', 'energetic', 'dance');
      } else if (targetEnergy && targetEnergy < 0.3) {
        searchTerms.push('chill', 'acoustic', 'calm');
      }
      
      if (targetValence && targetValence > 0.7) {
        searchTerms.push('happy', 'feel good');
      } else if (targetValence && targetValence < 0.3) {
        searchTerms.push('sad', 'melancholic');
      }

      // Add a random genre if no search terms
      if (searchTerms.length === 0) {
        searchTerms.push(genres[Math.floor(Math.random() * genres.length)]);
      }

      // Search with the terms
      for (const term of searchTerms.slice(0, 2)) {
        try {
          const termSearch = await spotifyApiService.search(
            accessToken,
            term,
            'track',
            Math.ceil(limit / searchTerms.length)
          );
          
          if (termSearch.tracks?.items) {
            tracks.push(...termSearch.tracks.items);
          }
        } catch (searchError) {
          console.log(`Search failed for term: ${term}`);
        }
      }

      // Remove duplicates and limit results
      const uniqueTracks = Array.from(
        new Map(tracks.map((t: any) => [t.id, t])).values()
      ).slice(0, limit);

      return { tracks: uniqueTracks, seeds: [] };
    } catch (error) {
      console.error('Search-based recommendation error:', error);
      throw error;
    }
  }

  private async getPopularTracks(accessToken: string, limit: number): Promise<any> {
    try {
      // Get today's top hits or popular tracks
      const popularSearch = await spotifyApiService.search(
        accessToken,
        'year:2024 tag:hipster',
        'track',
        limit
      );
      
      if (popularSearch.tracks?.items) {
        return { tracks: popularSearch.tracks.items, seeds: [] };
      }

      // Final fallback: just search for "top hits"
      const fallbackSearch = await spotifyApiService.search(
        accessToken,
        'top hits',
        'track',
        limit
      );
      
      return { 
        tracks: fallbackSearch.tracks?.items || [], 
        seeds: [] 
      };
    } catch (error) {
      console.error('Popular tracks fallback error:', error);
      return { tracks: [], seeds: [] };
    }
  }
}

export const aiRecommendationService = new AIRecommendationService();