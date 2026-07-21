import { Router } from 'express';
import { listBookings, getStats, updateBookingStatus } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Everything below is staff-only. Customers never reach these.
router.use(requireAuth, requireRole('admin', 'staff'));

router.get('/bookings', listBookings);
router.get('/stats', getStats);
router.patch('/bookings/:id', updateBookingStatus);

export default router;
