import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet 
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Song } from '../constants/MockData';
import { SongCard } from './SongCard';

interface RecommendationListProps {
  title: string;
  songs: Song[];
  onSongPress: (song: Song) => void;
  onAddToPlaylist?: (song: Song) => void;
  showAddButton?: boolean;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
  title,
  songs,
  onSongPress,
  onAddToPlaylist,
  showAddButton = true,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongCard
            song={item}
            onPress={() => onSongPress(item)}
            showAddButton={showAddButton}
            onAddPress={() => onAddToPlaylist?.(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
});