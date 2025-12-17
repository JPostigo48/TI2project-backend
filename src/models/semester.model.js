import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, 
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    labEnrollment: {
      status: {
        type: String,
        enum: ['not_started', 'open', 'processing', 'processed'],
        default: 'not_started',
      },
      openedAt: { type: Date },
      closedAt: { type: Date },
      processedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;
