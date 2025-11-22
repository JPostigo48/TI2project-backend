import Room from '../models/room.model.js';
import RoomReservation from '../models/roomReservation.model.js';

// @desc    Get list of rooms
// @route   GET /api/rooms
// @access  Private (all roles)
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private (admin)
export const createRoom = async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid data' });
  }
};

// @desc    Reserve a room
// @route   POST /api/rooms/reserve
// @access  Private (teacher)
export const reserveRoom = async (req, res) => {
  const { roomId, date, startHour, duration, reason } = req.body;
  if (!roomId || !date || !startHour || !duration) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    // Convert date to a Date object
    const dateObj = new Date(date);
    // Check for overlapping reservations in same room and date
    const existing = await RoomReservation.find({
      room: roomId,
      date: dateObj,
    });
    const conflict = existing.some((r) => {
      const existingStart = r.startHour;
      const existingEnd = r.startHour + r.duration;
      const newStart = startHour;
      const newEnd = startHour + duration;
      return !(existingEnd <= newStart || existingStart >= newEnd);
    });
    if (conflict) {
      return res.status(400).json({ message: 'Room already reserved for that time' });
    }
    const reservation = await RoomReservation.create({
      room: roomId,
      teacher: req.user._id,
      date: dateObj,
      startHour,
      duration,
      reason,
    });
    res.status(201).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    List reservations
// @route   GET /api/rooms/reservations?room=roomId&date=YYYY-MM-DD
// @access  Private (teacher or admin)
export const listReservations = async (req, res) => {
  const { room, date } = req.query;
  const filter = {};
  if (room) filter.room = room;
  if (date) filter.date = new Date(date);
  try {
    const reservations = await RoomReservation.find(filter).populate('room', 'number').populate('teacher', 'name');
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};