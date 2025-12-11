import Course from '../models/course.model.js';
import Section from '../models/section.model.js';
import Semester from '../models/semester.model.js';

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private (all roles)
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a course
// @route   POST /api/courses
// @access  Private (admin or secretary)
export const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid data' });
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (admin or secretary)
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid data' });
  }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (admin or secretary)
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get sections for a course in a semester
// @route   GET /api/courses/:id/sections?semester=semesterId
// @access  Private (all roles)
export const getCourseSections = async (req, res) => {
  try {
    const { semester } = req.query;
    const filter = { course: req.params.id };
    if (semester) filter.semester = semester;
    const sections = await Section.find(filter).populate('teacher', 'name email').populate({
      path: 'schedule.room',
      select: 'code name capacity location type',
    });
    res.json(sections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};