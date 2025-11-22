import express from 'express';
import { setGrade, getGrades } from '../controllers/grade.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('teacher'), setGrade);
router.get('/', authorize('teacher', 'student'), getGrades);

export default router;