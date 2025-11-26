import Section from '../models/section.model.js';
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
  // 1. CORRECCIÓN: Agregamos 'date' aquí para leer lo que manda el front
  const { roomId, day, blocks, reason, date } = req.body; 
  const teacherId = req.user.id;

  // Validaciones básicas
  if (!roomId || !day || !blocks || blocks.length === 0 || !date) {
    return res.status(400).json({ message: "Faltan datos para la reserva." });
  }

  try {
    // 1. VALIDAR SI EL PROFESOR ESTÁ LIBRE
    const teacherConflicts = await Section.find({
      teacher: teacherId,
      'schedule.day': day,
      'schedule.startHour': { $in: blocks }
    });

    if (teacherConflicts.length > 0) {
        return res.status(409).json({ message: "Ya tienes clase asignada en ese horario." });
    }

    // 2. VALIDAR SI EL AULA ESTÁ LIBRE (Clases Regulares)
    const roomScheduleConflicts = await Section.find({
        'schedule.room': roomId,
        'schedule.day': day,
        'schedule.startHour': { $in: blocks }
    });

    if (roomScheduleConflicts.length > 0) {
        return res.status(409).json({ message: "El aula está ocupada por una clase regular." });
    }

    // 3. VALIDAR SI EL AULA ESTÁ LIBRE (Otras Reservas)
    // CORRECCIÓN: Usamos RoomReservation en lugar de Reservation
    const reservationConflicts = await RoomReservation.find({
        room: roomId,
        day: day,
        blocks: { $in: blocks },
        status: 'APPROVED' 
    });

    if (reservationConflicts.length > 0) {
        return res.status(409).json({ message: "El aula ya tiene una reserva confirmada en este horario." });
    }

    // 4. CREAR RESERVA
    // CORRECCIÓN: Usamos RoomReservation
    const newReservation = new RoomReservation({
        teacher: teacherId,
        room: roomId,
        date: new Date(date), // CORRECCIÓN: Usamos la fecha elegida, no la de hoy
        day: day,        
        blocks: blocks, 
        reason,
        status: 'APPROVED'
    });

    await newReservation.save();
    res.json(newReservation);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al procesar la reserva." });
  }
};

// @desc    List reservations
// @route   GET /api/rooms/reservations?room=roomId&date=YYYY-MM-DD
// @access  Private (teacher or admin)
export const listReservations = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { history } = req.query; 

    const filter = { teacher: teacherId };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (history === 'true') {
        filter.date = { $lt: today };
    } else {
        filter.date = { $gte: today };
    }

    const reservations = await RoomReservation.find(filter)
        .populate('room', 'name code location')
        .sort({ date: 1, 'blocks.0': 1 }); 

    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};