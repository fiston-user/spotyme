import { User, IUser } from '../models/User';

interface CreateUserDto {
  spotifyId: string;
  email: string;
  displayName: string;
  imageUrl?: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}

class UserService {
  async findOrCreateUser(userData: CreateUserDto): Promise<IUser> {
    try {
      let user = await User.findOne({ spotifyId: userData.spotifyId });

      if (user) {
        // Update tokens
        user.accessToken = userData.accessToken;
        user.refreshToken = userData.refreshToken;
        user.tokenExpiry = userData.tokenExpiry;
        await user.save();
      } else {
        // Create new user
        user = await User.create(userData);
      }

      return user;
    } catch (error) {
      console.error('Error finding/creating user:', error);
      throw new Error('Failed to process user');
    }
  }

  async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: any
  ): Promise<IUser> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { preferences },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  }

  async getUserHistory(
    userId: string,
    limit: number,
    offset: number
  ): Promise<any> {
    try {
      const user = await User.findById(userId)
        .populate({
          path: 'playlists',
          options: {
            limit,
            skip: offset,
            sort: { createdAt: -1 }
          }
        });

      if (!user) {
        throw new Error('User not found');
      }

      return user.playlists;
    } catch (error) {
      console.error('Error getting user history:', error);
      throw new Error('Failed to get user history');
    }
  }

  async updateTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, {
        accessToken,
        refreshToken,
        tokenExpiry: new Date(Date.now() + expiresIn * 1000)
      });
    } catch (error) {
      console.error('Error updating tokens:', error);
      throw new Error('Failed to update tokens');
    }
  }
}

export const userService = new UserService();