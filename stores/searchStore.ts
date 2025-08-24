import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/apiService';
import { Song } from '../constants/MockData';

interface SearchState {
  // Search Data
  searchQuery: string;
  searchResults: Song[];
  searchHistory: string[];
  
  // Recommendations
  topTracks: any[];
  topArtists: any[];
  featuredPlaylists: any[];
  newReleases: any[];
  
  // UI State
  isSearching: boolean;
  isLoadingRecommendations: boolean;
  searchError: string | null;
  recommendationsError: string | null;
  
  // Debounce
  searchTimeout: NodeJS.Timeout | null;
  
  // Actions
  setSearchQuery: (query: string) => void;
  searchTracks: (query: string) => Promise<void>;
  clearSearch: () => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  removeFromHistory: (query: string) => void;
  
  // Recommendations Actions
  fetchRecommendations: () => Promise<void>;
  fetchTopTracks: (timeRange?: string, limit?: number) => Promise<void>;
  fetchTopArtists: (timeRange?: string, limit?: number) => Promise<void>;
  fetchFeaturedPlaylists: (country?: string, limit?: number) => Promise<void>;
  fetchNewReleases: (country?: string, limit?: number) => Promise<void>;
  
  // Utils
  clearErrors: () => void;
  reset: () => void;
}

// Transform Spotify track data to our Song interface
const transformSpotifyTrack = (track: any): Song => {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
    album: track.album?.name || 'Unknown Album',
    duration: Math.floor(track.duration_ms / 1000),
    albumArt: track.album?.images?.[0]?.url || 'https://picsum.photos/seed/spotify/300/300',
    genre: [],
    mood: [],
    energy: track.audio_features?.energy || 0.5,
    popularity: track.popularity || 0,
  };
};

