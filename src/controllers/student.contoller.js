import Enrollment from '../models/enrollment.model.js';
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
