import express from 'express';
import { updateService } from '../controllers/serviceController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.put('/:id', protectAdmin, updateService);

export default router;
