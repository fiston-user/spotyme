export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  albumArt: string;
  genre: string[];
  mood: string[];
  energy: number;
  popularity: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  songs: Song[];
  coverArt: string;
  createdAt: Date;
  totalDuration: number;
}

export const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    albumArt: 'https://picsum.photos/seed/1/300/300',
    genre: ['Pop', 'Synthwave'],
    mood: ['Energetic', 'Upbeat'],
    energy: 0.85,
    popularity: 95,
  },
  {
    id: '2',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    album: 'Fine Line',
    duration: 174,
    albumArt: 'https://picsum.photos/seed/2/300/300',
    genre: ['Pop', 'Rock'],
    mood: ['Happy', 'Summer'],
    energy: 0.75,
    popularity: 90,
  },
  {
    id: '3',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 203,
    albumArt: 'https://picsum.photos/seed/3/300/300',
    genre: ['Pop', 'Disco'],
    mood: ['Energetic', 'Dance'],
    energy: 0.9,
    popularity: 88,
  },
  {
    id: '4',
    title: 'Good 4 U',
    artist: 'Olivia Rodrigo',
    album: 'SOUR',
    duration: 178,
    albumArt: 'https://picsum.photos/seed/4/300/300',
    genre: ['Pop', 'Rock'],
    mood: ['Angry', 'Energetic'],
    energy: 0.88,
    popularity: 92,
  },
  {
    id: '5',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'Stay',
    duration: 141,
    albumArt: 'https://picsum.photos/seed/5/300/300',
    genre: ['Pop', 'Hip-Hop'],
    mood: ['Emotional', 'Catchy'],
    energy: 0.7,
    popularity: 93,
  },
  {
    id: '6',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    album: 'Dreamland',
    duration: 238,
    albumArt: 'https://picsum.photos/seed/6/300/300',
    genre: ['Indie', 'Alternative'],
    mood: ['Dreamy', 'Melancholic'],
    energy: 0.65,
    popularity: 87,
  },
  {
    id: '7',
    title: 'Shivers',
    artist: 'Ed Sheeran',
    album: '=',
    duration: 207,
    albumArt: 'https://picsum.photos/seed/7/300/300',
    genre: ['Pop'],
    mood: ['Romantic', 'Upbeat'],
    energy: 0.78,
    popularity: 89,
  },
  {
    id: '8',
    title: 'Montero',
    artist: 'Lil Nas X',
    album: 'Montero',
    duration: 137,
    albumArt: 'https://picsum.photos/seed/8/300/300',
    genre: ['Pop', 'Hip-Hop'],
    mood: ['Bold', 'Energetic'],
    energy: 0.85,
    popularity: 86,
  },
  {
    id: '9',
    title: 'Peaches',
    artist: 'Justin Bieber',
    album: 'Justice',
    duration: 198,
    albumArt: 'https://picsum.photos/seed/9/300/300',
    genre: ['Pop', 'R&B'],
    mood: ['Chill', 'Summer'],
    energy: 0.68,
    popularity: 91,
  },
  {
    id: '10',
    title: 'Happier Than Ever',
    artist: 'Billie Eilish',
    album: 'Happier Than Ever',
    duration: 298,
    albumArt: 'https://picsum.photos/seed/10/300/300',
    genre: ['Alternative', 'Pop'],
    mood: ['Emotional', 'Dark'],
    energy: 0.45,
    popularity: 88,
  },
  {
    id: '11',
    title: 'Cold Heart',
    artist: 'Elton John & Dua Lipa',
    album: 'The Lockdown Sessions',
    duration: 202,
    albumArt: 'https://picsum.photos/seed/11/300/300',
    genre: ['Pop', 'Disco'],
    mood: ['Upbeat', 'Dance'],
    energy: 0.82,
    popularity: 85,
  },
  {
    id: '12',
    title: 'Industry Baby',
    artist: 'Lil Nas X & Jack Harlow',
    album: 'Montero',
    duration: 212,
    albumArt: 'https://picsum.photos/seed/12/300/300',
    genre: ['Hip-Hop', 'Pop'],
    mood: ['Confident', 'Energetic'],
    energy: 0.88,
    popularity: 90,
  },
  {
    id: '13',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: 167,
    albumArt: 'https://picsum.photos/seed/13/300/300',
    genre: ['Pop', 'Synthpop'],
    mood: ['Nostalgic', 'Melancholic'],
    energy: 0.72,
    popularity: 94,
  },
  {
    id: '14',
    title: 'First Class',
    artist: 'Jack Harlow',
    album: 'Come Home The Kids Miss You',
    duration: 173,
    albumArt: 'https://picsum.photos/seed/14/300/300',
    genre: ['Hip-Hop'],
    mood: ['Confident', 'Smooth'],
    energy: 0.65,
    popularity: 89,
  },
  {
    id: '15',
    title: 'Running Up That Hill',
    artist: 'Kate Bush',
    album: 'Hounds of Love',
    duration: 300,
    albumArt: 'https://picsum.photos/seed/15/300/300',
    genre: ['Alternative', 'Art Pop'],
    mood: ['Mystical', 'Emotional'],
    energy: 0.55,
    popularity: 92,
  },
];

export const mockPlaylists: Playlist[] = [
  {
    id: 'p1',
    name: 'Summer Vibes 2024',
    description: 'Perfect tunes for those sunny days',
    songs: mockSongs.slice(0, 5),
    coverArt: 'https://picsum.photos/seed/playlist1/400/400',
    createdAt: new Date('2024-01-15'),
    totalDuration: 896,
  },
  {
    id: 'p2',
    name: 'Workout Energy',
    description: 'High-energy tracks to power your workout',
    songs: mockSongs.filter(s => s.energy > 0.8),
    coverArt: 'https://picsum.photos/seed/playlist2/400/400',
    createdAt: new Date('2024-02-01'),
    totalDuration: 1203,
  },
  {
    id: 'p3',
    name: 'Chill & Study',
    description: 'Relaxing music for focus and concentration',
    songs: mockSongs.filter(s => s.energy < 0.7),
    coverArt: 'https://picsum.photos/seed/playlist3/400/400',
    createdAt: new Date('2024-02-10'),
    totalDuration: 1580,
  },
  {
    id: 'p4',
    name: 'Pop Hits Mix',
    description: 'Top pop songs of the moment',
    songs: mockSongs.filter(s => s.genre.includes('Pop')),
    coverArt: 'https://picsum.photos/seed/playlist4/400/400',
    createdAt: new Date('2024-02-20'),
    totalDuration: 2100,
  },
];

export const getRecommendedSongs = (baseSong: Song, count: number = 5): Song[] => {
  const sameMood = mockSongs.filter(
    s => s.id !== baseSong.id && 
    s.mood.some(m => baseSong.mood.includes(m))
  );
  
  const sameGenre = mockSongs.filter(
    s => s.id !== baseSong.id && 
    !sameMood.includes(s) &&
    s.genre.some(g => baseSong.genre.includes(g))
  );
  
  const similarEnergy = mockSongs.filter(
    s => s.id !== baseSong.id && 
    !sameMood.includes(s) && 
    !sameGenre.includes(s) &&
    Math.abs(s.energy - baseSong.energy) < 0.2
  );
  
  const recommendations = [...sameMood, ...sameGenre, ...similarEnergy];
  
  return recommendations.slice(0, count);
};