import express from 'express';
import { getAllBookings, getBookingById } from '../controllers/adminBookingController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protectAdmin, getAllBookings);
router.get('/:id', protectAdmin, getBookingById);

export default router;
