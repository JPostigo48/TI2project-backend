import Semester from '../models/semester.model.js';

export const createSemester = async (req, res) => {
  try {
    const semester = await Semester.create(req.body);
    res.status(201).json(semester);
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).json({ message: "El semestre ya existe" });
    }

    res.status(400).json({ message: "Datos inválidos" });
  }
};

export const listSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find();
    res.json(semesters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
