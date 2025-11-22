import AttendanceSession from '../models/attendance.model.js';
import Enrollment from '../models/enrollment.model.js';
import Section from '../models/section.model.js';

// @desc    Open a new attendance session
// @route   POST /api/attendance
// @access  Private (teacher)
export const openSession = async (req, res) => {
  const { sectionId, date, week } = req.body;
  if (!sectionId || !date || !week) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    // get students enrolled in this section
    const enrollments = await Enrollment.find({ section: sectionId, status: 'enrolled' }).select('student');
    const entries = enrollments.map((enr) => ({ student: enr.student, status: 'absent' }));
    const session = await AttendanceSession.create({
      section: sectionId,
      date,
      week,
      createdBy: req.user._id,
      entries,
    });
    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark attendance for a student
// @route   PATCH /api/attendance/:sessionId/entry/:studentId
// @access  Private (teacher)
export const markAttendance = async (req, res) => {
  const { sessionId, studentId } = req.params;
  const { status } = req.body; // present, absent, late
  if (!['present', 'absent', 'late'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const session = await AttendanceSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    // update entry
    const entry = session.entries.find((e) => e.student.toString() === studentId);
    if (!entry) return res.status(404).json({ message: 'Student not in session' });
    entry.status = status;
    await session.save();
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    List sessions for a section
// @route   GET /api/attendance?section=sectionId
// @access  Private (teacher or student)
export const listSessions = async (req, res) => {
  const { section } = req.query;
  const filter = {};
  if (section) filter.section = section;
  try {
    const sessions = await AttendanceSession.find(filter).populate('section', 'name').populate('createdBy', 'name');
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};