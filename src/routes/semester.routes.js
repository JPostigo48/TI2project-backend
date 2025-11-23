import express from 'express';
import { createSemester, listSemesters } from '../controllers/semester.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, authorize('admin', 'secretary'), createSemester);
router.get('/', protect, listSemesters);

export default router;
