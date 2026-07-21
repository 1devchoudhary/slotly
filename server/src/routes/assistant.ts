import { Router } from 'express';
import { chatWithAssistant } from '../controllers/assistant.controller';
import rateLimit from 'express-rate-limit';

const router = Router();

const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests to assistant, please try again later' }
});

router.post('/chat', assistantLimiter, chatWithAssistant);

export default router;
