import express from 'express';
import { getCourses, createCourse, updateCourse, deleteCourse, getCourseSections } from '../controllers/course.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public? Actually require authentication for all course routes
router.use(protect);

router.get('/', getCourses);
router.post('/', authorize('admin', 'secretary'), createCourse);

router.get('/:id/sections', getCourseSections);
router.put('/:id', authorize('admin', 'secretary'), updateCourse);
router.delete('/:id', authorize('admin', 'secretary'), deleteCourse);

export default router;