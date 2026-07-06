import express from 'express';
import { getAllPayments, getPaymentById } from '../controllers/adminPaymentController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin-only payment dashboard routes
router.get('/', protectAdmin, getAllPayments);
router.get('/:id', protectAdmin, getPaymentById);

export default router;
