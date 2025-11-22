import mongoose from 'mongoose';

const attendanceEntrySchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
  },
  { _id: false }
);

const attendanceSessionSchema = new mongoose.Schema(
  {
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    date: { type: Date, required: true },
    week: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    entries: [attendanceEntrySchema],
  },
  { timestamps: true }
);

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
export default AttendanceSession;