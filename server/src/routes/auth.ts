import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { error: 'Too many authentication attempts, please try again later' },
  // The integration suite signs in dozens of times in a few seconds; throttling
  // it would only ever test the limiter. Production behaviour is untouched.
  skip: () => process.env.NODE_ENV === 'test'
});

router.post('/login', authLimiter, login);
router.get('/me', requireAuth, getMe);

export default router;
