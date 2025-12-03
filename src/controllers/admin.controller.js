import User from '../models/user.model.js';
import Course from '../models/course.model.js';

/**
 * @desc Obtiene estadísticas para el dashboard de administrador.
 * Devuelve conteos de alumnos activos, docentes activos y cursos existentes.
 * En el futuro se podrían incluir más métricas como sesiones activas o
 * frecuencia de uso.
 * @route GET /api/admin/dashboard
 * @access Privado (solo admin)
 */
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