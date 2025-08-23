import { create } from 'zustand';

interface ModalState {
  visible: boolean;
  data: any;
}

interface UIState {
  // Modal States
  playlistPreviewModal: ModalState;
  trackPreviewModal: ModalState;
  deleteConfirmModal: ModalState;
  
  // Loading States
  globalLoading: boolean;
  globalLoadingMessage: string;
  
  // Error States
  globalError: string | null;
  
  // Toast/Notification State
  toast: {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    action?: {
      label: string;
      onPress: () => void;
    };
  };
  
  // Actions - Modals
  showPlaylistPreview: (playlist: any) => void;
  hidePlaylistPreview: () => void;
  showTrackPreview: (track: any) => void;
  hideTrackPreview: () => void;
  showDeleteConfirm: (data: any) => void;
  hideDeleteConfirm: () => void;
  
  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Actions - Error
  setGlobalError: (error: string | null) => void;
  clearGlobalError: () => void;
  
  // Actions - Toast
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number, action?: { label: string; onPress: () => void }) => void;
  hideToast: () => void;
  
  // Utils
  reset: () => void;
}

const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  playlistPreviewModal: { visible: false, data: null },
  trackPreviewModal: { visible: false, data: null },
  deleteConfirmModal: { visible: false, data: null },
  globalLoading: false,
  globalLoadingMessage: '',
  globalError: null,
  toast: {
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
    action: undefined,
  },

  // Modal Actions
  showPlaylistPreview: (playlist) => {
    set({
      playlistPreviewModal: { visible: true, data: playlist },
    });
  },

  hidePlaylistPreview: () => {
    set({
      playlistPreviewModal: { visible: false, data: null },
    });
  },

  showTrackPreview: (track) => {
    set({
      trackPreviewModal: { visible: true, data: track },
    });
  },

  hideTrackPreview: () => {
    set({
      trackPreviewModal: { visible: false, data: null },
    });
  },

  showDeleteConfirm: (data) => {
    set({
      deleteConfirmModal: { visible: true, data },
    });
  },

  hideDeleteConfirm: () => {
    set({
      deleteConfirmModal: { visible: false, data: null },
    });
  },

  // Loading Actions
  setGlobalLoading: (loading, message = '') => {
    set({
      globalLoading: loading,
      globalLoadingMessage: message,
    });
  },

  // Error Actions
  setGlobalError: (error) => {
    set({ globalError: error });
    
    // Auto show toast for errors
    if (error) {
      get().showToast(error, 'error');
    }
  },

  clearGlobalError: () => {
    set({ globalError: null });
  },

  // Toast Actions
  showToast: (message, type = 'info', duration = 3000, action) => {
    set({
      toast: {
        visible: true,
        message,
        type,
        duration,
        action,
      },
    });

    // Auto hide after duration
    if (duration > 0) {
      setTimeout(() => {
        get().hideToast();
      }, duration);
    }
  },

  hideToast: () => {
    set({
      toast: {
        ...get().toast,
        visible: false,
      },
    });
  },

  // Reset
  reset: () => {
    set({
      playlistPreviewModal: { visible: false, data: null },
      trackPreviewModal: { visible: false, data: null },
      deleteConfirmModal: { visible: false, data: null },
      globalLoading: false,
      globalLoadingMessage: '',
      globalError: null,
      toast: {
        visible: false,
        message: '',
        type: 'info',
        duration: 3000,
      },
    });
  },
}));

export default useUIStore;