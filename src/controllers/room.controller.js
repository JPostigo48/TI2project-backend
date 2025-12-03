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

// @desc    Obtener el horario completo de un aula (clases + reservas)
// @route   GET /api/rooms/:id/schedule
// @access  Private (admin, secretary, teacher, student)
export const getRoomSchedule = async (req, res) => {
  const roomId = req.params.id;

  try {
    // 1. Verificar que el aula exista
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Aula no encontrada' });
    }

    // 2. Bloques provenientes de SECTIONS (clases regulares)
    const sections = await Section.find({ 'schedule.room': roomId })
      .populate('course', 'name code')
      .populate('teacher', 'name');

    const sectionBlocks = [];
    sections.forEach((section) => {
      section.schedule.forEach((slot) => {
        if (!slot.room || slot.room.toString() !== roomId) return;

        sectionBlocks.push({
          source: 'section',
          type: section.type || 'theory', // 'theory' | 'lab'
          day: slot.day,                  // 'Monday', 'Tuesday', etc.
          startHour: slot.startHour,      // 1–15
          duration: slot.duration || 1,
          room: {
            _id: room._id,
            name: room.name,
            code: room.code,
          },
          courseName: section.course?.name || 'Curso',
          courseCode: section.course?.code || '',
          group: section.group || null,
          teacher: section.teacher
            ? { _id: section.teacher._id, name: section.teacher.name }
            : null,
        });
      });
    });

    // 3. Bloques provenientes de RESERVAS
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservations = await RoomReservation.find({
      room: roomId,
      status: 'APPROVED',
      date: { $gte: today },
    }).populate('teacher', 'name');

    const reservationBlocks = [];
    reservations.forEach((resv) => {
      // Cada bloque es una hora académica (1,2,3,...)
      (resv.blocks || []).forEach((blockHour) => {
        reservationBlocks.push({
          source: 'reservation',
          type: 'reservation',
          day: resv.day,           // 'Monday', ...
          startHour: blockHour,    // número de hora
          duration: 1,
          room: {
            _id: room._id,
            name: room.name,
            code: room.code,
          },
          courseName: resv.reason || 'Reserva de aula',
          courseCode: '',
          group: null,
          teacher: resv.teacher
            ? { _id: resv.teacher._id, name: resv.teacher.name }
            : null,
        });
      });
    });

    // 4. Unimos todo en un solo arreglo de bloques
    const blocks = [...sectionBlocks, ...reservationBlocks];

    return res.json(blocks);
  } catch (error) {
    console.error('Error en getRoomSchedule:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};