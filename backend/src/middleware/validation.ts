import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

// Helper to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg
      }))
    });
    return;
  }
  next();
};

// Sanitize string input to prevent XSS
const sanitizeString = (value: string): string => {
  return value
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Auth validation rules
export const authValidation = {
  callback: [
    query('code').optional().isString().trim(),
    query('state').optional().isString().isLength({ min: 32, max: 128 }),
    query('error').optional().isString().trim(),
    handleValidationErrors
  ],
  
  exchange: [
    body('sessionToken').notEmpty().isString().trim(),
    handleValidationErrors
  ],
  
  refresh: [
    body('refreshToken').notEmpty().isString().trim(),
    handleValidationErrors
  ]
};

// Playlist validation rules
export const playlistValidation = {
  generate: [
    body('seedTracks').isArray({ min: 1, max: 5 }).withMessage('Seed tracks must be 1-5 items'),
    body('seedTracks.*').isString().matches(/^[a-zA-Z0-9]{22}$/),
    body('name').optional().isString().isLength({ max: 100 }).customSanitizer(sanitizeString),
    body('description').optional().isString().isLength({ max: 300 }).customSanitizer(sanitizeString),
    body('options.targetEnergy').optional().isFloat({ min: 0, max: 1 }),
    body('options.targetValence').optional().isFloat({ min: 0, max: 1 }),
    body('selectedTracks').optional().isArray({ max: 100 }),
    handleValidationErrors
  ],
  
  getById: [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    handleValidationErrors
  ],
  
  deleteById: [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    handleValidationErrors
  ],
  
  exportToSpotify: [
    param('id').isMongoId().withMessage('Invalid playlist ID'),
    handleValidationErrors
  ]
};

// Spotify API validation rules
export const spotifyValidation = {
  search: [
    query('q').notEmpty().isString().isLength({ max: 200 }).customSanitizer(sanitizeString),
    query('type').optional().isIn(['track', 'artist', 'album', 'playlist']),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    handleValidationErrors
  ],
  
  getTrack: [
    param('id').matches(/^[a-zA-Z0-9]{22}$/).withMessage('Invalid Spotify track ID'),
    handleValidationErrors
  ],
  
  recommendations: [
    query('seed_tracks').notEmpty().isString().matches(/^[a-zA-Z0-9,]{22,}$/),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('target_energy').optional().isFloat({ min: 0, max: 1 }).toFloat(),
    query('target_valence').optional().isFloat({ min: 0, max: 1 }).toFloat(),
    handleValidationErrors
  ],
  
  simpleRecommendations: [
    query('track_name').notEmpty().isString().isLength({ max: 200 }).customSanitizer(sanitizeString),
    query('artist_name').optional().isString().isLength({ max: 200 }).customSanitizer(sanitizeString),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    handleValidationErrors
  ],
  
  topItems: [
    param('type').isIn(['artists', 'tracks']),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('time_range').optional().isIn(['short_term', 'medium_term', 'long_term']),
    handleValidationErrors
  ]
};

// User validation rules
export const userValidation = {
  updatePreferences: [
    body('preferences.favoriteGenres').optional().isArray({ max: 10 }),
    body('preferences.favoriteGenres.*').optional().isString().isLength({ max: 50 }),
    body('preferences.energyPreference').optional().isFloat({ min: 0, max: 1 }),
    body('preferences.valencePreference').optional().isFloat({ min: 0, max: 1 }),
    handleValidationErrors
  ],
  
  getHistory: [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    handleValidationErrors
  ]
};

// MongoDB ID validation helper
export const validateMongoId = (fieldName: string): ValidationChain => {
  return param(fieldName).isMongoId().withMessage(`Invalid ${fieldName}`);
};

// Generic sanitization middleware
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    });
  }
  
  next();
};