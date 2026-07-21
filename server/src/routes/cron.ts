import { Router } from 'express';
import { resetDemo } from '../controllers/cron.controller';

const router = Router();

// Vercel Cron issues GET requests; POST is here for manual triggering.
router.get('/reset', resetDemo);
router.post('/reset', resetDemo);

export default router;
