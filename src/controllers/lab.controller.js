import Section from '../models/section.model.js';
import Enrollment from '../models/enrollment.model.js';
import Semester from '../models/semester.model.js';
import Course from '../models/course.model.js';

/**
 * @desc    Create a lab group (section of type 'lab')
 * @route   POST /api/labs/groups
 * @access  Private (secretary)
 *
 * Este endpoint es básicamente un wrapper de createSection con type='lab',
 * para no romper el contrato de la API que ya tienes.
 *
 * Body:
 * {
 *   "course": "ObjectId de Course",
 *   "semester": "ObjectId de Semester",
 *   "group": "A",
 *   "teacher": "ObjectId de User",
 *   "capacity": 20,
 *   "schedule": [ ... igual que en createSection ... ]
 * }
 */
export const createLabGroup = async (req, res) => {
  try {
    const { course, semester, group, teacher, schedule, capacity } = req.body;

    if (!course || !semester || !group) {
      return res
        .status(400)
        .json({ message: 'course, semester y group son obligatorios' });
    }

    const section = await Section.create({
      course,
      semester,
      type: 'lab',
      group,
      teacher,
      schedule,
      capacity,
    });

    res.status(201).json(section);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          'Ya existe un grupo de laboratorio con ese course/semester/type/group',
      });
    }
    res.status(400).json({ message: 'Invalid data' });
  }
};


// Helper para saber si dos tramos de horario se cruzan
const hasOverlap = (aStart, aEnd, bStart, bEnd) => {
  // No se cruzan si uno termina antes de que empiece el otro
  return !(aEnd < bStart || aStart > bEnd);
};

