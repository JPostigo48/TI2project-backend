import Grade from '../models/grade.model.js';
import mongoose from 'mongoose';

// @desc    Create or update a grade entry
// @route   POST /api/grades
// @access  Private (teacher)
export const setGrade = async (req, res) => {
  const { sectionId, studentId, evaluation, weight, score } = req.body;
  if (!sectionId || !studentId || !evaluation) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const grade = await Grade.findOneAndUpdate(
      { section: sectionId, student: studentId, evaluation },
      { weight, score },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(grade);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid data' });
  }
};

// @desc    Get grades for a section with optional summary
// @route   GET /api/grades?section=sectionId&summary=true
// @access  Private (teacher or student)
export const getGrades = async (req, res) => {
  const { section, summary } = req.query;
  try {
    const filter = {};
    if (section) filter.section = section;
    const grades = await Grade.find(filter).populate('student', 'name code');
    if (summary === 'true') {
      // compute statistics per evaluation
      const stats = {};
      grades.forEach((g) => {
        if (!stats[g.evaluation]) stats[g.evaluation] = { scores: [] };
        if (typeof g.score === 'number') stats[g.evaluation].scores.push(g.score);
        stats[g.evaluation].weight = g.weight;
      });
      const summaryResult = {};
      Object.keys(stats).forEach((ev) => {
        const scores = stats[ev].scores;
        if (scores.length > 0) {
          const max = Math.max(...scores);
          const min = Math.min(...scores);
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          summaryResult[ev] = { max, min, avg, weight: stats[ev].weight };
        }
      });
      return res.json({ grades, summary: summaryResult });
    }
    res.json({ grades });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};