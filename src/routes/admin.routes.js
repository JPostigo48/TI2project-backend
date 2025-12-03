import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { getDashboardStats } from '../controllers/admin.controller.js';
import { createUser, resetPassword } from '../controllers/user.controller.js';

const router = express.Router();

// Todas las rutas de este archivo requieren autenticación y rol de admin
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Gestión de usuarios
router.post('/users', createUser);
router.patch('/users/:id/reset-password', resetPassword);

export default router;