const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      // Initial state
      searchQuery: '',
      searchResults: [],
      searchHistory: [],
      topTracks: [],
      topArtists: [],
      featuredPlaylists: [],
      newReleases: [],
      isSearching: false,
      isLoadingRecommendations: false,
      searchError: null,
      recommendationsError: null,
      searchTimeout: null,

      // Set search query
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      // Search tracks with debouncing handled externally
      searchTracks: async (query) => {
        if (!query.trim()) {
          set({ searchResults: [], searchError: null });
          return;
        }

        set({ isSearching: true, searchError: null });

        try {
          const response = await apiService.searchTracks(query, 20);
          
          if (response.success && response.data?.tracks?.items) {
            const transformedTracks = response.data.tracks.items.map(transformSpotifyTrack);
            set({ searchResults: transformedTracks });
            
            // Add to search history
            get().addToSearchHistory(query);
          } else {
            const errorMessage = typeof response.error === 'string' 
              ? response.error 
              : 'Failed to search tracks';
            set({ searchError: errorMessage, searchResults: [] });
          }
        } catch (error) {
          set({ searchError: 'An error occurred while searching', searchResults: [] });
        } finally {
          set({ isSearching: false });
        }
      },

      // Clear search
      clearSearch: () => {
        set({ searchQuery: '', searchResults: [], searchError: null });
      },

      // Add to search history (max 10 items)
      addToSearchHistory: (query) => {
        set((state) => {
          const trimmedQuery = query.trim().toLowerCase();
          if (!trimmedQuery) return state;
          
          // Remove if already exists and add to front
          const filtered = state.searchHistory.filter(
            (item) => item.toLowerCase() !== trimmedQuery
          );
          const newHistory = [query, ...filtered].slice(0, 10);
          
          return { searchHistory: newHistory };
        });
      },

      // Clear search history
      clearSearchHistory: () => {
        set({ searchHistory: [] });
      },

      // Remove specific item from history
      removeFromHistory: (query) => {
        set((state) => ({
          searchHistory: state.searchHistory.filter(
            (item) => item.toLowerCase() !== query.toLowerCase()
          ),
        }));
      },

      // Fetch all recommendations
      fetchRecommendations: async () => {
        // Prevent multiple simultaneous fetches
        const state = get();
        if (state.isLoadingRecommendations) {
          console.log('Already loading recommendations, skipping');
          return;
        }
        
        set({ isLoadingRecommendations: true, recommendationsError: null });

        try {
          // Fetch all recommendation types in parallel
          const [topTracksRes, topArtistsRes, featuredRes, newReleasesRes] = await Promise.all([
            apiService.getTopTracks('short_term', 10),
            apiService.getTopArtists('short_term', 10),
            apiService.getFeaturedContent('US', 10),
            apiService.getNewReleases('US', 10),
          ]);

          // Check if any of the responses indicate auth failure
          const authError = [topTracksRes, topArtistsRes, featuredRes, newReleasesRes].find(
            res => res.error?.toLowerCase().includes('authentication') || 
                   res.error?.toLowerCase().includes('expired') ||
                   res.error?.toLowerCase().includes('unauthorized')
          );

          if (authError) {
            // Set a special error that components can check
            set({ 
              recommendationsError: 'Session expired',
              topTracks: [],
              topArtists: [],
              featuredPlaylists: [],
              newReleases: [],
            });
            // The apiClient will handle showing the session expired modal
            return;
          }

          set({
            topTracks: topTracksRes.success ? topTracksRes.data?.items || [] : [],
            topArtists: topArtistsRes.success ? topArtistsRes.data?.items || [] : [],
            featuredPlaylists: featuredRes.success ? featuredRes.data?.playlists?.items || [] : [],
            newReleases: newReleasesRes.success ? newReleasesRes.data?.albums?.items || [] : [],
          });
        } catch (error) {
          set({ recommendationsError: 'Failed to load recommendations' });
        } finally {
          set({ isLoadingRecommendations: false });
        }
      },

      // Fetch top tracks
      fetchTopTracks: async (timeRange = 'medium_term', limit = 20) => {
        try {
          const response = await apiService.getTopTracks(timeRange, limit);
          if (response.success && response.data?.items) {
            set({ topTracks: response.data.items });
          }
        } catch (error) {
          console.error('Failed to fetch top tracks:', error);
        }
      },

      // Fetch top artists
      fetchTopArtists: async (timeRange = 'medium_term', limit = 20) => {
        try {
          const response = await apiService.getTopArtists(timeRange, limit);
          if (response.success && response.data?.items) {
            set({ topArtists: response.data.items });
          }
        } catch (error) {
          console.error('Failed to fetch top artists:', error);
        }
      },

      // Fetch featured playlists
      fetchFeaturedPlaylists: async (country = 'US', limit = 20) => {
        try {
          const response = await apiService.getFeaturedContent(country, limit);
          if (response.success && response.data?.playlists?.items) {
            set({ featuredPlaylists: response.data.playlists.items });
          }
        } catch (error) {
          console.error('Failed to fetch featured playlists:', error);
        }
      },

      // Fetch new releases
      fetchNewReleases: async (country = 'US', limit = 20) => {
        try {
          const response = await apiService.getNewReleases(country, limit);
          if (response.success && response.data?.albums?.items) {
            set({ newReleases: response.data.albums.items });
          }
        } catch (error) {
          console.error('Failed to fetch new releases:', error);
        }
      },

      // Clear errors
      clearErrors: () => {
        set({ searchError: null, recommendationsError: null });
      },

      // Reset store
      reset: () => {
        set({
          searchQuery: '',
          searchResults: [],
          topTracks: [],
          topArtists: [],
          featuredPlaylists: [],
          newReleases: [],
          isSearching: false,
          isLoadingRecommendations: false,
          searchError: null,
          recommendationsError: null,
          searchTimeout: null,
        });
      },
    }),
    {
      name: 'search-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist search history and cached recommendations
        searchHistory: state.searchHistory,
        topTracks: state.topTracks.slice(0, 5),
        topArtists: state.topArtists.slice(0, 5),
      }),
    }
  )
);

export default useSearchStore;