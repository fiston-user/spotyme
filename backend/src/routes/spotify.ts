import { Router } from 'express';
import { spotifyApiService } from '../services/spotifyApi';
import { authMiddleware } from '../middleware/auth';
import { spotifyApiLimiter } from '../middleware/rateLimiter';

const router = Router();

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
  try {
    const { id } = req.params;
    const track = await spotifyApiService.getTrack(req.session.accessToken!, id);
    return res.json(track);
  } catch (error) {
    return next(error);
  }
});

router.get('/track/:id/features', async (req, res, next) => {
  try {
    const { id } = req.params;
    const features = await spotifyApiService.getAudioFeatures(
      req.session.accessToken!,
      id
    );
    return res.json(features);
  } catch (error) {
    return next(error);
  }
});

router.get('/recommendations', async (req, res, next) => {
  try {
    const { seed_tracks, limit = 20 } = req.query;

    if (!seed_tracks || typeof seed_tracks !== 'string') {
      return res.status(400).json({ error: 'Seed tracks required' });
    }

    const recommendations = await spotifyApiService.getRecommendations(
      req.session.accessToken!,
      seed_tracks,
      Number(limit)
    );

    return res.json(recommendations);
  } catch (error) {
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

export default router;