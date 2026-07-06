import express from 'express';
import { updateContent } from '../controllers/contentController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.put('/', protectAdmin, updateContent);

export default router;