export const listLabGroups = async (req, res) => {
  try {
    const userId = req.user?._id; // estudiante logueado
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const { course, semester } = req.query;

    // 1) Determinar semestre relevante
    const now = new Date();
    let semesterDoc = null;

    if (semester) {
      semesterDoc = await Semester.findById(semester);
      if (!semesterDoc) {
        return res.status(404).json({ message: 'Semestre no encontrado' });
      }
    } else {
      semesterDoc = await Semester.findOne({
        startDate: { $lte: now },
        endDate: { $gte: now },
      });
    }

    const labEnrollmentStatus =
      semesterDoc?.labEnrollment?.status || 'not_started';

    const labEnrollmentWindow = {
      opensAt: semesterDoc?.labEnrollment?.openedAt || null,
      closesAt: semesterDoc?.labEnrollment?.closedAt || null,
    };

    // 2) Construir horario del estudiante (solo secciones de teoría)
    let studentSchedule = [];
    if (semesterDoc) {
      const enrollments = await Enrollment.find({
        student: userId,
        semester: semesterDoc._id,
      }).populate({
        path: 'section',
        select: 'type schedule',
      });

      enrollments.forEach((enr) => {
        if (!enr.section || enr.section.type !== 'theory') return;
        (enr.section.schedule || []).forEach((slot) => {
          studentSchedule.push({
            day: slot.day,
            startHour: slot.startHour,
            duration: slot.duration || 1,
          });
        });
      });
    }

    // 3) Obtener grupos de laboratorio
    const filter = { type: 'lab' };
    if (course) filter.course = course;
    if (semesterDoc?._id) filter.semester = semesterDoc._id;
    else if (semester) filter.semester = semester; // por si ya venía en query

    const groups = await Section.find(filter)
      .populate('teacher', 'name email')
      .populate('course', 'name code')
      .populate('schedule.room')
      .lean();

    // 4) Marcar cada grupo con conflicto / disponible
    const enrichedGroups = groups.map((g) => {
      const schedule = Array.isArray(g.schedule) ? g.schedule : [];

      let hasScheduleConflict = false;
      for (const labSlot of schedule) {
        const labDay = labSlot.day;
        const labStart = labSlot.startHour;
        const labEnd = labSlot.startHour + (labSlot.duration || 1) - 1;

        for (const s of studentSchedule) {
          if (s.day !== labDay) continue;
          const sStart = s.startHour;
          const sEnd = s.startHour + (s.duration || 1) - 1;

          if (hasOverlap(labStart, labEnd, sStart, sEnd)) {
            hasScheduleConflict = true;
            break;
          }
        }

        if (hasScheduleConflict) break;
      }

      // disponible = no tiene cruce y la fase está abierta
      const isAvailable = !hasScheduleConflict && labEnrollmentStatus === 'open';

      return {
        ...g,
        hasScheduleConflict,
        isAvailable,
      };
    });

    // 5) Respuesta unificada para el front
    return res.json({
      labEnrollmentStatus,   // 'not_started' | 'open' | 'processed'
      labEnrollmentWindow,   // { opensAt, closesAt } (pueden ser null)
      labGroups: enrichedGroups,
      // opcional: si quieres que el front también dibuje o debuggee el horario
      studentSchedule,
    });
  } catch (error) {
    console.error('Error en listLabGroups:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


/**
 * @desc    Student submit lab preferences
 * @route   POST /api/labs/preferences
 * @access  Private (student)
 *
 * Body:
 * {
 *   "course": "ObjectId de Course",
 *   "semester": "ObjectId de Semester",
 *   "preferences": ["sectionId1", "sectionId2", ...] // secciones de tipo 'lab'
 * }
 */
export const submitPreferences = async (req, res) => {
  const { course, courseId, semester, semesterId, preferences } = req.body;
  const courseFinal = course || courseId;
  const semesterFinal = semester || semesterId;


  const studentId = req.user.id || req.user._id; 

  // --- VALIDACIONES BÁSICAS ---
  if (!courseFinal || !semesterFinal) {
    return res.status(400).json({ message: 'El curso y el semestre son obligatorios.' });
  }

  if (!Array.isArray(preferences) || preferences.length === 0) {
    return res.status(400).json({ message: 'Debes seleccionar al menos un horario.' });
  }

  try {
    const validLabsCount = await Section.countDocuments({
      _id: { $in: preferences },
      course: courseFinal,     
      semester: semesterFinal, 
      type: 'lab'         
    });

    if (validLabsCount !== preferences.length) {
      return res.status(400).json({
        message: 'Alguna de las opciones seleccionadas no es válida.',
      });
    }

    const theorySections = await Section.find({ 
        course: courseFinal, 
        semester: semesterFinal, 
        type: 'theory' 
    }).select('_id');

    const theorySectionIds = theorySections.map(s => s._id);

    const enrollment = await Enrollment.findOne({
      student: studentId,
      section: { $in: theorySectionIds },
      semester: semesterFinal
    });

    // 3. ACTUALIZAR O RECHAZAR
    if (!enrollment) {
      return res.status(404).json({ 
        message: 'No se encontró una matrícula activa en la teoría de este curso. No puedes inscribirte a laboratorios.' 
      });
    }

    enrollment.labPreferences = preferences; 

    await enrollment.save();

    res.json({ message: 'Preferencias guardadas exitosamente', enrollment });

  } catch (error) {
    console.error("Error en submitPreferences:", error);
    res.status(500).json({ message: 'Error interno al procesar la inscripción.' });
  }
};

/**
 * @desc    Assign students to lab groups (algorithm placeholder)
 * @route   POST /api/labs/assign
 * @access  Private (secretary)
 */
export const assignLabGroups = async (req, res) => {

  res.json({ message: 'Todavía no implementado' });
};

export const getEnrollmentByCourse = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ message: 'courseId es obligatorio' });
    }

    const course = await Course.findById(courseId).select('_id');
    if (!course) {
      return res.status(404).json({ message: 'Curso no encontrado' });
    }

    // 1) Semestre ACTIVO
    const now = new Date();
    const activeSemester = await Semester.findOne({
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).select('_id');

    if (!activeSemester) {
      return res.json({
        courseId,
        semesterId: null,
        labPreferences: [],
        assignedLabSectionId: null,
        assignedLabSection: null,
      });
    }

    const semesterId = activeSemester._id;

    // 2) Secciones del curso en el semestre activo
    const [theorySections, labSections] = await Promise.all([
      Section.find({
        course: courseId,
        semester: semesterId,
        type: 'theory',
      }).select('_id'),
      Section.find({
        course: courseId,
        semester: semesterId,
        type: 'lab',
      }).select('_id'),
    ]);

    const theorySectionIds = theorySections.map((s) => s._id);
    const labSectionIds = labSections.map((s) => s._id);

    // 3) Enrollment de TEORÍA (aquí guardas labPreferences)
    const theoryEnrollment = theorySectionIds.length
      ? await Enrollment.findOne({
          student: studentId,
          semester: semesterId,
          section: { $in: theorySectionIds },
        }).select('labPreferences')
      : null;

    // 4) Enrollment de LAB (aquí está el lab asignado cuando ya existe)
    const labEnrollment = labSectionIds.length
      ? await Enrollment.findOne({
          student: studentId,
          semester: semesterId,
          section: { $in: labSectionIds },
          status: 'enrolled',
        }).populate('section')
      : null;

    return res.json({
      courseId,
      semesterId,
      labPreferences: (theoryEnrollment?.labPreferences || []).map((id) =>
        id.toString()
      ),
      assignedLabSectionId: labEnrollment?.section?._id?.toString() || null,
      assignedLabSection: labEnrollment?.section || null,
    });
  } catch (err) {
    console.error('Error en getEnrollmentByCourse:', err);
    return res.status(500).json({ message: 'Error al obtener datos de laboratorio.' });
  }
};