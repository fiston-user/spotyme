import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { mockSongs, Song } from '../../constants/MockData';
import { SearchBar } from '../../components/ui/SearchBar';
import { SongCard } from '../../components/SongCard';
import { Card } from '../../components/ui/Card';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const genres = Array.from(new Set(mockSongs.flatMap(s => s.genre)));
  const moods = Array.from(new Set(mockSongs.flatMap(s => s.mood)));

  const filteredSongs = mockSongs.filter(song => {
    const matchesSearch = !searchQuery || 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = !selectedGenre || song.genre.includes(selectedGenre);
    const matchesMood = !selectedMood || song.mood.includes(selectedMood);
    
    return matchesSearch && matchesGenre && matchesMood;
  });

  const handleSongPress = (song: Song) => {
    Alert.alert(
      song.title,
      `By ${song.artist}\nAlbum: ${song.album}\nDuration: ${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}`
    );
  };

  const FilterChip = ({ 
    label, 
    isSelected, 
    onPress 
  }: { 
    label: string; 
    isSelected: boolean; 
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search songs, artists, albums..."
        onClear={() => setSearchQuery('')}
      />

      <View style={styles.filters}>
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Genres</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={genres}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <FilterChip
                label={item}
                isSelected={selectedGenre === item}
                onPress={() => setSelectedGenre(selectedGenre === item ? null : item)}
              />
            )}
            contentContainerStyle={styles.chipList}
          />
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Moods</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={moods}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <FilterChip
                label={item}
                isSelected={selectedMood === item}
                onPress={() => setSelectedMood(selectedMood === item ? null : item)}
              />
            )}
            contentContainerStyle={styles.chipList}
          />
        </View>
      </View>

      {(selectedGenre || selectedMood) && (
        <TouchableOpacity 
          style={styles.clearFilters}
          onPress={() => {
            setSelectedGenre(null);
            setSelectedMood(null);
          }}
        >
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongCard
            song={item}
            onPress={() => handleSongPress(item)}
            showAddButton={false}
          />
        )}
        ListHeaderComponent={
          <Text style={styles.resultsCount}>
            {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'} found
          </Text>
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="search" size={48} color={Colors.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>No songs found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your filters or search terms
            </Text>
          </Card>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filters: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chipList: {
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  clearFilters: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  clearFiltersText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 40,
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});