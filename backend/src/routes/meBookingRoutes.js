import express from 'express';
import { getMyBookings, getMyBookingById } from '../controllers/meBookingController.js';
import { protectCustomer } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protectCustomer, getMyBookings);
router.get('/:id', protectCustomer, getMyBookingById);

export default router;
