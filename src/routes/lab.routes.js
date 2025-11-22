import express from 'express';
import { createLabGroup, listLabGroups, submitPreferences, assignLabGroups } from '../controllers/lab.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Create a lab group
router.post('/groups', authorize('secretary'), createLabGroup);

// List lab groups
router.get('/groups', authorize('student', 'secretary', 'teacher'), listLabGroups);

// Submit preferences
router.post('/preferences', authorize('student'), submitPreferences);

// Assign lab groups
router.post('/assign', authorize('secretary'), assignLabGroups);

export default router;