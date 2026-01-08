import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // Ej: "A-101"
    name: { type: String, required: true }, // Ej: "Aula 101"
    capacity: { type: Number, required: true },
    location: { type: String, required: true }, // Ej: "Piso 2"
    type: { 
        type: String, 
        enum: ['theory', 'lab'], 
        default: 'theory' 
    }
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;