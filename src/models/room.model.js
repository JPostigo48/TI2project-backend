import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;