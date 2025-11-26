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

