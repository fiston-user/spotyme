# SpotYme Backend API

Backend API for SpotYme - A Spotify-powered playlist generation app.

## Features

- 🔐 Spotify OAuth 2.0 authentication
- 🎵 Song search and track details via Spotify API
- 🎯 Smart playlist generation based on audio features
- 💾 User preferences and playlist history storage
- 🚀 RESTful API with Express.js and TypeScript
- 📊 MongoDB for data persistence
- 🔒 Security with helmet, CORS, and rate limiting

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your Spotify API credentials:
- Get credentials from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- Create a new app and note the Client ID and Client Secret
- Set redirect URI to `http://localhost:3000/auth/callback`

3. **Start MongoDB:**
```bash
# Using Docker
docker run -d -p 27017:27017 --name spotyme-mongo mongo

# Or use local MongoDB installation
```

4. **Run the development server:**
```bash
npm run dev
```

## API Endpoints

### Authentication
- `GET /auth/login` - Get Spotify authorization URL
- `GET /auth/callback` - Handle OAuth callback
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

### Spotify Integration
- `GET /api/spotify/search` - Search for tracks
- `GET /api/spotify/track/:id` - Get track details
- `GET /api/spotify/track/:id/features` - Get audio features
- `GET /api/spotify/recommendations` - Get track recommendations
- `GET /api/spotify/me/top/:type` - Get user's top tracks/artists

### Playlists
- `POST /api/playlists/generate` - Generate a new playlist
- `GET /api/playlists/my-playlists` - Get user's playlists
- `GET /api/playlists/:id` - Get specific playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/export-to-spotify` - Export to Spotify

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/preferences` - Update preferences
- `GET /api/user/history` - Get playlist history

## Architecture

```
backend/
├── src/
│   ├── config/         # Database configuration
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── index.ts        # App entry point
├── dist/               # Compiled JavaScript
└── package.json
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Spotify API
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/auth/callback

# Database
MONGODB_URI=mongodb://localhost:27017/spotyme

# Security
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d

# Frontend
FRONTEND_URL=http://localhost:8081
```

## License

ISC