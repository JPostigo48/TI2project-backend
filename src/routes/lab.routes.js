// src/routes/lab.routes.js
import express from 'express';
import {
  createLabGroup,
  listLabGroups,
  submitPreferences,
  assignLabGroups,
} from '../controllers/lab.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.post('/groups', authorize('secretary'), createLabGroup);
router.get('/groups', authorize('student', 'secretary', 'teacher'), listLabGroups);
router.post('/preferences', authorize('student'), submitPreferences);
router.post('/assign', authorize('secretary'), assignLabGroups);

export default router;
