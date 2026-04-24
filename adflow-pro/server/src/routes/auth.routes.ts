import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  getNotifications,
  markNotificationRead,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema } from '../../../shared/schemas/user.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);

// Notifications (mounted under /api/notifications)
router.get('/', authMiddleware, getNotifications);
router.patch('/:id/read', authMiddleware, markNotificationRead);
router.patch('/read-all', authMiddleware, async (req, res) => {
  const { supabase } = await import('../db/connect');
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', (req as any).user.id);
  res.json({ success: true });
});

export default router;