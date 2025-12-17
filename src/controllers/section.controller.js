import Section from '../models/section.model.js';
import User from '../models/user.model.js';
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

export const editSection = async (req, res) => {
  const { sectionId } = req.params;

  const {
    type,
    group,
    capacity,
    teacher,
    schedule,
  } = req.body;

  try {
    // 1. Verificar que la sección exista
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: "Section not found." });
    }

    // 2. Validaciones de valores simples
    if (group && typeof group !== "string") {
      return res.status(400).json({ message: "Group must be a string." });
    }

    if (capacity !== undefined && capacity < 0) {
      return res.status(400).json({ message: "Capacity cannot be negative." });
    }

    // 3. Validar que el teacher exista y tenga rol teacher
    if (teacher) {
      const teacherExists = await User.findOne({ _id: teacher, role: "teacher" });

      if (!teacherExists) {
        return res.status(400).json({
          message: "Assigned teacher does not exist or is not a teacher.",
        });
      }
    }

    // 4. Construir objeto de actualización
    const updates = {};

    if (type !== undefined) updates.type = type;
    if (group !== undefined) updates.group = group.trim();
    if (capacity !== undefined) updates.capacity = Number(capacity);
    if (teacher !== undefined) updates.teacher = teacher || null; // null si se quiere desasignar
    if (schedule !== undefined) updates.schedule = schedule;

    // 5. Guardar cambios
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.json({
      message: "Section updated successfully",
      section: updatedSection,
    });

  } catch (err) {
    console.error("Error editing section:", err);
    return res.status(500).json({
      message: "Error updating section",
      error: err.message,
    });
  }
};