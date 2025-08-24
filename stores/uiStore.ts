import { create } from 'zustand';

interface ModalState {
  visible: boolean;
  data: any;
}

interface ConfirmationModalState {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  destructive?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showLoadingOnConfirm?: boolean;
}

interface UIState {
  // Modal States
  playlistPreviewModal: ModalState;
  trackPreviewModal: ModalState;
  deleteConfirmModal: ModalState;
  sessionExpiredModal: ModalState;
  confirmationModal: ConfirmationModalState;
  
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
  showSessionExpiredModal: () => void;
  hideSessionExpiredModal: () => void;
  showConfirmation: (config: Omit<ConfirmationModalState, 'visible'>) => void;
  hideConfirmation: () => void;
  
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
  sessionExpiredModal: { visible: false, data: null },
  confirmationModal: {
    visible: false,
    title: '',
    message: '',
    icon: 'help-outline',
    iconColor: undefined,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonColor: undefined,
    destructive: false,
    onConfirm: undefined,
    onCancel: undefined,
    showLoadingOnConfirm: false,
  },
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

  showSessionExpiredModal: () => {
    set({
      sessionExpiredModal: { visible: true, data: null },
      // Hide any existing toasts when showing session modal
      toast: { ...get().toast, visible: false },
    });
  },

  hideSessionExpiredModal: () => {
    set({
      sessionExpiredModal: { visible: false, data: null },
    });
  },

  showConfirmation: (config) => {
    set({
      confirmationModal: {
        ...config,
        visible: true,
      },
    });
  },

  hideConfirmation: () => {
    set({
      confirmationModal: {
        ...get().confirmationModal,
        visible: false,
      },
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
      sessionExpiredModal: { visible: false, data: null },
      confirmationModal: {
        visible: false,
        title: '',
        message: '',
        icon: 'help-outline',
        iconColor: undefined,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        confirmButtonColor: undefined,
        destructive: false,
        onConfirm: undefined,
        onCancel: undefined,
        showLoadingOnConfirm: false,
      },
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