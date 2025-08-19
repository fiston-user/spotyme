import mongoose, { Document, Schema } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption';

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
  // Methods for secure token handling
  setAccessToken(token: string): void;
  getAccessToken(): string;
  setRefreshToken(token: string): void;
  getRefreshToken(): string;
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

// Add methods for secure token handling
UserSchema.methods.setAccessToken = function(token: string) {
  this.accessToken = encrypt(token);
};

UserSchema.methods.getAccessToken = function(): string {
  try {
    return decrypt(this.accessToken);
  } catch (error) {
    console.error('Failed to decrypt access token');
    throw new Error('Token decryption failed');
  }
};

UserSchema.methods.setRefreshToken = function(token: string) {
  this.refreshToken = encrypt(token);
};

UserSchema.methods.getRefreshToken = function(): string {
  try {
    return decrypt(this.refreshToken);
  } catch (error) {
    console.error('Failed to decrypt refresh token');
    throw new Error('Token decryption failed');
  }
};

// Encrypt tokens before saving
UserSchema.pre('save', function(next) {
  if (this.isModified('accessToken') && this.accessToken && !this.accessToken.includes('==')) {
    // Only encrypt if not already encrypted (base64 encoded strings contain '=')
    this.accessToken = encrypt(this.accessToken);
  }
  if (this.isModified('refreshToken') && this.refreshToken && !this.refreshToken.includes('==')) {
    this.refreshToken = encrypt(this.refreshToken);
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);