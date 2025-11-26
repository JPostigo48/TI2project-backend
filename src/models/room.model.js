import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // Ej: "A-101"
    name: { type: String, required: true }, // Ej: "Aula Magna"
    capacity: { type: Number, required: true },
    location: { type: String, required: true }, // Ej: "Pabellón B"
    type: { 
        type: String, 
        enum: ['theory', 'lab', 'auditorium'], 
        default: 'theory' 
    }
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;