import express from 'express';
import { login, register } from '../controllers/auth.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public login
router.post('/login', login);

// Register new user (admin only)
router.post('/register', protect, authorize('admin'), register);

export default router;