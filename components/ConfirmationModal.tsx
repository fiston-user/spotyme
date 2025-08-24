import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';

const { width: screenWidth } = Dimensions.get('window');

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  showLoadingOnConfirm?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  icon = 'help-outline',
  iconColor,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor,
  destructive = false,
  onConfirm,
  onCancel,
  showLoadingOnConfirm = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [isLoading, setIsLoading] = React.useState(false);

  // Determine colors based on destructive flag
  const finalIconColor = iconColor || (destructive ? Colors.danger : Colors.primary);
  const finalButtonColor = confirmButtonColor || (destructive ? Colors.danger : Colors.primary);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (showLoadingOnConfirm) {
      setIsLoading(true);
      try {
        await onConfirm();
      } finally {
        setIsLoading(false);
      }
    } else {
      onConfirm();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Background Gradient */}
          <LinearGradient
            colors={
              destructive 
                ? ['rgba(226, 33, 52, 0.08)', 'rgba(18, 18, 18, 0.98)']
                : ['rgba(29, 185, 84, 0.08)', 'rgba(18, 18, 18, 0.98)']
            }
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={styles.content}>
            {/* Icon with Pulse Animation */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: `${finalIconColor}15` }]}>
                <View style={[styles.iconInnerCircle, { backgroundColor: `${finalIconColor}25` }]}>
                  <MaterialIcons name={icon} size={32} color={finalIconColor} />
                </View>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            
            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: finalButtonColor },
                  isLoading && styles.disabledButton
                ]}
                onPress={handleConfirm}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <MaterialIcons name="hourglass-empty" size={18} color={Colors.background} />
                    <Text style={styles.confirmButtonText}>Processing...</Text>
                  </View>
                ) : (
                  <>
                    {destructive && (
                      <MaterialIcons name="warning" size={18} color={Colors.background} />
                    )}
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    width: screenWidth * 0.85,
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    backgroundColor: 'rgba(28, 28, 30, 0.98)',
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInnerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});

// Export a hook for easy usage with UIStore
export const useConfirmation = () => {
  const showConfirmation = (props: Omit<ConfirmationModalProps, 'visible'>) => {
    // This will be implemented in UIStore
    console.log('Show confirmation:', props);
  };

  return { showConfirmation };
};