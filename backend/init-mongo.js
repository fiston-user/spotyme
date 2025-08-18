// Create spotyme database and user
db = db.getSiblingDB('spotyme');

db.createUser({
  user: 'spotyme_user',
  pwd: 'spotyme_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'spotyme'
    }
  ]
});

// Create collections
db.createCollection('users');
db.createCollection('playlists');

print('MongoDB initialization completed');