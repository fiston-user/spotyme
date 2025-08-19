import mongoose from 'mongoose';

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
    
    // Only add authSource if there's authentication in the URI
    if (uri.includes('@')) {
      connectionOptions.authSource = 'admin';
    }
    
    await mongoose.connect(uri, connectionOptions);
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});