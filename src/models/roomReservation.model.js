import mongoose from 'mongoose';

const roomReservationSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    startHour: { type: Number, required: true },
    duration: { type: Number, required: true }, // number of hours reserved
    reason: { type: String },
  },
  { timestamps: true }
);

const RoomReservation = mongoose.model('RoomReservation', roomReservationSchema);
export default RoomReservation;