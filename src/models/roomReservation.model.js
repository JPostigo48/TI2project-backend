import mongoose from 'mongoose';

const roomReservationSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Fecha específica de la reserva (Ej: 2025-11-26)
    date: { type: Date, required: true }, 
    
    // Día de la semana (Ej: "Wednesday"). Vital para validar cruces con clases regulares.
    day: { type: String, required: true }, 

    // Array de bloques ocupados. Ej: [1, 2] (De 7:00 a 8:40)
    blocks: [{ type: Number, required: true }], 

    reason: { type: String },
    
    status: {
        type: String,
        enum: ['APPROVED', 'CANCELLED', 'PENDING'],
        default: 'APPROVED'
    }
  },
  { timestamps: true }
);

// Índices para búsqueda rápida de conflictos
roomReservationSchema.index({ room: 1, date: 1 });
roomReservationSchema.index({ teacher: 1, date: 1 });

const RoomReservation = mongoose.model('RoomReservation', roomReservationSchema);
export default RoomReservation;