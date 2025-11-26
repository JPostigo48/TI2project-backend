import { Router } from 'express';
import { getTeacherSchedule } from '../controllers/teacher.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);
router.get('/schedule', authorize('teacher'), getTeacherSchedule);

export default router;