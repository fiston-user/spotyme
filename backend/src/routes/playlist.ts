import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { playlistService } from '../services/playlistService';
import { spotifyApiService } from '../services/spotifyApi';

const router = Router();

router.use(authMiddleware);

router.post('/generate', async (req, res, next) => {
  try {
    const { seedTracks, name, description, options, selectedTracks } = req.body;

    if (!seedTracks || !Array.isArray(seedTracks) || seedTracks.length === 0) {
      return res.status(400).json({ error: 'Seed tracks required' });
    }

    // If selectedTracks are provided, save those directly instead of generating new ones
    if (selectedTracks && Array.isArray(selectedTracks) && selectedTracks.length > 0) {
      const playlist = await playlistService.createPlaylistWithTracks(
        req.session.accessToken!,
        req.session.userId!,
        selectedTracks,
        {
          name: name || 'SpotYme Generated Playlist',
          description: description || 'Created with SpotYme',
          seedTracks,
          ...options
        }
      );
      return res.json(playlist);
    }

    // Otherwise, generate recommendations as before
    const playlist = await playlistService.generatePlaylist(
      req.session.accessToken!,
      req.session.userId!,
      seedTracks,
      {
        name: name || 'SpotYme Generated Playlist',
        description: description || 'Created with SpotYme',
        ...options
      }
    );

    return res.json(playlist);
  } catch (error) {
    return next(error);
  }
});

router.get('/my-playlists', async (req, res, next) => {
  try {
    const playlists = await playlistService.getUserPlaylists(req.session.userId!);
    return res.json(playlists);
  } catch (error) {
    return next(error);
  }
});

router.get('/user', async (req, res, next) => {
  try {
    const playlists = await playlistService.getUserPlaylists(req.session.userId!);
    return res.json(playlists);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const playlist = await playlistService.getPlaylist(id, req.session.userId!);
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    return res.json(playlist);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await playlistService.deletePlaylist(id, req.session.userId!);
    return res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/export-to-spotify', async (req, res, next) => {
  try {
    const { id } = req.params;
    const playlist = await playlistService.getPlaylist(id, req.session.userId!);
    
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const spotifyPlaylist = await spotifyApiService.createPlaylist(
      req.session.accessToken!,
      req.session.userId!,
      playlist.name,
      playlist.description,
      playlist.tracks.map(t => t.spotifyId)
    );

    return res.json({ 
      message: 'Playlist exported to Spotify successfully',
      spotifyUrl: spotifyPlaylist.external_urls.spotify
    });
  } catch (error) {
    return next(error);
  }
});

export default router;