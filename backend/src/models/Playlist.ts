import mongoose, { Document, Schema } from 'mongoose';

interface Track {
  spotifyId: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  albumArt?: string;
  previewUrl?: string;
}

export interface IPlaylist extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  tracks: Track[];
  seedTracks: string[];
  generationParams: {
    targetEnergy?: number;
    targetValence?: number;
    genres?: string[];
  };
  totalDuration: number;
  spotifyPlaylistId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrackSchema = new Schema<Track>({
  spotifyId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    required: true
  },
  album: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  albumArt: String,
  previewUrl: String
});

const PlaylistSchema = new Schema<IPlaylist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    tracks: [TrackSchema],
    seedTracks: [{
      type: String
    }],
    generationParams: {
      targetEnergy: {
        type: Number,
        min: 0,
        max: 1
      },
      targetValence: {
        type: Number,
        min: 0,
        max: 1
      },
      genres: [String]
    },
    totalDuration: {
      type: Number,
      default: 0
    },
    spotifyPlaylistId: String,
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

PlaylistSchema.index({ userId: 1, createdAt: -1 });

export const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);