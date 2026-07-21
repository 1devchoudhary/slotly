import { Router } from 'express';
import { 
  getServices, 
  getStaff, 
  getAvailability, 
  createBooking, 
  getBookingByToken, 
  cancelBooking 
} from '../controllers/public.controller';

const router = Router();

router.get('/services', getServices);
router.get('/staff', getStaff);
router.get('/availability', getAvailability);
router.post('/bookings', createBooking);
router.get('/bookings/manage/:token', getBookingByToken);
router.post('/bookings/manage/:token/cancel', cancelBooking);

export default router;
