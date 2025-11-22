import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
    name: { type: String, required: true }, // e.g. "A", "B", "Lab 01"
    type: { type: String, enum: ['theory', 'lab'], default: 'theory' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    schedule: [
      {
        day: { type: String }, // Monday, Tuesday, etc.
        startHour: { type: Number }, // 1-15 per requirement
        duration: { type: Number }, // number of hours consecutively
        room: { type: String },
      },
    ],
    capacity: { type: Number, default: 0 },
    enrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Section = mongoose.model('Section', sectionSchema);
export default Section;