import React, { useEffect, useRef, useState } from 'react';
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
import useUIStore from '../stores/uiStore';

const { width: screenWidth } = Dimensions.get('window');

export const RateLimitModal: React.FC = () => {
  const { rateLimitModal, hideRateLimitModal } = useUIStore();
  const [countdown, setCountdown] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (rateLimitModal.visible) {
      // Set initial countdown (default 60 seconds if not specified)
      const waitTime = rateLimitModal.retryAfter || 60;
      setCountdown(waitTime);

      // Start animations
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

      // Start pulse animation for the timer
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      // Reset animations
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
  }, [rateLimitModal.visible]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && rateLimitModal.visible) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (countdown === 0 && rateLimitModal.visible) {
      // Auto-hide when countdown reaches 0
      setTimeout(() => {
        hideRateLimitModal();
      }, 500);
    }
  }, [countdown, rateLimitModal.visible]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs} seconds`;
  };

  const handleTryNow = () => {
    hideRateLimitModal();
    // Optional: trigger a retry of the last failed request
    if (rateLimitModal.onRetry) {
      rateLimitModal.onRetry();
    }
  };

  if (!rateLimitModal.visible) return null;

  return (
    <Modal
      visible={rateLimitModal.visible}
      transparent
      animationType="none"
      statusBarTranslucent
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
          <LinearGradient
            colors={['rgba(255, 165, 0, 0.1)', 'rgba(18, 18, 18, 0.95)']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={styles.content}>
            {/* Animated Icon */}
            <Animated.View 
              style={[
                styles.iconContainer,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <LinearGradient
                colors={Colors.gradients.orange as any}
                style={styles.iconGradient}
              >
                <MaterialIcons name="speed" size={48} color={Colors.text} />
              </LinearGradient>
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>Slow Down!</Text>
            
            {/* Message */}
            <Text style={styles.message}>
              You're making requests too quickly. Please wait a moment before trying again.
            </Text>

            {/* Countdown Timer */}
            {countdown > 0 ? (
              <View style={styles.timerContainer}>
                <View style={styles.timerCircle}>
                  <Text style={styles.timerText}>{formatTime(countdown)}</Text>
                </View>
                <Text style={styles.timerLabel}>Please wait</Text>
              </View>
            ) : (
              <View style={styles.readyContainer}>
                <MaterialIcons name="check-circle" size={32} color={Colors.success} />
                <Text style={styles.readyText}>Ready to continue!</Text>
              </View>
            )}

            {/* Info Cards */}
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <MaterialIcons name="info-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  This limit helps ensure a smooth experience for all users
                </Text>
              </View>

              <View style={styles.tipCard}>
                <MaterialIcons name="lightbulb-outline" size={16} color={Colors.primary} />
                <Text style={styles.tipText}>
                  Tip: Space out your actions to avoid this limit
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {countdown > 0 ? (
                <TouchableOpacity
                  style={styles.waitButton}
                  onPress={hideRateLimitModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.waitButtonText}>I'll Wait</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleTryNow}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={Colors.gradients.green as any}
                    style={styles.retryButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialIcons name="refresh" size={20} color={Colors.background} />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
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
    shadowColor: Colors.warning,
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
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 3,
    borderColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.warning,
  },
  timerLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  readyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderRadius: 20,
  },
  readyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  infoSection: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    width: '100%',
  },
  waitButton: {
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  waitButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  retryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});