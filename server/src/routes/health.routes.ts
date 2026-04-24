import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

router.get('/', healthCheck);
router.get('/ping', (_req, res) => res.json({ pong: true, ts: Date.now() }));

export default router;