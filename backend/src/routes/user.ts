import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { userService } from '../services/userService';

const router = Router();

router.use(authMiddleware);

router.get('/profile', async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.session.userId!);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user._id,
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      email: user.email,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/preferences', async (req, res, next) => {
  try {
    const { preferences } = req.body;
    
    const user = await userService.updateUserPreferences(
      req.session.userId!,
      preferences
    );

    return res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const history = await userService.getUserHistory(
      req.session.userId!,
      Number(limit),
      Number(offset)
    );

    return res.json(history);
  } catch (error) {
    return next(error);
  }
});

export default router;