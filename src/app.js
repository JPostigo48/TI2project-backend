import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/db.js';

// Import route files
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import courseRoutes from './routes/course.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import gradeRoutes from './routes/grade.routes.js';
import roomRoutes from './routes/room.routes.js';
import sectionRoutes from './routes/section.routes.js';
import semesterRoutes from './routes/semester.routes.js';
import studentRoutes from './routes/student.routes.js';
import labRoutes from './routes/lab.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to database
connectDB();

// Middleware

const whitelist = [
  'http://localhost:5173',     
  'https://ti-2project-frontend.vercel.app',
  'https://sistema-academico-sooty.vercel.app'
];
app.use(cors({
  origin: whitelist,
  credentials: true,
  allowedHeaders: ["Content-Type","Authorization"]
}));
app.use(express.json());

// Logging middleware only in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'la API está funcionando' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

export default app;