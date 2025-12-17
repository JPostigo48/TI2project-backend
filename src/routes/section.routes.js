import express from 'express';
import { createSection, editSection, listSections } from '../controllers/section.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren usuario autenticado
router.use(protect);

// Crear una sección (teoría o lab)
router.post('/', authorize('admin', 'secretary'), createSection);

// Listar secciones (con filtros opcionales)
router.get('/', authorize('admin', 'secretary', 'teacher', 'student'), listSections);
router.post('/:sectionId/edit', protect, authorize('admin', 'secretary'), editSection);

export default router;
