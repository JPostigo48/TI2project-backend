import Section from '../models/section.model.js';
import Enrollment from '../models/enrollment.model.js';

/**
 * @desc    Create a section (theory or lab)
 * @route   POST /api/sections
 * @access  Private (secretary/admin)
 *
 * Body esperado:
 * {
 *   "course": "ObjectId de Course",
 *   "semester": "ObjectId de Semester",
 *   "type": "theory" | "lab",   // opcional, por defecto 'theory'
 *   "group": "A",
 *   "teacher": "ObjectId de User",
 *   "capacity": 30,
 *   "schedule": [
 *     {
 *       "day": "Monday",
 *       "startHour": 3,
 *       "duration": 2,
 *       "room": "ObjectId de Room"
 *     }
 *   ]
 * }
 */
export const createSection = async (req, res) => {
  try {
    const { course, semester, type, group, teacher, schedule, capacity } = req.body;

    if (!course || !semester || !group) {
      return res
        .status(400)
        .json({ message: 'course, semester y group son obligatorios' });
    }

    const section = await Section.create({
      course,
      semester,
      type: type || 'theory',
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
          'Ya existe una sección con ese course/semester/type/group',
      });
    }
    res.status(400).json({ message: 'Invalid data' });
  }
};

/**
 * @desc    List sections (theory or lab) with filters
 * @route   GET /api/sections?course=&semester=&type=&teacher=
 * @access  Private
 */
export const listSections = async (req, res) => {
  const { course, semester, type, teacher } = req.query;
  const filter = {};

  if (course) filter.course = course;
  if (semester) filter.semester = semester;
  if (type) filter.type = type; // 'theory' | 'lab'
  if (teacher) filter.teacher = teacher;

  try {
    const sections = await Section.find(filter)
      .populate('course', 'name code')
      .populate('teacher', 'name email')
      .populate('schedule.room', 'name code');

    res.json(sections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

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
      .populate('course', 'name code');

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

  if (!course || !semester) {
    return res
      .status(400)
      .json({ message: 'course y semester son obligatorios' });
  }

  if (!Array.isArray(preferences) || preferences.length === 0) {
    return res
      .status(400)
      .json({ message: 'Preferences debe ser un array no vacío de sectionIds' });
  }

  try {
    // Validar que todas las preferencias sean secciones de LAB para ese curso/semestre
    const validCount = await Section.countDocuments({
      _id: { $in: preferences },
      course,
      semester,
      type: 'lab',
    });

    if (validCount !== preferences.length) {
      return res.status(400).json({
        message:
          'Una o más preferencias no son secciones de laboratorio válidas para ese curso/semestre',
      });
    }

    const studentId = req.user._id;

    let enrollment = await Enrollment.findOne({
      student: studentId,
      course,
      semester,
    });

    if (!enrollment) {
      enrollment = new Enrollment({
        student: studentId,
        course,
        semester,
        preferences,
        status: 'pending',
      });
    } else {
      enrollment.preferences = preferences;
      enrollment.status = 'pending';
    }

    await enrollment.save();

    res.json({ message: 'Preferences saved', enrollment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Assign students to lab groups (algorithm placeholder)
 * @route   POST /api/labs/assign
 * @access  Private (secretary)
 */
export const assignLabGroups = async (req, res) => {
  // Aquí después:
  // 1. Buscar Enrollment con status 'pending' por course+semester.
  // 2. Recorrer preferences en orden.
  // 3. Asignar la primera Section con cupo (capacity > enrolledCount).
  // 4. enrollment.section = sectionId, enrollment.status = 'enrolled'
  // 5. section.enrolledCount++

  res.json({ message: 'Lab assignment algorithm not yet implemented' });
};
