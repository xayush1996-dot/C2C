import express from 'express';
import { getTrainingVideos } from '../controllers/trainingVideoController.js';

const router = express.Router();

router.get('/', getTrainingVideos);

export default router;
