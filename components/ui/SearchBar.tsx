import React, { useRef, useEffect } from 'react';
import { 
  TextInput, 
  View, 
  StyleSheet, 
  TouchableOpacity,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search songs, artists, albums...',
  onClear,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value.length > 0) {
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        friction: 10,
        tension: 50,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 10,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [value]);
  const handleClear = () => {
    Animated.timing(iconRotation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      iconRotation.setValue(0);
      onClear?.();
    });
  };

  const spinValue = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Ionicons name="search" size={20} color={value.length > 0 ? Colors.primary : Colors.textSecondary} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ rotate: spinValue }] }}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </Animated.View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginVertical: 10,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(64, 64, 64, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
    marginLeft: 4,
  },
});