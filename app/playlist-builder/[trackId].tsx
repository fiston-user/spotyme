import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { Song } from "../../constants/MockData";
import Slider from "@react-native-community/slider";
import { apiService } from "../../services/apiService";
import { BlurView } from "expo-blur";
import { PlaylistBuilderLoadingSkeleton } from "../../components/skeletons/PlaylistBuilderSkeletons";

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

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
  const [playlistName, setPlaylistName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [targetEnergy, setTargetEnergy] = useState(0.5);
  const [targetValence, setTargetValence] = useState(0.5);
  const [trackCount, setTrackCount] = useState(20);

  // Audio features of seed track
  const [audioFeatures, setAudioFeatures] = useState<{
    energy?: number;
    valence?: number;
    [key: string]: any;
  } | null>(null);

  // Transform Spotify track to Song interface
  const transformSpotifyTrack = (track: any): Song => {
    return {
      id: track.id,
      title: track.name,
      artist:
        track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
      album: track.album?.name || "Unknown Album",
      duration: Math.floor(track.duration_ms / 1000),
      albumArt:
        track.album?.images?.[0]?.url ||
        "https://picsum.photos/seed/spotify/300/300",
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
      const cleanTrackId = (trackId as string).replace("spotify:track:", "");

      // Fetch track details using API service
      const trackResponse = await apiService.getTrack(cleanTrackId);

      if (trackResponse.success && trackResponse.data) {
        const trackData = trackResponse.data;

        // Try to fetch audio features but don't fail if unavailable
        try {
          const featuresResponse = await apiService.getTrackAudioFeatures(
            cleanTrackId
          );

          if (featuresResponse.success && featuresResponse.data) {
            const featuresData = featuresResponse.data;
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
          console.log("Audio features not available, using defaults");
          setAudioFeatures({ energy: 0.5, valence: 0.5 });
          setTargetEnergy(0.5);
          setTargetValence(0.5);
        }

        const transformedTrack = transformSpotifyTrack(trackData);
        setSeedTrack(transformedTrack);
        setPlaylistName(`Mix inspired by ${transformedTrack.title}`);

        // Auto-generate recommendations
        await generateSimpleRecommendations(transformedTrack);
      } else {
        Alert.alert(
          "Error",
          trackResponse.error ||
            "Track not found. Please try a different track."
        );
        router.back();
      }
    } catch (error) {
      console.error("Error fetching track details:", error);
      Alert.alert("Error", "Failed to load track details");
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
      const response = await apiService.getRecommendations(
        currentTrack.id,
        trackCount,
        targetEnergy,
        targetValence
      );

      if (response.success && response.data) {
        const data = response.data as any;
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
            "No Recommendations",
            "Unable to find similar tracks. Try searching for a different song."
          );
        }
      } else {
        console.error("Recommendations failed:", response.error);
        Alert.alert(
          "Error",
          response.error || "Failed to generate recommendations"
        );
      }
    } catch (error) {
      console.error("Error generating simple recommendations:", error);
      Alert.alert(
        "Error",
        "Failed to generate recommendations. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRecommendations = async () => {
    // Use the simple recommendations approach
    await generateSimpleRecommendations();
  };

  const toggleTrackSelection = (track: Song) => {
    setSelectedTracks((prev) => {
      const isSelected = prev.some((t) => t.id === track.id);
      if (isSelected) {
        return prev.filter((t) => t.id !== track.id);
      } else {
        return [...prev, track];
      }
    });
  };

  const savePlaylist = async () => {
    if (selectedTracks.length === 0) {
      Alert.alert(
        "No Tracks Selected",
        "Please select at least one track for your playlist"
      );
      return;
    }

    setIsSaving(true);
    try {
      const cleanTrackId = (trackId as string).replace("spotify:track:", "");
      const seedTracks = [cleanTrackId].filter(Boolean);
      const selectedTrackIds = selectedTracks.map((t) => t.id);

      const response = await apiService.generatePlaylist({
        seedTracks,
        selectedTracks: selectedTrackIds, // Send the actual selected track IDs
        name:
          playlistName || `SpotYme Mix - ${new Date().toLocaleDateString()}`,
        description: `Playlist inspired by ${seedTrack?.title} with ${selectedTracks.length} tracks`,
        options: {
          limit: selectedTracks.length,
          targetEnergy,
          targetValence,
        },
      });

      if (response.success && response.data) {
        const playlist = response.data as any;
        Alert.alert("Success!", "Your playlist has been created", [
          {
            text: "View Playlist",
            onPress: () => router.replace(`/playlist/${playlist._id}`),
          },
          {
            text: "Create Another",
            style: "cancel",
            onPress: () => {
              setSelectedTracks([]);
              generateRecommendations();
            },
          },
        ]);
      } else {
        Alert.alert("Error", response.error || "Failed to create playlist");
      }
    } catch (error) {
      console.error("Error saving playlist:", error);
      Alert.alert("Error", "Failed to save playlist");
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return <PlaylistBuilderLoadingSkeleton />;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Enhanced Header with Album Art Background */}
        <View style={styles.headerContainer}>
          {seedTrack && (
            <Image
              source={{ uri: seedTrack.albumArt }}
              style={styles.headerBackgroundImage}
              blurRadius={20}
            />
          )}
          <LinearGradient
            colors={[
              "rgba(18, 18, 18, 0.3)",
              "rgba(18, 18, 18, 0.95)",
              Colors.background,
            ]}
            style={styles.headerGradient}
            locations={[0, 0.6, 1]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <BlurView intensity={80} style={styles.backButtonBlur}>
                  <Ionicons name="arrow-back" size={22} color={Colors.text} />
                </BlurView>
              </TouchableOpacity>

              <View style={styles.headerTextContainer}>
                <Text style={styles.headerLabel}>CREATING PLAYLIST</Text>
                {isEditingName ? (
                  <TextInput
                    style={styles.playlistNameInput}
                    value={playlistName}
                    onChangeText={setPlaylistName}
                    onBlur={() => setIsEditingName(false)}
                    autoFocus
                    placeholder="Enter playlist name"
                    placeholderTextColor={Colors.textTertiary}
                    returnKeyType="done"
                  />
                ) : (
                  <TouchableOpacity onPress={() => setIsEditingName(true)}>
                    <View style={styles.playlistNameContainer}>
                      <Text style={styles.playlistName} numberOfLines={1}>
                        {playlistName || "Tap to name your playlist"}
                      </Text>
                      <MaterialIcons
                        name="edit"
                        size={18}
                        color={Colors.textSecondary}
                        style={styles.editIcon}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Seed Track Section with Better Design */}
        {seedTrack && (
          <View style={styles.seedSection}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons
                name="music-note"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.sectionTitle}>Building playlist from</Text>
            </View>

            <View style={styles.seedTrackCard}>
              <Image
                source={{ uri: seedTrack.albumArt }}
                style={styles.seedAlbumArt}
              />
              <View style={styles.seedTrackInfo}>
                <Text style={styles.seedTrackTitle} numberOfLines={1}>
                  {seedTrack.title}
                </Text>
                <Text style={styles.seedTrackArtist} numberOfLines={1}>
                  {seedTrack.artist} • {seedTrack.album}
                </Text>

                {audioFeatures && (
                  <View style={styles.miniFeatures}>
                    <View style={styles.miniFeature}>
                      <View style={styles.miniFeatureBar}>
                        <View
                          style={[
                            styles.miniFeatureFill,
                            { width: `${audioFeatures.energy * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.miniFeatureLabel}>Energy</Text>
                    </View>
                    <View style={styles.miniFeature}>
                      <View style={styles.miniFeatureBar}>
                        <View
                          style={[
                            styles.miniFeatureFill,
                            { width: `${audioFeatures.valence * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.miniFeatureLabel}>Mood</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Enhanced Customization Section */}
        <View style={styles.customizationSection}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="tune" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Fine-tune your mix</Text>
          </View>

          <View style={styles.customizationCards}>
            {/* Energy Card */}
            <View style={styles.parameterCard}>
              <LinearGradient
                colors={["rgba(255, 107, 0, 0.1)", "rgba(255, 165, 0, 0.05)"]}
                style={styles.parameterGradient}
              >
                <View style={styles.parameterHeader}>
                  <MaterialIcons name="flash-on" size={18} color="#FFA500" />
                  <Text style={styles.parameterTitle}>Energy</Text>
                  <Text style={styles.parameterValue}>
                    {Math.round(targetEnergy * 100)}%
                  </Text>
                </View>
                <Slider
                  style={styles.parameterSlider}
                  minimumValue={0}
                  maximumValue={1}
                  value={targetEnergy}
                  onValueChange={setTargetEnergy}
                  minimumTrackTintColor="#FFA500"
                  maximumTrackTintColor={Colors.border}
                  thumbTintColor="#FFA500"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>Relaxed</Text>
                  <Text style={styles.sliderLabelText}>Energetic</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Mood Card */}
            <View style={styles.parameterCard}>
              <LinearGradient
                colors={["rgba(29, 185, 84, 0.1)", "rgba(30, 215, 96, 0.05)"]}
                style={styles.parameterGradient}
              >
                <View style={styles.parameterHeader}>
                  <MaterialIcons name="mood" size={18} color={Colors.primary} />
                  <Text style={styles.parameterTitle}>Mood</Text>
                  <Text style={styles.parameterValue}>
                    {Math.round(targetValence * 100)}%
                  </Text>
                </View>
                <Slider
                  style={styles.parameterSlider}
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
              </LinearGradient>
            </View>

            {/* Track Count Card */}
            <View style={styles.trackCountCard}>
              <View style={styles.trackCountHeader}>
                <MaterialIcons
                  name="queue-music"
                  size={18}
                  color={Colors.textSecondary}
                />
                <Text style={styles.trackCountLabel}>Playlist Size</Text>
              </View>
              <View style={styles.trackCountOptions}>
                {[10, 20, 30, 50].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.trackCountOption,
                      trackCount === count && styles.trackCountOptionActive,
                    ]}
                    onPress={() => setTrackCount(count)}
                  >
                    <Text
                      style={[
                        styles.trackCountText,
                        trackCount === count && styles.trackCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={generateRecommendations}
            disabled={isGenerating}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={
                isGenerating
                  ? [Colors.surface, Colors.surface]
                  : (Colors.gradients.green as any)
              }
              style={styles.regenerateGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <MaterialIcons name="refresh" size={20} color={Colors.text} />
                  <Text style={styles.regenerateText}>Generate New Mix</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Enhanced Recommendations Section */}
        <View style={styles.recommendationsSection}>
          <View style={styles.recommendationsHeader}>
            <View style={styles.sectionHeaderRow}>
              <MaterialIcons
                name="library-music"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.sectionTitle}>Your Mix</Text>
            </View>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectedCount}>
                {selectedTracks.length} of {recommendations.length} tracks
              </Text>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={() => {
                  if (selectedTracks.length === recommendations.length) {
                    setSelectedTracks([]);
                  } else {
                    setSelectedTracks(recommendations);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.selectAllText}>
                  {selectedTracks.length === recommendations.length
                    ? "Clear"
                    : "Select All"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isGenerating ? (
            <View style={styles.generatingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.generatingText}>
                Finding similar tracks
              </Text>
              <Text style={styles.generatingSubtext}>
                Building your {trackCount} track playlist
              </Text>
            </View>
          ) : recommendations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="music-off"
                size={48}
                color={Colors.textTertiary}
              />
              <Text style={styles.emptyStateText}>No recommendations yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Adjust the parameters and generate a mix
              </Text>
            </View>
          ) : (
            <View style={styles.trackList}>
              {recommendations.map((track, index) => (
                <TouchableOpacity
                  key={track.id}
                  onPress={() => toggleTrackSelection(track)}
                  style={[
                    styles.trackItem,
                    selectedTracks.some((t) => t.id === track.id) &&
                      styles.trackItemSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.trackItemContent}>
                    <Text style={styles.trackNumber}>{index + 1}</Text>
                    <Image
                      source={{ uri: track.albumArt }}
                      style={styles.trackAlbumArt}
                    />
                    <View style={styles.trackInfo}>
                      <Text style={styles.trackTitle} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {track.artist} • {formatDuration(track.duration)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.trackCheckbox,
                        selectedTracks.some((t) => t.id === track.id) &&
                          styles.trackCheckboxSelected,
                      ]}
                    >
                      {selectedTracks.some((t) => t.id === track.id) && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={Colors.background}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Spacer for fixed footer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Footer with Better Design */}
      {selectedTracks.length > 0 && (
        <View style={styles.fixedFooter}>
          <BlurView intensity={95} style={styles.footerBlur}>
            <View style={styles.footerContent}>
              <View style={styles.footerStats}>
                <View style={styles.statItem}>
                  <MaterialIcons
                    name="queue-music"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.statText}>
                    {selectedTracks.length} tracks
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.statText}>
                    {Math.floor(
                      selectedTracks.reduce((sum, t) => sum + t.duration, 0) /
                        60
                    )}{" "}
                    min
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={savePlaylist}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradients.green as any}
                  style={styles.createButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <>
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color={Colors.background}
                      />
                      <Text style={styles.createButtonText}>
                        Create Playlist
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    height: 280,
    position: "relative",
  },
  headerBackgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerGradient: {
    flex: 1,
    justifyContent: "flex-end",
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  headerTextContainer: {},
  headerLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  playlistNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  playlistName: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text,
    flex: 1,
  },
  editIcon: {
    marginLeft: 8,
  },
  playlistNameInput: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text,
    padding: 0,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  seedSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  seedTrackCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  seedAlbumArt: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  seedTrackInfo: {
    flex: 1,
  },
  seedTrackTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  seedTrackArtist: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  miniFeatures: {
    flexDirection: "row",
    gap: 16,
  },
  miniFeature: {
    flex: 1,
  },
  miniFeatureBar: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 4,
  },
  miniFeatureFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  miniFeatureLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  customizationSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 8,
  },
  customizationCards: {
    marginTop: 16,
    gap: 12,
  },
  parameterCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  parameterGradient: {
    padding: 16,
  },
  parameterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  parameterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 6,
    flex: 1,
  },
  parameterValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
  },
  parameterSlider: {
    width: "100%",
    height: 30,
  },
  trackCountCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  trackCountHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  trackCountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginLeft: 6,
  },
  trackCountOptions: {
    flexDirection: "row",
    gap: 8,
  },
  trackCountOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: "center",
  },
  trackCountOptionActive: {
    backgroundColor: Colors.primary,
  },
  trackCountText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  trackCountTextActive: {
    color: Colors.background,
  },
  recommendationsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  recommendationsHeader: {
    marginBottom: 16,
  },
  selectionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  selectedCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  selectAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabelText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  regenerateButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  regenerateGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  regenerateText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  generatingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  generatingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  generatingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  emptyStateSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  trackList: {
    gap: 8,
  },
  trackItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  trackItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  trackItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  trackNumber: {
    width: 24,
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  trackAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginHorizontal: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 3,
  },
  trackArtist: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  trackCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  trackCheckboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  fixedFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerBlur: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  footerContent: {
    gap: 12,
  },
  footerStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
  },
  createButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.background,
  },
});
