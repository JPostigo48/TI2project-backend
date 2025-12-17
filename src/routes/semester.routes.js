import express from 'express';
import { closeLabEnrollment, createSemester, editSemester, getLabEnrollmentResults, listSemesters, openLabEnrollment, preprocessLabEnrollment, processLabEnrollment } from '../controllers/semester.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/create', protect, authorize('admin', 'secretary'), createSemester);
router.post('/:semesterId/edit', protect, authorize('admin', 'secretary'), editSemester);
router.post('/:semesterId/labs/open', protect, authorize('admin', 'secretary'), openLabEnrollment);
router.post('/:semesterId/labs/preprocess', protect, authorize('admin', 'secretary'), preprocessLabEnrollment);
router.post('/:semesterId/labs/close', protect, authorize('admin', 'secretary'), closeLabEnrollment);
router.post('/:semesterId/labs/process', protect, authorize('admin', 'secretary'), processLabEnrollment);
router.get('/:semesterId/labs/results', protect, authorize('admin', 'secretary'), getLabEnrollmentResults);
router.get('/list', protect, listSemesters);

export default router;
