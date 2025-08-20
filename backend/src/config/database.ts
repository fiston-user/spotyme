import mongoose from 'mongoose';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');

// Validate MongoDB URI to prevent injection
const validateMongoUri = (uri: string): boolean => {
  try {
    const url = new URL(uri);
    return url.protocol === 'mongodb:' || url.protocol === 'mongodb+srv:';
  } catch {
    return false;
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spotyme';
    
    // Validate the MongoDB URI
    if (!validateMongoUri(uri)) {
      throw new Error('Invalid MongoDB URI format');
    }

    // Connect with secure options
    const connectionOptions: any = {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    // Don't override authSource if it's already in the URI
    // The authSource should be specified in the connection string itself
    
    await mongoose.connect(uri, connectionOptions);
    
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error({ error }, 'MongoDB connection error');
    throw error;
  }
};

mongoose.connection.on('error', (error) => {
  logger.error({ error }, 'MongoDB connection error');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});