import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    credits: { type: Number, default: 0 },
    hoursPerWeek: { type: Number, default: 0 },
    theoryHours: { type: Number, default: 0 },
    labHours: { type: Number, default: 0 },
    description: { type: String },
    syllabus: { type: String }, // path or link to syllabus file
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);
export default Course;