import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../constants/Colors";

const { width, height } = Dimensions.get("window");

const backgroundImages = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80", // Concert crowd
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80", // DJ mixer
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&q=80", // Concert lights
  "https://images.unsplash.com/photo-1501612780327-45045538702b?w=1200&q=80", // Sound waves
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80", // Concert stage
];

export default function LoginBackgroundImage() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1.1)).current;
  const currentImageIndex = useRef(0);
  const imageOpacities = useRef(
    backgroundImages.map((_, index) => new Animated.Value(index === 0 ? 1 : 0))
  ).current;

  useEffect(() => {
    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // Ken Burns effect (subtle zoom)
    const startKenBurns = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 20000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 20000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Image rotation
    const rotateImages = () => {
      const interval = setInterval(() => {
        const nextIndex = (currentImageIndex.current + 1) % backgroundImages.length;
        
        // Fade out current image
        Animated.timing(imageOpacities[currentImageIndex.current], {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }).start();

        // Fade in next image
        Animated.timing(imageOpacities[nextIndex], {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }).start();

        currentImageIndex.current = nextIndex;
      }, 8000); // Change image every 8 seconds

      return () => clearInterval(interval);
    };

    startKenBurns();
    const cleanup = rotateImages();

    return cleanup;
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Background Images */}
      {backgroundImages.map((source, index) => (
        <Animated.View
          key={index}
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: Animated.multiply(fadeAnim, imageOpacities[index]),
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={{ uri: source }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </Animated.View>
      ))}

      {/* Blur Overlay */}
      <BlurView
        intensity={60}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />

      {/* Dark Gradient Overlay */}
      <LinearGradient
        colors={[
          "rgba(18, 18, 18, 0.85)",
          "rgba(18, 18, 18, 0.75)",
          "rgba(18, 18, 18, 0.85)",
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Vignette Effect */}
      <LinearGradient
        colors={[
          "rgba(0, 0, 0, 0.4)",
          "transparent",
          "transparent",
          "rgba(0, 0, 0, 0.4)",
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Music Notes Animation */}
      <FloatingElements />
    </View>
  );
}

// Floating music notes component
function FloatingElements() {
  const floatingElements = useRef(
    Array.from({ length: 6 }, () => ({
      translateY: new Animated.Value(height),
      translateX: new Animated.Value(Math.random() * width),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    floatingElements.forEach((element, index) => {
      const startAnimation = () => {
        // Reset position
        element.translateY.setValue(height + 50);
        element.translateX.setValue(Math.random() * width);
        element.opacity.setValue(0);

        // Animate upward with fade
        Animated.parallel([
          Animated.timing(element.translateY, {
            toValue: -100,
            duration: 15000 + Math.random() * 10000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(element.opacity, {
              toValue: 0.3,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(element.opacity, {
              toValue: 0,
              duration: 2000,
              delay: 11000,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          // Restart animation after a delay
          setTimeout(startAnimation, Math.random() * 5000);
        });
      };

      // Start with random delay
      setTimeout(startAnimation, index * 2000 + Math.random() * 3000);
    });
  }, []);

  const musicSymbols = ["♪", "♫", "♬", "♩", "♪", "♫"];

  return (
    <>
      {floatingElements.map((element, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.floatingElement,
            {
              transform: [
                { translateY: element.translateY },
                { translateX: element.translateX },
              ],
              opacity: element.opacity,
            },
          ]}
        >
          {musicSymbols[index]}
        </Animated.Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    width: width * 1.2,
    height: height * 1.2,
    position: "absolute",
    top: -height * 0.1,
    left: -width * 0.1,
  },
  floatingElement: {
    position: "absolute",
    fontSize: 24,
    color: Colors.primary,
    opacity: 0.3,
  },
});