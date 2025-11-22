import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    status: { type: String, enum: ['enrolled', 'dropped'], default: 'enrolled' },
    preferences: { type: [String], default: [] }, // for lab preferences
  },
  { timestamps: true }
);

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;