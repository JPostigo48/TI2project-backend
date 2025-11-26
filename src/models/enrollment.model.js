import mongoose from 'mongoose';

const { Schema } = mongoose;

const enrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    section: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },

    status: {
      type: String,
      enum: ['pending', 'enrolled', 'dropped'],
      default: 'enrolled',
    },

    // Preferencias de Laboratorio (Aquí guardas las secciones tipo 'lab' que el alumno quiere)
    labPreferences: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Section', 
      },
    ],
    
    finalGrade: { type: Number, default: null }
  },
  { timestamps: true }
);

// Índice compuesto para evitar duplicados
enrollmentSchema.index(
  { student: 1, section: 1 }, 
  { unique: true }
);

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;