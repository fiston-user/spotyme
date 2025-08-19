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

  async generateAIPlaylistTitle(
    seedTrack: any,
    targetEnergy?: number,
    targetValence?: number,
    trackCount: number = 20
  ): Promise<string> {
    if (!this.openai) {
      // Fallback to algorithmic generation if no OpenAI
      return this.generateFallbackTitle(seedTrack, targetEnergy, targetValence);
    }

    try {
      const energyDesc = targetEnergy 
        ? targetEnergy > 0.7 ? 'high-energy' 
        : targetEnergy < 0.3 ? 'chill' 
        : 'balanced energy'
        : 'mixed energy';
      
      const moodDesc = targetValence
        ? targetValence > 0.7 ? 'uplifting'
        : targetValence < 0.3 ? 'melancholic'
        : 'emotional'
        : 'diverse mood';

      const prompt = `Create a creative, catchy playlist title for a ${trackCount}-track collection inspired by "${seedTrack.name}" by ${seedTrack.artists[0].name}.
      The playlist has ${energyDesc} and ${moodDesc} vibes.
      
      Requirements:
      - Maximum 5 words
      - Creative and memorable
      - Avoid generic words like "playlist", "mix", "collection"
      - Capture the essence of the music
      
      Return ONLY the title, nothing else.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a creative music curator who creates memorable playlist titles. Return only the title text, no quotes, no explanation."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 50,
      });

      const title = completion.choices[0].message.content?.trim() || this.generateFallbackTitle(seedTrack, targetEnergy, targetValence);
      return title;
    } catch (error) {
      console.error('AI title generation failed:', error);
      return this.generateFallbackTitle(seedTrack, targetEnergy, targetValence);
    }
  }

  async generateAIPlaylistDescription(
    seedTrack: any,
    recommendations: any[],
    targetEnergy?: number,
    targetValence?: number
  ): Promise<string> {
    if (!this.openai) {
      return this.generateFallbackDescription(seedTrack, recommendations.length, targetEnergy, targetValence);
    }

    try {
      // Get a few artist names from recommendations for context
      const featuredArtists = [...new Set(recommendations.slice(0, 5).map(t => t.artists?.[0]?.name || 'Unknown'))]
        .filter(a => a !== 'Unknown')
        .slice(0, 3)
        .join(', ');

      const prompt = `Write a compelling 1-2 sentence description for a playlist with ${recommendations.length} tracks inspired by "${seedTrack.name}" by ${seedTrack.artists[0].name}.
      ${featuredArtists ? `Features music similar to: ${featuredArtists}.` : ''}
      Energy level: ${targetEnergy ? Math.round(targetEnergy * 100) : 50}%
      Mood: ${targetValence ? Math.round(targetValence * 100) : 50}% positive
      
      Make it enticing and describe the musical journey. Return only the description text.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are a music journalist writing playlist descriptions. Be concise, evocative, and focus on the listening experience."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 100,
      });

      const description = completion.choices[0].message.content?.trim() || 
        this.generateFallbackDescription(seedTrack, recommendations.length, targetEnergy, targetValence);
      return description;
    } catch (error) {
      console.error('AI description generation failed:', error);
      return this.generateFallbackDescription(seedTrack, recommendations.length, targetEnergy, targetValence);
    }
  }

  private generateFallbackTitle(seedTrack: any, targetEnergy?: number, targetValence?: number): string {
    const artist = seedTrack.artists?.[0]?.name || 'Artist';
    const energy = targetEnergy || 0.5;
    const valence = targetValence || 0.5;
    
    if (energy > 0.7 && valence > 0.7) return `${artist}'s Happy Energy`;
    if (energy > 0.7 && valence < 0.3) return `Dark ${artist} Power`;
    if (energy < 0.3 && valence > 0.7) return `${artist} Chill Bliss`;
    if (energy < 0.3 && valence < 0.3) return `${artist} Midnight Mood`;
    return `${artist} Inspired Journey`;
  }

  private generateFallbackDescription(seedTrack: any, trackCount: number, targetEnergy?: number, targetValence?: number): string {
    const energy = targetEnergy || 0.5;
    const valence = targetValence || 0.5;
    const moodText = valence > 0.6 ? 'uplifting' : valence < 0.4 ? 'introspective' : 'dynamic';
    const energyText = energy > 0.6 ? 'energetic' : energy < 0.4 ? 'relaxed' : 'balanced';
    
    return `${trackCount} ${energyText} and ${moodText} tracks inspired by "${seedTrack.name}" by ${seedTrack.artists?.[0]?.name || 'various artists'}. A carefully curated musical journey.`;
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
      const artistName = seedTrack.artists[0].name;
      
      // Strategy 1: Get more tracks by the same artist (30% of recommendations)
      const artistLimit = Math.ceil(limit * 0.3);
      try {
        const artistSearch = await spotifyApiService.search(
          accessToken,
          `artist:"${artistName}"`,
          'track',
          artistLimit * 2 // Get more to filter
        );
        
        if (artistSearch.tracks?.items) {
          // Filter out the seed track and sort by popularity
          const artistTracks = artistSearch.tracks.items
            .filter((t: any) => t.id !== seedTrack.id)
            .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, artistLimit);
          tracks.push(...artistTracks);
        }
      } catch (err) {
        console.log('Artist search failed:', err);
      }

      // Strategy 2: Search for related artists (30% of recommendations)
      const relatedLimit = Math.ceil(limit * 0.3);
      try {
        // Search for tracks that might be by related artists
        const genreSearch = await this.getGenreBasedTracks(
          accessToken,
          seedTrack,
          relatedLimit
        );
        tracks.push(...genreSearch);
      } catch (err) {
        console.log('Genre search failed:', err);
      }

      // Strategy 3: Mood-based search (40% of recommendations)
      const moodLimit = Math.ceil(limit * 0.4);
      const moodSearchTerms = this.buildMoodSearchTerms(targetEnergy, targetValence);
      
      for (const term of moodSearchTerms.slice(0, 3)) {
        try {
          const moodSearch = await spotifyApiService.search(
            accessToken,
            term,
            'track',
            Math.ceil(moodLimit / moodSearchTerms.length)
          );
          
          if (moodSearch.tracks?.items) {
            // Filter for variety - avoid too many tracks from same artist
            const diverseTracks = this.diversifyTracks(
              moodSearch.tracks.items,
              tracks
            );
            tracks.push(...diverseTracks);
          }
        } catch (searchError) {
          console.log(`Mood search failed for term: ${term}`);
        }
      }

      // Remove duplicates and ensure we have enough tracks
      const uniqueTracks = Array.from(
        new Map(tracks.map((t: any) => [t.id, t])).values()
      );

      // If we don't have enough, add some popular tracks
      if (uniqueTracks.length < limit) {
        const needed = limit - uniqueTracks.length;
        try {
          const popularSearch = await spotifyApiService.search(
            accessToken,
            'year:2024',
            'track',
            needed
          );
          if (popularSearch.tracks?.items) {
            uniqueTracks.push(...popularSearch.tracks.items.slice(0, needed));
          }
        } catch (err) {
          console.log('Popular tracks fallback failed');
        }
      }

      return { tracks: uniqueTracks.slice(0, limit), seeds: [] };
    } catch (error) {
      console.error('Search-based recommendation error:', error);
      throw error;
    }
  }

  private buildMoodSearchTerms(targetEnergy?: number, targetValence?: number): string[] {
    const terms = [];
    
    // Energy-based terms
    if (targetEnergy !== undefined) {
      if (targetEnergy > 0.8) {
        terms.push('energetic', 'upbeat', 'party', 'dance');
      } else if (targetEnergy > 0.6) {
        terms.push('groove', 'rhythm', 'beat');
      } else if (targetEnergy > 0.4) {
        terms.push('moderate', 'steady');
      } else if (targetEnergy > 0.2) {
        terms.push('mellow', 'smooth', 'laid back');
      } else {
        terms.push('ambient', 'chill', 'relaxing', 'calm');
      }
    }
    
    // Valence-based terms
    if (targetValence !== undefined) {
      if (targetValence > 0.8) {
        terms.push('happy', 'joyful', 'uplifting');
      } else if (targetValence > 0.6) {
        terms.push('positive', 'feel good');
      } else if (targetValence > 0.4) {
        terms.push('neutral mood');
      } else if (targetValence > 0.2) {
        terms.push('emotional', 'introspective');
      } else {
        terms.push('melancholic', 'sad', 'moody');
      }
    }
    
    // Default terms if none specified
    if (terms.length === 0) {
      terms.push('popular', 'trending', 'hits');
    }
    
    return terms;
  }

  private async getGenreBasedTracks(
    accessToken: string,
    seedTrack: any,
    limit: number
  ): Promise<any[]> {
    const tracks = [];
    
    // Try to infer genre from track/artist name
    const searchBase = seedTrack.name.toLowerCase();
    const artistLower = seedTrack.artists[0].name.toLowerCase();
    
    let genreHints = [];
    
    // Simple genre detection based on common patterns
    if (searchBase.includes('rock') || artistLower.includes('rock')) {
      genreHints.push('rock', 'alternative');
    } else if (searchBase.includes('pop') || artistLower.includes('pop')) {
      genreHints.push('pop', 'top 40');
    } else if (searchBase.includes('rap') || searchBase.includes('hip')) {
      genreHints.push('hip hop', 'rap');
    } else if (searchBase.includes('jazz')) {
      genreHints.push('jazz', 'blues');
    } else if (searchBase.includes('electro') || searchBase.includes('edm')) {
      genreHints.push('electronic', 'dance');
    } else if (searchBase.includes('country')) {
      genreHints.push('country', 'folk');
    } else if (searchBase.includes('classical')) {
      genreHints.push('classical', 'instrumental');
    } else {
      // Default genres
      genreHints = ['pop', 'rock', 'indie', 'alternative'];
    }
    
    // Search for tracks in similar genres
    for (const genre of genreHints.slice(0, 2)) {
      try {
        const genreSearch = await spotifyApiService.search(
          accessToken,
          `genre:"${genre}"`,
          'track',
          Math.ceil(limit / genreHints.length)
        );
        
        if (genreSearch.tracks?.items) {
          tracks.push(...genreSearch.tracks.items);
        }
      } catch (err) {
        console.log(`Genre search failed for: ${genre}`);
      }
    }
    
    return tracks;
  }

  private diversifyTracks(newTracks: any[], existingTracks: any[]): any[] {
    const artistCount = new Map();
    
    // Count existing artists
    existingTracks.forEach(track => {
      const artistId = track.artists?.[0]?.id;
      if (artistId) {
        artistCount.set(artistId, (artistCount.get(artistId) || 0) + 1);
      }
    });
    
    // Filter new tracks to avoid too many from same artist
    const diverse = [];
    for (const track of newTracks) {
      const artistId = track.artists?.[0]?.id;
      if (!artistId || (artistCount.get(artistId) || 0) < 3) {
        diverse.push(track);
        if (artistId) {
          artistCount.set(artistId, (artistCount.get(artistId) || 0) + 1);
        }
      }
    }
    
    return diverse;
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