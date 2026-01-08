import Enrollment from '../models/enrollment.model.js';
import Semester from '../models/semester.model.js';
import Section from '../models/section.model.js';
import AttendanceSession from '../models/attendance.model.js';
import * as dashboardService from '../services/dashboard.service.js';

export const getStudentDashboard = async (req, res) => {
    try {
        // Obtenemos ID del usuario (desde el token o hardcodeado si estás probando)
        const studentId = req.user.id; 

        // Delegamos TODA la responsabilidad al servicio
        const data = await dashboardService.getStudentDashboardData(studentId);

        res.json(data);

    } catch (error) {
        console.error("Dashboard Controller Error:", error);
        res.status(500).json({ message: "Error interno al procesar dashboard" });
    }
};

export const getStudentSchedule = async (req, res) => {
  try {
    const studentId = req.user._id;
    const enrollments = await Enrollment.find({
      student: studentId,
      status: 'enrolled',
    }).populate({
      path: 'section',
      populate: [
        { path: 'course' },
        { path: 'teacher', select: 'name' },
        { path: 'schedule.room', select: 'name code' },
      ],
    });

    const blocks = [];
    enrollments.forEach((enr) => {
      const sec = enr.section;
      if (!sec || !sec.schedule) return;
      sec.schedule.forEach((slot) => {
        blocks.push({
          sectionId: sec._id,
          courseCode: sec.course?.code,
          courseName: sec.course?.name,
          type: sec.type,
          group: sec.group,
          day: slot.day,
          startHour: slot.startHour,
          duration: slot.duration,
          room: slot.room?.name,
          teacher: sec.teacher?.name,
        });
      });
    });
    res.json(blocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const studentId = req.user._id;

    console.log("hola")

    // Semestre activo (mismo criterio que vienes usando)
    const now = new Date();
    const activeSemester = await Semester.findOne({
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!activeSemester) return res.json([]);

    console.log("hola2")

    const enrollments = await Enrollment.find({
      student: studentId,
      semester: activeSemester._id,
      status: { $ne: 'dropped' },
    })
      .populate({
        path: 'section',
        populate: [
          { path: 'course', select: 'code name' },
          { path: 'teacher', select: 'name email' },
        ],
      })
      .lean();

    // Solo teoría para "Mis Cursos"
    const theory = enrollments.filter(
      (e) => e.section && e.section.type === 'theory' && e.section.course
    );

    // Unificar por courseId (si un curso tiene más de una sección teórica, ajusta esto a tu regla)
    const map = new Map();

    for (const e of theory) {
      const course = e.section.course;
      const courseId = String(course._id);

      if (!map.has(courseId)) {
        map.set(courseId, {
          courseId,
          courseCode: course.code || '',
          courseName: course.name || '',
          sectionId: String(e.section._id), // sección teórica principal (la que usarás para asistencia)
          teacherName: e.section.teacher?.name || '',
          teacher: e.section.teacher || null,
          group: e.section.group || '',
          credits: course.credits || undefined, // si tu Course lo tiene
          semesterId: String(activeSemester._id),
        });
      }
    }

    console.log(Array.from(map.values()))

    return res.json(Array.from(map.values()));
  } catch (err) {
    console.error('Error getMyCourses:', err);
    return res.status(500).json({ message: 'Error al obtener tus cursos.' });
  }
};

export const getCourseAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ message: 'courseId es obligatorio' });
    }

    const now = new Date();
    const activeSemester = await Semester.findOne({
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!activeSemester) {
      return res.json({
        courseId,
        semesterId: null,
        sectionId: null,
        summary: { present: 0, absent: 0, late: 0, total: 0, attendancePct: 0 },
        records: [],
      });
    }

    // 1) Encontrar sección teórica del curso en el semestre activo
    const theorySection = await Section.findOne({
      course: courseId,
      semester: activeSemester._id,
      type: 'theory',
    }).select('_id');

    if (!theorySection) {
      return res.json({
        courseId,
        semesterId: String(activeSemester._id),
        sectionId: null,
        summary: { present: 0, absent: 0, late: 0, total: 0, attendancePct: 0 },
        records: [],
      });
    }

    // 2) Verificar que el estudiante esté matriculado en esa teoría
    const enrollment = await Enrollment.findOne({
      student: studentId,
      semester: activeSemester._id,
      section: theorySection._id,
      status: { $ne: 'dropped' },
    }).select('_id');

    if (!enrollment) {
      // No matriculado => no se muestra nada (o podrías devolver 403)
      return res.json({
        courseId,
        semesterId: String(activeSemester._id),
        sectionId: String(theorySection._id),
        summary: { present: 0, absent: 0, late: 0, total: 0, attendancePct: 0 },
        records: [],
      });
    }

    // 3) Traer sesiones de asistencia del curso/sección
    const sessions = await AttendanceSession.find({
      section: theorySection._id,
    })
      .sort({ date: 1 })
      .lean();

    let present = 0;
    let absent = 0;
    let late = 0;

    const records = sessions.map((s) => {
      const entry = (s.entries || []).find(
        (e) => String(e.student) === String(studentId)
      );

      // Si no hay entry, lo tratamos como absent (para que cuadre con tu enum y UX)
      const status = entry?.status || 'absent';

      if (status === 'present') present += 1;
      else if (status === 'late') late += 1;
      else absent += 1;

      return {
        date: s.date,
        week: s.week,
        status,
      };
    });

    const total = records.length;
    const attendancePct = total > 0 ? (present / total) * 100 : 0;

    return res.json({
      courseId,
      semesterId: String(activeSemester._id),
      sectionId: String(theorySection._id),
      summary: { present, absent, late, total, attendancePct },
      records,
    });
  } catch (err) {
    console.error('Error getCourseAttendance:', err);
    return res.status(500).json({ message: 'Error al obtener tu asistencia.' });
  }
};