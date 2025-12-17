import User from '../models/user.model.js';
import Course from '../models/course.model.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [activeStudents, activeTeachers, courses] = await Promise.all([
      User.countDocuments({ role: 'student', active: true }),
      User.countDocuments({ role: 'teacher', active: true }),
      Course.countDocuments(),
    ]);
    res.json({ students: activeStudents, teachers: activeTeachers, courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};