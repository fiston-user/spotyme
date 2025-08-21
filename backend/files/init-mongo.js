// Get environment variables or use defaults
const dbName = process.env.MONGO_INITDB_DATABASE || 'spotyme';
const dbUser = process.env.MONGO_USER || 'spotyme_user';
const dbPassword = process.env.MONGO_PASSWORD || 'spotyme_pass';

// Switch to admin database first (we're root)
db = db.getSiblingDB('admin');

// Create the user in admin database with access to spotyme database
db.createUser({
  user: dbUser,
  pwd: dbPassword,
  roles: [
    {
      role: 'readWrite',
      db: dbName
    },
    {
      role: 'dbAdmin',
      db: dbName
    }
  ]
});

// Now switch to the target database for collections
db = db.getSiblingDB(dbName);

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date and is required'
        }
      }
    }
  }
});

db.createCollection('playlists', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'must be an objectId and is required'
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date and is required'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ spotifyId: 1 }, { sparse: true });
db.playlists.createIndex({ userId: 1 });
db.playlists.createIndex({ createdAt: -1 });

// Create sessions collection with TTL
db.createCollection('sessions');
db.sessions.createIndex({ expires: 1 }, { expireAfterSeconds: 0 });

print(`MongoDB initialization completed for database: ${dbName}`);
print(`Created user: ${dbUser} with readWrite permissions`);