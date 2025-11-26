import mongoose from 'mongoose';

const { Schema } = mongoose;

const sectionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true }, // '2025-A', '2025-B', etc.
    type: { type: String, enum: ['theory', 'lab'], default: 'theory' },
    group: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    schedule: [
      {
        day: { type: String }, // Monday, Tuesday, etc.
        startHour: { type: Number }, // 1-15 
        duration: { type: Number }, // cantidad de horas consecutivas
        room: { type: Schema.Types.ObjectId, ref: 'Room' },
      },
    ],
    capacity: { type: Number, default: 0 },
    enrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

sectionSchema.index(
  { course: 1, semester: 1, type: 1, group: 1 },
  { unique: true }
);

const Section = mongoose.model('Section', sectionSchema);
export default Section;