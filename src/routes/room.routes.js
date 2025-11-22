import express from 'express';
import { getRooms, createRoom, reserveRoom, listReservations } from '../controllers/room.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getRooms);
router.post('/', authorize('admin'), createRoom);

router.post('/reserve', authorize('teacher'), reserveRoom);
router.get('/reservations', authorize('teacher', 'admin'), listReservations);

export default router;