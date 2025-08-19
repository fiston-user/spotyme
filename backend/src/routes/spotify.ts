import { Router } from 'express';
import { spotifyApiService } from '../services/spotifyApi';
import { authMiddleware } from '../middleware/auth';
import { spotifyApiLimiter } from '../middleware/rateLimiter';

const router: Router = Router();

router.use(authMiddleware);
router.use(spotifyApiLimiter);

router.get('/search', async (req, res, next) => {
  try {
    const { q, type = 'track', limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    const results = await spotifyApiService.search(
      req.session.accessToken!,
      q,
      type as string,
      Number(limit)
    );

    return res.json(results);
  } catch (error) {
    return next(error);
  }
});

router.get('/track/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    console.log('Fetching track with ID:', id);
    const track = await spotifyApiService.getTrack(req.session.accessToken!, id);
    return res.json(track);
  } catch (error) {
    console.error('Track fetch error for ID:', id, error);
    return next(error);
  }
});

router.get('/track/:id/features', async (req, res, next) => {
  const { id } = req.params;
  try {
    console.log('Fetching audio features for track ID:', id);
    const features = await spotifyApiService.getAudioFeatures(
      req.session.accessToken!,
      id
    );
    return res.json(features);
  } catch (error) {
    console.error('Audio features error for ID:', id, error);
    return next(error);
  }
});

router.get('/playlist/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    console.log('Fetching playlist details for ID:', id);
    const playlistDetails = await spotifyApiService.getPlaylistDetails(
      req.session.accessToken!,
      id
    );
    return res.json(playlistDetails);
  } catch (error) {
    console.error('Playlist details error for ID:', id, error);
    return next(error);
  }
});

router.get('/recommendations', async (req, res, next) => {
  try {
    const { seed_tracks, limit = 20, target_energy, target_valence } = req.query;

    if (!seed_tracks || typeof seed_tracks !== 'string') {
      return res.status(400).json({ error: 'Seed tracks required' });
    }

    console.log('Getting recommendations for seed tracks:', seed_tracks);
    
    const recommendations = await spotifyApiService.getRecommendations(
      req.session.accessToken!,
      seed_tracks,
      Number(limit),
      target_energy ? Number(target_energy) : undefined,
      target_valence ? Number(target_valence) : undefined
    );

    return res.json(recommendations);
  } catch (error: any) {
    console.error('Recommendations endpoint error:', error.message);
    if (error.message === 'Invalid track ID provided' || error.message === 'Unable to generate recommendations') {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

// Alternative simple recommendation endpoint
router.get('/simple-recommendations', async (req, res, next) => {
  try {
    const { track_name, artist_name, limit = 20 } = req.query;

    if (!track_name || typeof track_name !== 'string') {
      return res.status(400).json({ error: 'Track name required' });
    }

    console.log(`Getting simple recommendations for: ${track_name} by ${artist_name}`);
    
    // Search for similar tracks by the same artist
    const artistSearchQuery = artist_name ? `artist:${artist_name}` : track_name;
    const searchResults = await spotifyApiService.search(
      req.session.accessToken!,
      artistSearchQuery,
      'track',
      Number(limit)
    );

    // Also search for tracks with similar keywords
    const keywordResults = await spotifyApiService.search(
      req.session.accessToken!,
      track_name.split(' ')[0], // Use first word of track name
      'track',
      Number(limit) / 2
    );

    // Combine and deduplicate results
    const allTracks = [
      ...(searchResults.tracks?.items || []),
      ...(keywordResults.tracks?.items || [])
    ];

    // Remove duplicates by track ID
    const uniqueTracks = Array.from(
      new Map(allTracks.map((track: any) => [track.id, track])).values()
    ).slice(0, Number(limit));

    return res.json({ tracks: uniqueTracks, seeds: [] });
  } catch (error) {
    console.error('Simple recommendations error:', error);
    return next(error);
  }
});

router.get('/me/top/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const { limit = 20, time_range = 'medium_term' } = req.query;

    if (type !== 'artists' && type !== 'tracks') {
      return res.status(400).json({ error: 'Invalid type. Must be artists or tracks' });
    }

    const topItems = await spotifyApiService.getTopItems(
      req.session.accessToken!,
      type,
      Number(limit),
      time_range as string
    );

    return res.json(topItems);
  } catch (error) {
    return next(error);
  }
});

router.get('/featured', async (req, res, next) => {
  try {
    const { country = 'US', limit = 20 } = req.query;
    
    const featuredContent = await spotifyApiService.getFeaturedContent(
      req.session.accessToken!,
      country as string,
      Number(limit)
    );

    return res.json(featuredContent);
  } catch (error) {
    return next(error);
  }
});

router.get('/new-releases', async (req, res, next) => {
  try {
    const { country = 'US', limit = 20 } = req.query;
    
    const newReleases = await spotifyApiService.getNewReleases(
      req.session.accessToken!,
      country as string,
      Number(limit)
    );

    return res.json(newReleases);
  } catch (error) {
    return next(error);
  }
});

export default router;