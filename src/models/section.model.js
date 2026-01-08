import mongoose from 'mongoose';

const { Schema } = mongoose;

const sectionSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true },
    curriculum: { type: String, default: '2025' },
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

sectionSchema.pre('validate', async function (next) {
  if (!this.isModified('course') && !this.isModified('type') && !this.isModified('group')) {
    return next();
  }

  // Poblar course si no está poblado
  await this.populate('course');

  if (!this.course || !this.course.code) {
    return next(new Error('Código de curso no encontrado'));
  }

  const prefix = this.type === 'lab' ? 'L' : 'T';
  this.code = `${prefix}${this.course.code}-${this.group}`;

  next();
});


sectionSchema.index({ code: 1 }, { unique: true });

const Section = mongoose.model('Section', sectionSchema);
export default Section;