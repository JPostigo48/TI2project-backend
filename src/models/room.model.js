import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    location: { type: String, required: true },
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;