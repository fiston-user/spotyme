import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { Playlist, Song } from '../constants/MockData';

interface PlaylistState {
  // Data
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  generatedTracks: Song[];
  selectedTracks: string[];
  
  // UI State
  isLoading: boolean;
  isRefreshing: boolean;
  isGenerating: boolean;
  error: string | null;
  
  // Playlist Generation Parameters
  generationParams: {
    seedTracks: string[];
    name: string;
    description: string;
    limit: number;
    targetEnergy?: number;
    targetValence?: number;
    generateSmartTitle: boolean;
  };
  
  // Actions
  fetchPlaylists: () => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  fetchPlaylist: (playlistId: string) => Promise<void>;
  createPlaylist: (name: string, description: string, trackUris: string[]) => Promise<boolean>;
  deletePlaylist: (playlistId: string) => Promise<boolean>;
  exportToSpotify: (playlistId: string) => Promise<boolean>;
  
  // Generation Actions
  generatePlaylist: (params: {
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
  }) => Promise<boolean>;
  setGenerationParams: (params: Partial<PlaylistState['generationParams']>) => void;
  setSelectedTracks: (tracks: string[]) => void;
  toggleTrackSelection: (trackId: string) => void;
  clearGeneratedTracks: () => void;
  
  // Utils
  clearError: () => void;
  reset: () => void;
}

// Transform backend playlist data to match our Playlist interface
const transformPlaylist = (backendPlaylist: any): Playlist => {
  return {
    id: backendPlaylist._id || backendPlaylist.id,
    name: backendPlaylist.name,
    description: backendPlaylist.description || '',
    songs: backendPlaylist.tracks || [],
    coverArt: backendPlaylist.tracks?.[0]?.albumArt || 'https://picsum.photos/seed/playlist/300/300',
    createdAt: new Date(backendPlaylist.createdAt),
    totalDuration: backendPlaylist.totalDuration || 0,
  };
};

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

const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      // Initial state
      playlists: [],
      currentPlaylist: null,
      generatedTracks: [],
      selectedTracks: [],
      isLoading: false,
      isRefreshing: false,
      isGenerating: false,
      error: null,
      generationParams: {
        seedTracks: [],
        name: '',
        description: '',
        limit: 20,
        generateSmartTitle: false,
      },

      // Fetch all playlists
      fetchPlaylists: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.getUserPlaylists();
          
          if (response.success && response.data && Array.isArray(response.data)) {
            const transformedPlaylists = response.data.map(transformPlaylist);
            set({ playlists: transformedPlaylists });
          } else {
            set({ error: response.error || 'Failed to load playlists' });
          }
        } catch (error) {
          set({ error: 'Failed to load playlists' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh playlists (pull-to-refresh)
      refreshPlaylists: async () => {
        set({ isRefreshing: true, error: null });
        try {
          const response = await apiService.getUserPlaylists();
          
          if (response.success && response.data && Array.isArray(response.data)) {
            const transformedPlaylists = response.data.map(transformPlaylist);
            set({ playlists: transformedPlaylists });
          }
        } catch (error) {
          // Silent fail for refresh
        } finally {
          set({ isRefreshing: false });
        }
      },

      // Fetch single playlist details
      fetchPlaylist: async (playlistId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.getPlaylist(playlistId);
          
          if (response.success && response.data) {
            const transformedPlaylist = transformPlaylist(response.data);
            set({ currentPlaylist: transformedPlaylist });
            
            // Update in playlists array if exists
            set((state) => ({
              playlists: state.playlists.map((p) =>
                p.id === playlistId ? transformedPlaylist : p
              ),
            }));
          } else {
            set({ error: response.error || 'Failed to load playlist' });
          }
        } catch (error) {
          set({ error: 'Failed to load playlist' });
        } finally {
          set({ isLoading: false });
        }
      },

      // Create a new playlist
      createPlaylist: async (name: string, description: string, trackUris: string[]) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.createPlaylist(name, description, trackUris);
          
          if (response.success && response.data) {
            const newPlaylist = transformPlaylist(response.data);
            
            // Optimistically add to playlists
            set((state) => ({
              playlists: [newPlaylist, ...state.playlists],
              currentPlaylist: newPlaylist,
            }));
            
            return true;
          } else {
            set({ error: response.error || 'Failed to create playlist' });
            return false;
          }
        } catch (error) {
          set({ error: 'Failed to create playlist' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // Delete a playlist
      deletePlaylist: async (playlistId: string) => {
        // Optimistic update
        const previousPlaylists = get().playlists;
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
        }));

        try {
          const response = await apiService.deletePlaylist(playlistId);
          
          if (!response.success) {
            // Revert on failure
            set({ playlists: previousPlaylists, error: response.error });
            return false;
          }
          return true;
        } catch (error) {
          // Revert on failure
          set({ playlists: previousPlaylists, error: 'Failed to delete playlist' });
          return false;
        }
      },

      // Export playlist to Spotify
      exportToSpotify: async (playlistId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.exportPlaylistToSpotify(playlistId);
          
          if (response.success) {
            // Update playlist status if needed
            await get().fetchPlaylist(playlistId);
            return true;
          } else {
            set({ error: response.error || 'Failed to export to Spotify' });
            return false;
          }
        } catch (error) {
          set({ error: 'Failed to export to Spotify' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // Generate a playlist
      generatePlaylist: async (params) => {
        set({ isGenerating: true, error: null });
        try {
          const response = await apiService.generatePlaylist(params);
          
          if (response.success && response.data) {
            const data = response.data as any;
            const newPlaylist = transformPlaylist(data.playlist || data);
            const generatedTracks = (data.tracks && Array.isArray(data.tracks)) 
              ? data.tracks.map(transformSpotifyTrack) 
              : [];
            
            // Add to playlists and set as current
            set((state) => ({
              playlists: [newPlaylist, ...state.playlists],
              currentPlaylist: newPlaylist,
              generatedTracks,
              selectedTracks: [],
            }));
            
            return true;
          } else {
            set({ error: response.error || 'Failed to generate playlist' });
            return false;
          }
        } catch (error) {
          set({ error: 'Failed to generate playlist' });
          return false;
        } finally {
          set({ isGenerating: false });
        }
      },

      // Set generation parameters
      setGenerationParams: (params) => {
        set((state) => ({
          generationParams: { ...state.generationParams, ...params },
        }));
      },

      // Set selected tracks
      setSelectedTracks: (tracks) => {
        set({ selectedTracks: tracks });
      },

      // Toggle track selection
      toggleTrackSelection: (trackId) => {
        set((state) => ({
          selectedTracks: state.selectedTracks.includes(trackId)
            ? state.selectedTracks.filter((id) => id !== trackId)
            : [...state.selectedTracks, trackId],
        }));
      },

      // Clear generated tracks
      clearGeneratedTracks: () => {
        set({ generatedTracks: [], selectedTracks: [] });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        set({
          playlists: [],
          currentPlaylist: null,
          generatedTracks: [],
          selectedTracks: [],
          isLoading: false,
          isRefreshing: false,
          isGenerating: false,
          error: null,
          generationParams: {
            seedTracks: [],
            name: '',
            description: '',
            limit: 20,
            generateSmartTitle: false,
          },
        });
      },
    }),
    {
      name: 'playlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist essential data
        playlists: state.playlists.slice(0, 10), // Cache last 10 playlists
        generationParams: state.generationParams,
      }),
    }
  )
);

export default usePlaylistStore;