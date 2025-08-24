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
import { useRouter } from 'expo-router';
import useAuthStore from '../stores/authStore';
import useUIStore from '../stores/uiStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const SessionExpiredModal: React.FC = () => {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { sessionExpiredModal, hideSessionExpiredModal } = useUIStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (sessionExpiredModal.visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [sessionExpiredModal.visible]);

  const handleReauthenticate = async () => {
    // Clear auth and navigate to login
    await logout();
    hideSessionExpiredModal();
    router.replace('/login');
  };

  const handleCancel = () => {
    // Just hide the modal, user can continue browsing limited features
    hideSessionExpiredModal();
  };

  if (!sessionExpiredModal.visible) return null;

  return (
    <Modal
      visible={sessionExpiredModal.visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(29, 185, 84, 0.1)', 'rgba(18, 18, 18, 0.95)']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={Colors.gradients.orange as any}
                style={styles.iconGradient}
              >
                <MaterialIcons name="access-time" size={48} color={Colors.text} />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>Session Expired</Text>
            
            {/* Message */}
            <Text style={styles.message}>
              Your Spotify session has expired for security reasons. Please log in again to continue enjoying your music.
            </Text>

            {/* Stats (optional fun element) */}
            <View style={styles.infoCard}>
              <MaterialIcons name="info-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                Sessions expire after 1 hour for your security
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleReauthenticate}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradients.green as any}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="login" size={20} color={Colors.background} />
                  <Text style={styles.primaryButtonText}>Log In with Spotify</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Continue Browsing</Text>
              </TouchableOpacity>
            </View>

            {/* Security Note */}
            <View style={styles.securityNote}>
              <MaterialIcons name="lock" size={12} color={Colors.textTertiary} />
              <Text style={styles.securityText}>
                Your data is secure. Re-authentication is required periodically.
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
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
    padding: 28,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  securityText: {
    fontSize: 11,
    color: Colors.textTertiary,
    flex: 1,
  },
});