import express from 'express';
import {
  getAdminTrainingVideos,
  createTrainingVideo,
  updateTrainingVideo,
  deleteTrainingVideo
} from '../controllers/trainingVideoController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protectAdmin, getAdminTrainingVideos);
router.post('/', protectAdmin, createTrainingVideo);
router.put('/:id', protectAdmin, updateTrainingVideo);
router.delete('/:identifier', protectAdmin, deleteTrainingVideo);

export default router;
