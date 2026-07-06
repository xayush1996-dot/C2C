import express from 'express';
import { getCustomers, getCustomerById } from '../controllers/adminCustomerController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protectAdmin, getCustomers);
router.get('/:id', protectAdmin, getCustomerById);

export default router;
