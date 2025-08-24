import useUIStore from '../stores/uiStore';

interface UseConfirmationOptions {
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  destructive?: boolean;
  showLoadingOnConfirm?: boolean;
}

/**
 * Hook to easily show confirmation dialogs throughout the app
 * 
 * @example
 * const confirm = useConfirmation();
 * 
 * const handleDelete = () => {
 *   confirm({
 *     title: "Delete Playlist?",
 *     message: "This action cannot be undone.",
 *     destructive: true,
 *     onConfirm: async () => {
 *       await deletePlaylist();
 *     }
 *   });
 * };
 */
export const useConfirmation = () => {
  const { showConfirmation, hideConfirmation } = useUIStore();

  const confirm = (options: UseConfirmationOptions & {
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => {
    showConfirmation({
      ...options,
      onCancel: () => {
        options.onCancel?.();
        hideConfirmation();
      },
      onConfirm: async () => {
        if (options.showLoadingOnConfirm !== false) {
          await options.onConfirm();
          hideConfirmation();
        } else {
          options.onConfirm();
          hideConfirmation();
        }
      },
    });
  };

  return confirm;
};

// Common confirmation presets
export const confirmationPresets = {
  delete: {
    icon: 'delete',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    destructive: true,
    showLoadingOnConfirm: true,
  },
  logout: {
    icon: 'logout',
    confirmText: 'Logout',
    cancelText: 'Cancel',
    destructive: true,
    showLoadingOnConfirm: true,
  },
  save: {
    icon: 'save',
    confirmText: 'Save',
    cancelText: 'Cancel',
    destructive: false,
    showLoadingOnConfirm: true,
  },
  discard: {
    icon: 'cancel',
    confirmText: 'Discard',
    cancelText: 'Keep',
    destructive: true,
    showLoadingOnConfirm: false,
  },
  export: {
    icon: 'share',
    confirmText: 'Export',
    cancelText: 'Cancel',
    destructive: false,
    showLoadingOnConfirm: true,
  },
};