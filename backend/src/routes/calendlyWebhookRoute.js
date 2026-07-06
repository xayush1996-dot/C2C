import express from 'express';
import { handleCalendlyWebhook } from '../controllers/calendlyWebhookController.js';

const router = express.Router();

router.post('/', handleCalendlyWebhook);

export default router;
