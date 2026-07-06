import express from 'express';
import { 
  getAllEnquiries, 
  getEnquiryById, 
  updateEnquiryStatus 
} from '../controllers/adminEnquiriesController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// All administrative routes are protected
router.get('/', protectAdmin, getAllEnquiries);
router.get('/:id', protectAdmin, getEnquiryById);
router.patch('/:id/status', protectAdmin, updateEnquiryStatus);

export default router;
