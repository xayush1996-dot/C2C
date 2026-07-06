import express from 'express';
import {
  getEnquiriesReport,
  getPaymentsReport,
  getBookingsReport,
  getCustomersReport
} from '../controllers/adminReportController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/enquiries', protectAdmin, getEnquiriesReport);
router.get('/payments', protectAdmin, getPaymentsReport);
router.get('/bookings', protectAdmin, getBookingsReport);
router.get('/customers', protectAdmin, getCustomersReport);

export default router;
