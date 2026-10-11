import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import { extractResults } from '../controllers/results.controller.js';
import { uploadPdfs } from '../middleware/upload.js';

const router = Router();

router.get('/health', getHealth);
router.post('/results/extract', uploadPdfs, extractResults);

export default router;
