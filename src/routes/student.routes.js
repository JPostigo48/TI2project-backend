import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { getStudentDashboard, getStudentSchedule } from '../controllers/student.contoller.js';
import { getEnrollmentByCourse } from '../controllers/lab.controller.js';

const router = express.Router();

router.use(protect);

router.get('/summary', authorize('student'), getStudentDashboard);
router.get('/schedule', authorize('student'), getStudentSchedule);
router.get('/enrollment/:courseId', authorize('student'), getEnrollmentByCourse);

export default router;