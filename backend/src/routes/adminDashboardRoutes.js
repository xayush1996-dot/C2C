import express from 'express';
import { getDashboardSummary } from '../controllers/adminDashboardController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', protectAdmin, getDashboardSummary);

export default router;
