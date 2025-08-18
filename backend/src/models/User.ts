import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  spotifyId: string;
  email: string;
  displayName: string;
  imageUrl?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  preferences: {
    favoriteGenres?: string[];
    energyPreference?: number;
    valencePreference?: number;
  };
  playlists: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    spotifyId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    displayName: {
      type: String,
      required: true
    },
    imageUrl: String,
    accessToken: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    tokenExpiry: {
      type: Date,
      required: true
    },
    preferences: {
      favoriteGenres: [String],
      energyPreference: {
        type: Number,
        min: 0,
        max: 1
      },
      valencePreference: {
        type: Number,
        min: 0,
        max: 1
      }
    },
    playlists: [{
      type: Schema.Types.ObjectId,
      ref: 'Playlist'
    }]
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);