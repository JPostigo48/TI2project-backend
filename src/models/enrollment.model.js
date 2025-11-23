import mongoose from 'mongoose';

const { Schema } = mongoose;

const enrollmentSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Sección finalmente asignada (por ejemplo, grupo de lab elegido)
    section: { type: Schema.Types.ObjectId, ref: 'Section' }, // ya NO required al inicio

    // Curso / semestre para poder crear la inscripción aun sin sección final
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    semester: { type: String, required: true }, // '2025-A', '2025-B', etc.

    // Estado de la inscripción respecto al lab
    status: {
      type: String,
      enum: ['pending', 'enrolled', 'dropped'],
      default: 'pending',
    },

    // Preferencias de grupo de LAB, en orden (1ra opción, 2da, 3ra...)
    labPreferences: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Section', // deben ser secciones de tipo "lab"
      },
    ],
  },
  { timestamps: true }
);

// Para evitar que un alumno tenga dos inscripciones para el mismo curso/semestre
enrollmentSchema.index(
  { student: 1, course: 1, semester: 1 },
  { unique: true }
);

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
