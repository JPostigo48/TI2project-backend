// models/grade.model.js
import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    score: { type: Number, default: null }, // 0..20 o null
  },
  { _id: false }
);

const weightSchema = new mongoose.Schema(
  {
    continuous: { type: Number, default: 15 }, // Cx
    exam: { type: Number, default: 15 },       // Exx
  },
  { _id: false }
);

const gradeSchema = new mongoose.Schema(
  {
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Notas
    partials: {
      P1: {
        continuous: { type: scoreSchema, default: () => ({}) }, // C1
        exam: { type: scoreSchema, default: () => ({}) },       // Ex1
      },
      P2: {
        continuous: { type: scoreSchema, default: () => ({}) }, // C2
        exam: { type: scoreSchema, default: () => ({}) },       // Ex2
      },
      P3: {
        continuous: { type: scoreSchema, default: () => ({}) }, // C3
        exam: { type: scoreSchema, default: () => ({}) },       // Ex3
      },
    },

    // ✅ Pesos globales (suman 100 entre los 6)
    weights: {
      P1: { type: weightSchema, default: () => ({ continuous: 15, exam: 15 }) },
      P2: { type: weightSchema, default: () => ({ continuous: 15, exam: 15 }) },
      P3: { type: weightSchema, default: () => ({ continuous: 20, exam: 20 }) },
    },

    // ✅ Sustitutivo aparte
    substitutive: { type: Number, default: null }, // 0..20 o null
  },
  { timestamps: true }
);

gradeSchema.index({ section: 1, student: 1 }, { unique: true });

const Grade = mongoose.model("Grade", gradeSchema);
export default Grade;
