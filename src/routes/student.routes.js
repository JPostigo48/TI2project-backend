import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { getCourseAttendance, getMyCourses, getStudentDashboard, getStudentSchedule } from '../controllers/student.contoller.js';
import { getEnrollmentByCourse } from '../controllers/lab.controller.js';

const router = express.Router();

router.use(protect);

router.get('/summary', authorize('student'), getStudentDashboard);
router.get('/courses', authorize('student'), getMyCourses);
router.get('/schedule', authorize('student'), getStudentSchedule);
router.get('/attendance/:courseId', authorize('student'), getCourseAttendance);
router.get('/enrollment/:courseId', authorize('student'), getEnrollmentByCourse);

export default router;