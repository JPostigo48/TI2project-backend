import Section from '../models/section.model.js';
import RoomReservation from '../models/roomReservation.model.js';

export const getTeacherSchedule = async (req, res) => {
    try {
        const teacherId = req.user.id;
        
        // 1. Obtener Clases Regulares 
        const sections = await Section.find({ teacher: teacherId })
            .populate('course', 'name code')
            .populate('schedule.room', 'name code') 
            .lean(); 

        // 2. Obtener Reservas Activas (Futuras o de hoy)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reservations = await RoomReservation.find({ 
            teacher: teacherId,
            status: 'APPROVED',
            date: { $gte: today } 
        })
        .populate('room', 'name code') 
        .lean();

        // 3. Normalizar Reservas para que parezcan Secciones
        const formattedReservations = reservations.map(res => ({
            _id: res._id,
            type: 'reservation', 
            group: 'Reserva',
            course: { name: res.reason || 'Reserva de Ambiente', code: 'EXTRA' },
            schedule: res.blocks.map(blockNum => ({
                day: res.day,       
                startHour: blockNum, 
                duration: 1,         
                room: res.room  
            }))
        }));

        // 4. Unir y responder
        const combinedSchedule = [...sections, ...formattedReservations];
        
        res.json(combinedSchedule);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener el horario completo" });
    }
};