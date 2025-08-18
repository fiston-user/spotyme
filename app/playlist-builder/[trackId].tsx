import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Song } from '../../constants/MockData';
import { SongCard } from '../../components/SongCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Slider from '@react-native-community/slider';

export default function PlaylistBuilderScreen() {
  const { trackId } = useLocalSearchParams();
  const router = useRouter();
  
  const [seedTrack, setSeedTrack] = useState<Song | null>(null);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Customization parameters
  const [playlistName, setPlaylistName] = useState('');
  const [targetEnergy, setTargetEnergy] = useState(0.5);
  const [targetValence, setTargetValence] = useState(0.5);
  const [trackCount, setTrackCount] = useState(20);
  
  // Audio features of seed track
  const [audioFeatures, setAudioFeatures] = useState<any>(null);

  // Transform Spotify track to Song interface
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
      energy: audioFeatures?.energy || 0.5,
      popularity: track.popularity || 0,
    };
  };

  // Fetch seed track details and audio features
  useEffect(() => {
    if (!trackId) return;
    fetchTrackDetails();
  }, [trackId]);

  const fetchTrackDetails = async () => {
    setIsLoading(true);
    try {
      // Clean the track ID
      const cleanTrackId = (trackId as string).replace('spotify:track:', '');
      
      // Fetch track details
      const trackResponse = await fetch(
        `https://piranha-coherent-usefully.ngrok-free.app/api/spotify/track/${cleanTrackId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (trackResponse.ok) {
        const trackData = await trackResponse.json();
        
        // Try to fetch audio features but don't fail if unavailable
        try {
          const featuresResponse = await fetch(
            `https://piranha-coherent-usefully.ngrok-free.app/api/spotify/track/${cleanTrackId}/features`,
            {
              method: 'GET',
              credentials: 'include',
            }
          );

          if (featuresResponse.ok) {
            const featuresData = await featuresResponse.json();
            setAudioFeatures(featuresData);
            setTargetEnergy(featuresData.energy || 0.5);
            setTargetValence(featuresData.valence || 0.5);
          } else {
            // Use default values if audio features not available
            setAudioFeatures({ energy: 0.5, valence: 0.5 });
            setTargetEnergy(0.5);
            setTargetValence(0.5);
          }
        } catch (featuresError) {
          console.log('Audio features not available, using defaults');
          setAudioFeatures({ energy: 0.5, valence: 0.5 });
          setTargetEnergy(0.5);
          setTargetValence(0.5);
        }

        const transformedTrack = transformSpotifyTrack(trackData);
        setSeedTrack(transformedTrack);
        setPlaylistName(`Mix inspired by ${transformedTrack.title}`);
        
        // Auto-generate recommendations using the simple approach
        await generateSimpleRecommendations(transformedTrack);
      } else {
        Alert.alert('Error', 'Track not found. Please try a different track.');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching track details:', error);
      Alert.alert('Error', 'Failed to load track details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const generateSimpleRecommendations = async (track?: Song) => {
    const currentTrack = track || seedTrack;
    if (!currentTrack) return;
    
    setIsGenerating(true);
    try {
      // Use the main recommendations endpoint with AI fallback
      const params = new URLSearchParams({
        seed_tracks: currentTrack.id,
        limit: trackCount.toString(),
        target_energy: targetEnergy.toString(),
        target_valence: targetValence.toString(),
      });

      const response = await fetch(
        `https://piranha-coherent-usefully.ngrok-free.app/api/spotify/recommendations?${params}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.tracks && data.tracks.length > 0) {
          const transformedTracks = data.tracks.map(transformSpotifyTrack);
          setRecommendations(transformedTracks);
          // Auto-select all tracks initially
          setSelectedTracks(transformedTracks);
        } else {
          // No recommendations found, show message
          setRecommendations([]);
          setSelectedTracks([]);
          Alert.alert(
            'No Recommendations', 
            'Unable to find similar tracks. Try searching for a different song.'
          );
        }
      } else {
        console.error('Simple recommendations failed');
        Alert.alert('Error', 'Failed to generate recommendations');
      }
    } catch (error) {
      console.error('Error generating simple recommendations:', error);
      Alert.alert('Error', 'Failed to generate recommendations. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRecommendations = async () => {
    // Use the simple recommendations approach
    await generateSimpleRecommendations();
  };

  const toggleTrackSelection = (track: Song) => {
    setSelectedTracks(prev => {
      const isSelected = prev.some(t => t.id === track.id);
      if (isSelected) {
        return prev.filter(t => t.id !== track.id);
      } else {
        return [...prev, track];
      }
    });
  };

  const savePlaylist = async () => {
    if (selectedTracks.length === 0) {
      Alert.alert('No Tracks Selected', 'Please select at least one track for your playlist');
      return;
    }

    setIsSaving(true);
    try {
      const seedTracks = [trackId, ...selectedTracks.slice(0, 4).map(t => t.id)].filter(Boolean);
      
      const response = await fetch(
        'https://piranha-coherent-usefully.ngrok-free.app/api/playlists/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            seedTracks,
            name: playlistName || `SpotYme Mix - ${new Date().toLocaleDateString()}`,
            description: `Playlist inspired by ${seedTrack?.title} with ${selectedTracks.length} tracks`,
            options: {
              limit: selectedTracks.length,
              targetEnergy,
              targetValence,
            },
          }),
        }
      );

      if (response.ok) {
        const playlist = await response.json();
        Alert.alert(
          'Success!',
          'Your playlist has been created',
          [
            {
              text: 'View Playlist',
              onPress: () => router.replace(`/playlist/${playlist._id}`),
            },
            {
              text: 'Create Another',
              style: 'cancel',
              onPress: () => {
                setSelectedTracks([]);
                generateRecommendations();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error saving playlist:', error);
      Alert.alert('Error', 'Failed to save playlist');
    } finally {
      setIsSaving(false);
    }
  };

  const exportToSpotify = async () => {
    // This will be implemented after playlist is saved
    Alert.alert('Coming Soon', 'Export to Spotify will be available after saving the playlist');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading track details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={Colors.gradients.purple as any}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Create Playlist</Text>
        <Text style={styles.headerSubtitle}>
          Customize your perfect mix
        </Text>
      </LinearGradient>

      {seedTrack && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Based on</Text>
          <SongCard song={seedTrack} onPress={() => {}} />
          
          {audioFeatures && (
            <Card style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>Track Characteristics</Text>
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Energy</Text>
                <View style={styles.featureBar}>
                  <View 
                    style={[
                      styles.featureFill, 
                      { width: `${audioFeatures.energy * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.featureValue}>
                  {Math.round(audioFeatures.energy * 100)}%
                </Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Mood</Text>
                <View style={styles.featureBar}>
                  <View 
                    style={[
                      styles.featureFill, 
                      { width: `${audioFeatures.valence * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.featureValue}>
                  {Math.round(audioFeatures.valence * 100)}%
                </Text>
              </View>
            </Card>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customize Your Playlist</Text>
        
        <Card style={styles.customizationCard}>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Energy Level</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={targetEnergy}
              onValueChange={setTargetEnergy}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Chill</Text>
              <Text style={styles.sliderLabelText}>Energetic</Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Mood</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={targetValence}
              onValueChange={setTargetValence}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>Melancholic</Text>
              <Text style={styles.sliderLabelText}>Happy</Text>
            </View>
          </View>

          <Button
            title={isGenerating ? 'Generating...' : 'Regenerate Recommendations'}
            onPress={generateRecommendations}
            variant="secondary"
            size="medium"
            disabled={isGenerating}
            style={styles.regenerateButton}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Recommended Tracks ({selectedTracks.length} selected)
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (selectedTracks.length === recommendations.length) {
                setSelectedTracks([]);
              } else {
                setSelectedTracks(recommendations);
              }
            }}
          >
            <Text style={styles.selectAllText}>
              {selectedTracks.length === recommendations.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>

        {isGenerating ? (
          <View style={styles.generatingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.generatingText}>Finding perfect matches...</Text>
          </View>
        ) : (
          recommendations.map(track => (
            <TouchableOpacity
              key={track.id}
              onPress={() => toggleTrackSelection(track)}
              style={styles.trackContainer}
            >
              <View style={styles.trackRow}>
                <View style={styles.checkbox}>
                  {selectedTracks.some(t => t.id === track.id) && (
                    <Ionicons name="checkmark" size={16} color={Colors.primary} />
                  )}
                </View>
                <View style={styles.trackContent}>
                  <SongCard 
                    song={track} 
                    onPress={() => toggleTrackSelection(track)}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistInfoText}>
            {selectedTracks.length} tracks • {Math.floor(selectedTracks.reduce((sum, t) => sum + t.duration, 0) / 60)} minutes
          </Text>
        </View>
        
        <Button
          title={isSaving ? 'Creating Playlist...' : 'Create Playlist'}
          onPress={savePlaylist}
          variant="primary"
          size="large"
          disabled={isSaving || selectedTracks.length === 0}
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 30,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.text,
    opacity: 0.9,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  selectAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  featuresCard: {
    marginTop: 12,
    padding: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureLabel: {
    width: 60,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  featureBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginHorizontal: 12,
  },
  featureFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  featureValue: {
    width: 40,
    fontSize: 12,
    color: Colors.text,
    textAlign: 'right',
  },
  customizationCard: {
    padding: 20,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabelText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  regenerateButton: {
    marginTop: 8,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  generatingText: {
    marginLeft: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  trackContainer: {
    marginBottom: 8,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackContent: {
    flex: 1,
  },
  footer: {
    padding: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  playlistInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  playlistInfoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  saveButton: {
    width: '100%',
  },
});