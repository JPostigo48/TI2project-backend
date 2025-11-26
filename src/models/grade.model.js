import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  evaluation: { type: String, required: true }, // "P1", "P2", "P3", "SUB"
  
  components: {
      continuous: { type: Number },
      exam: { type: Number },
      value: { type: Number } // Para susti
  },
  
  weight: { type: Number, default: 1 }
}, { timestamps: true });

const Grade = mongoose.model('Grade', gradeSchema);
export default Grade;