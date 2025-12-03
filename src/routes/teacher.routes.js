import { Router } from 'express';
import { getTeacherSchedule, getTeachersList } from '../controllers/teacher.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);
router.get('/', authorize('secretary','admin'), getTeachersList);
router.get('/schedule', authorize('teacher'), getTeacherSchedule);

export default router;