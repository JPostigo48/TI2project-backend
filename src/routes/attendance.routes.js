import express from 'express';
import { openSession, markAttendance, listSessions } from '../controllers/attendance.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Teachers: open new attendance session
router.post('/', authorize('teacher'), openSession);

// Teachers: mark attendance for a student
router.patch('/:sessionId/entry/:studentId', authorize('teacher'), markAttendance);

// List sessions (teacher or student)
router.get('/', authorize('teacher', 'student'), listSessions);

export default router;