import Section from '../models/section.model.js';
import Enrollment from '../models/enrollment.model.js';

// @desc    Create a lab group (section of type 'lab')
// @route   POST /api/labs/groups
// @access  Private (secretary)
export const createLabGroup = async (req, res) => {
  try {
    const { courseId, semesterId, name, schedule, teacher, capacity, room } = req.body;
    const section = await Section.create({
      course: courseId,
      semester: semesterId,
      name,
      type: 'lab',
      teacher,
      schedule,
      capacity,
      room,
    });
    res.status(201).json(section);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid data' });
  }
};

// @desc    List lab groups for a course in a semester
// @route   GET /api/labs/groups?course=courseId&semester=semesterId
// @access  Private (students, secretary, teacher)
export const listLabGroups = async (req, res) => {
  const { course, semester } = req.query;
  const filter = { type: 'lab' };
  if (course) filter.course = course;
  if (semester) filter.semester = semester;
  try {
    const groups = await Section.find(filter).populate('teacher', 'name email');
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Student submit lab preferences
// @route   POST /api/labs/preferences
// @access  Private (student)
export const submitPreferences = async (req, res) => {
  const { enrollmentId, preferences } = req.body;
  if (!Array.isArray(preferences) || preferences.length === 0) {
    return res.status(400).json({ message: 'Preferences required' });
  }
  try {
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    enrollment.preferences = preferences;
    await enrollment.save();
    res.json({ message: 'Preferences updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Assign students to lab groups (algorithm placeholder)
// @route   POST /api/labs/assign
// @access  Private (secretary)
export const assignLabGroups = async (req, res) => {
  // This should implement the fair assignment algorithm described in the requirements.
  // It should consider preferences, block incompatible schedules and evenly distribute students.
  // For now, we return a placeholder response.
  res.json({ message: 'Lab assignment algorithm not yet implemented' });
};