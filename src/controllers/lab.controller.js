import Section from '../models/section.model.js';
import Enrollment from '../models/enrollment.model.js';

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

/**
 * @desc    List lab groups for a course in a semester
 * @route   GET /api/labs/groups?course=&semester=
 * @access  Private (students, secretary, teacher)
 */
export const listLabGroups = async (req, res) => {
  const { course, semester } = req.query;
  const filter = { type: 'lab' };

  if (course) filter.course = course;
  if (semester) filter.semester = semester;
  
  try {
    const groups = await Section.find(filter)
    .populate('teacher', 'name email')
    .populate('course', 'name code')
    .populate('schedule.room')
    
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
  const { course, semester, preferences } = req.body;

  const studentId = req.user.id || req.user._id; 

  // --- VALIDACIONES BÁSICAS ---
  if (!course || !semester) {
    return res.status(400).json({ message: 'El curso y el semestre son obligatorios.' });
  }

  if (!Array.isArray(preferences) || preferences.length === 0) {
    return res.status(400).json({ message: 'Debes seleccionar al menos un horario.' });
  }

  try {
    const validLabsCount = await Section.countDocuments({
      _id: { $in: preferences },
      course: course,     
      semester: semester, 
      type: 'lab'         
    });

    if (validLabsCount !== preferences.length) {
      return res.status(400).json({
        message: 'Alguna de las opciones seleccionadas no es válida.',
      });
    }

    const theorySections = await Section.find({ 
        course: course, 
        semester: semester, 
        type: 'theory' 
    }).select('_id');

    const theorySectionIds = theorySections.map(s => s._id);

    const enrollment = await Enrollment.findOne({
      student: studentId,
      section: { $in: theorySectionIds },
      semester: semester
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

  res.json({ message: 'Lab assignment algorithm not yet implemented' });
};

export const getEnrollmentByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id || req.user._id;
    const Section = await import('../models/section.model.js').then(m => m.default);
    const theorySections = await Section.find({ course: courseId, type: 'theory' }).select('_id');
    const theoryIds = theorySections.map(s => s._id);

    const Enrollment = await import('../models/enrollment.model.js').then(m => m.default);
    
    const enrollment = await Enrollment.findOne({
      student: studentId,
      section: { $in: theoryIds }
    }).select('labPreferences status');

    if (!enrollment) {
      return res.json({ labPreferences: [] });
    }

    res.json(enrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener matrícula" });
  }
};