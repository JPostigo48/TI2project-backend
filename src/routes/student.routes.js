import express from 'express';
import { getUsers, getUserById, updateUser, disableUser } from '../controllers/user.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { getStudentDashboard } from '../controllers/dashboard.contoller.js';

const router = express.Router();

router.use(protect);

router.get('/summary', authorize('student'), getStudentDashboard);

export default router;