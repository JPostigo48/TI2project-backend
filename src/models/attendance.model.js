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
    date: { type: Date, required: true }, // se normaliza a 00:00:00
    week: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    entries: [attendanceEntrySchema],
  },
  { timestamps: true }
);

attendanceSessionSchema.index({ section: 1, date: 1 }, { unique: true });

attendanceSessionSchema.pre('validate', function (next) {
  if (this.date instanceof Date && !isNaN(this.date.getTime())) {
    this.date.setHours(0, 0, 0, 0);
  }
  next();
});

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
export default AttendanceSession;
