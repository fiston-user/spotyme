import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { apiService } from "../../services/apiService";
import { BlurView } from "expo-blur";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [playlist, setPlaylist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPlaylist();
    }
  }, [id]);

  const fetchPlaylist = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getPlaylist(id as string);

      if (response.success && response.data) {
        setPlaylist(response.data);
        if (response.data.spotifyPlaylistId) {
          setSpotifyUrl(
            `https://open.spotify.com/playlist/${response.data.spotifyPlaylistId}`
          );
        }
      } else {
        Alert.alert("Error", response.error || "Failed to load playlist");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching playlist:", error);
      Alert.alert("Error", "Failed to load playlist");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToSpotify = async () => {
    setIsExporting(true);
    try {
      const response = await apiService.exportPlaylistToSpotify(id as string);

      if (response.success && response.data) {
        setSpotifyUrl(response.data.spotifyUrl);
        Alert.alert("Success!", "Your playlist has been exported to Spotify", [
          {
            text: "Open in Spotify",
            onPress: () => {
              if (response.data.spotifyUrl) {
                Linking.openURL(response.data.spotifyUrl);
              }
            },
          },
          { text: "OK", style: "cancel" },
        ]);
      } else {
        Alert.alert("Error", response.error || "Failed to export playlist");
      }
    } catch (error) {
      console.error("Error exporting playlist:", error);
      Alert.alert("Error", "Failed to export playlist to Spotify");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      "Delete Playlist",
      "Are you sure you want to delete this playlist?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const response = await apiService.deletePlaylist(id as string);

              if (response.success) {
                Alert.alert("Success", "Playlist deleted successfully");
                router.replace("/(tabs)/playlists");
              } else {
                Alert.alert(
                  "Error",
                  response.error || "Failed to delete playlist"
                );
              }
            } catch (error) {
              console.error("Error deleting playlist:", error);
              Alert.alert("Error", "Failed to delete playlist");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading playlist...</Text>
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>Playlist not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="primary"
          size="medium"
        />
      </View>
    );
  }

  const formatTrackDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Immersive Header with Parallax Effect */}
        <View style={styles.headerContainer}>
          {playlist.tracks?.[0]?.albumArt && (
            <>
              <Image
                source={{ uri: playlist.tracks[0].albumArt }}
                style={styles.headerBackgroundImage}
                blurRadius={30}
              />
              <LinearGradient
                colors={[
                  "rgba(0, 0, 0, 0.3)",
                  "rgba(18, 18, 18, 0.9)",
                  Colors.background,
                ]}
                style={styles.headerGradient}
                locations={[0, 0.7, 1]}
              />
            </>
          )}
          <View style={styles.headerContent}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <BlurView intensity={80} style={styles.backButtonBlur}>
                <Ionicons name="arrow-back" size={22} color={Colors.text} />
              </BlurView>
            </TouchableOpacity>

            {/* More Options Button with Delete */}
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                Alert.alert("Playlist Options", "", [
                  {
                    text: "Delete Playlist",
                    style: "destructive",
                    onPress: handleDeletePlaylist,
                  },
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                ]);
              }}
              activeOpacity={0.7}
            >
              <BlurView intensity={80} style={styles.moreButtonBlur}>
                <MaterialIcons name="more-vert" size={22} color={Colors.text} />
              </BlurView>
            </TouchableOpacity>

            {/* Playlist Artwork */}
            <View style={styles.artworkContainer}>
              {playlist.tracks?.[0]?.albumArt ? (
                <Image
                  source={{ uri: playlist.tracks[0].albumArt }}
                  style={styles.coverArt}
                />
              ) : (
                <View style={styles.coverArtPlaceholder}>
                  <MaterialIcons
                    name="library-music"
                    size={60}
                    color={Colors.textSecondary}
                  />
                </View>
              )}
            </View>

            {/* Playlist Info */}
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistName} numberOfLines={2}>
                {playlist.name}
              </Text>
              {playlist.description && (
                <Text style={styles.playlistDescription} numberOfLines={2}>
                  {playlist.description}
                </Text>
              )}

              <View style={styles.playlistMeta}>
                <View style={styles.metaItem}>
                  <MaterialIcons
                    name="queue-music"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.metaText}>
                    {playlist.tracks?.length || 0} tracks
                  </Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <MaterialIcons
                    name="schedule"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.metaText}>
                    {formatDuration(playlist.totalDuration || 0)}
                  </Text>
                </View>
                {playlist.createdAt && (
                  <>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <MaterialIcons
                        name="calendar-today"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.metaText}>
                        {new Date(playlist.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionSection}>
          <View style={styles.mainActions}>
            {spotifyUrl ? (
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => Linking.openURL(spotifyUrl)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradients.green as any}
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialIcons
                    name="play-circle-filled"
                    size={24}
                    color={Colors.background}
                  />
                  <Text style={styles.actionButtonText}>Play on Spotify</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handleExportToSpotify}
                disabled={isExporting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isExporting
                      ? [Colors.surface, Colors.surface]
                      : (Colors.gradients.green as any)
                  }
                  style={styles.actionButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color={Colors.text} />
                  ) : (
                    <>
                      <MaterialIcons
                        name="cloud-upload"
                        size={20}
                        color={Colors.background}
                      />
                      <Text style={styles.actionButtonText}>
                        Export to Spotify
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() =>
                Alert.alert("Shuffle Play", "This feature is coming soon!")
              }
              activeOpacity={0.7}
            >
              <MaterialIcons name="shuffle" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Track List Section */}
        <View style={styles.tracksSection}>
          <View style={styles.tracksSectionHeader}>
            <Text style={styles.sectionTitle}>Tracks</Text>
            <TouchableOpacity style={styles.sortButton} activeOpacity={0.7}>
              <MaterialIcons
                name="sort"
                size={18}
                color={Colors.textSecondary}
              />
              <Text style={styles.sortButtonText}>Original</Text>
            </TouchableOpacity>
          </View>

          {playlist.tracks && playlist.tracks.length > 0 ? (
            playlist.tracks.map((track: any, index: number) => (
              <TouchableOpacity
                key={`${track.spotifyId || track.id || "track"}-${index}`}
                style={[
                  styles.trackRow,
                  index === 0 && styles.firstTrack,
                  index === (playlist.tracks?.length || 0) - 1 &&
                    styles.lastTrack,
                ]}
                activeOpacity={0.7}
              >
                <Text style={styles.trackIndex}>{index + 1}</Text>

                {track.albumArt && (
                  <Image
                    source={{ uri: track.albumArt }}
                    style={styles.trackAlbumArt}
                  />
                )}

                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {track.name}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.trackMoreButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="more-horiz"
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyTracksState}>
              <MaterialIcons
                name="music-off"
                size={48}
                color={Colors.textTertiary}
              />
              <Text style={styles.emptyStateText}>
                No tracks in this playlist yet
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    height: 480,
    position: "relative",
  },
  headerBackgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  headerContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 18,
    color: "#FF6B6B",
    marginBottom: 20,
    marginTop: 16,
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  moreButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },
  moreButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  artworkContainer: {
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  coverArt: {
    width: 220,
    height: 220,
    borderRadius: 16,
  },
  coverArtPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  playlistInfo: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  playlistName: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  playlistDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  playlistMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  mainActions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    borderRadius: 25,
    overflow: "hidden",
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.background,
  },
  secondaryActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  tracksSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  tracksSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  sortButtonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 1,
  },
  firstTrack: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastTrack: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 0,
  },
  trackIndex: {
    width: 24,
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    marginRight: 12,
  },
  trackAlbumArt: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
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
  trackMoreButton: {
    padding: 4,
  },
  emptyTracksState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
