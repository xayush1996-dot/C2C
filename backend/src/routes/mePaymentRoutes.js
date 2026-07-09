import express from 'express';
import { getMyPayments, getMyPaymentById, getMyInvoicePdf } from '../controllers/paymentController.js';
import { protectCustomer } from '../middleware/auth.js';

const router = express.Router();

// Customer payment retrieval routes
router.get('/', protectCustomer, getMyPayments);
router.get('/:id', protectCustomer, getMyPaymentById);
router.get('/:id/invoice', protectCustomer, getMyInvoicePdf);

export default router;
