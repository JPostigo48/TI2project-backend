import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema(
  {
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    evaluation: { type: String, required: true }, // e.g. "Parcial 1", "Práctica 1"
    weight: { type: Number, default: 0 },
    score: { type: Number, min: 0, max: 20 },
  },
  { timestamps: true }
);

const Grade = mongoose.model('Grade', gradeSchema);
export default Grade;