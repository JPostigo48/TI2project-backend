import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "2025-1"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;