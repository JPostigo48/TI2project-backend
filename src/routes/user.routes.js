import express from 'express';
import { getUsers, getUserById, updateUser, disableUser } from '../controllers/user.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply authentication to all routes below
router.use(protect);

// Admin: list all users
router.get('/', authorize('admin'), getUsers);

// Get a user by ID (admin or same user)
router.get('/:id', (req, res, next) => {
  // If user is admin or requesting own profile, proceed to controller
  if (req.user.role === 'admin' || req.user._id.toString() === req.params.id) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden' });
}, getUserById);

// Update a user (admin or same user)
router.put('/:id', (req, res, next) => {
  if (req.user.role === 'admin' || req.user._id.toString() === req.params.id) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden' });
}, updateUser);

// Disable a user (admin)
router.delete('/:id', authorize('admin'), disableUser);

export default router;