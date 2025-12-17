import Semester from '../models/semester.model.js';
import Enrollment from "../models/enrollment.model.js";
import Section from "../models/section.model.js";

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

export const editSemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { name, startDate, endDate } = req.body;

    // Validaciones básicas
    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios: name, startDate y endDate.',
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: 'La fecha de inicio debe ser menor que la fecha de fin.',
      });
    }

    // Buscar el semestre a editar
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semestre no encontrado.' });
    }

    // Verificar nombre único (si se está cambiando)
    if (semester.name !== name) {
      const existing = await Semester.findOne({ name });
      if (existing) {
        return res.status(400).json({
          message: `Ya existe un semestre con el nombre "${name}".`,
        });
      }
    }

    // Actualizar
    semester.name = name;
    semester.startDate = startDate;
    semester.endDate = endDate;

    const updatedSemester = await semester.save();

    return res.json({
      message: 'Semestre actualizado correctamente.',
      semester: updatedSemester,
    });

  } catch (err) {
    console.error('Error en editSemester:', err);
    return res.status(500).json({
      message: 'Error al actualizar semestre.',
      error: err.message,
    });
  }
};

export const openLabEnrollment = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: "Semestre no encontrado" });
    }

    if (semester.labEnrollment.status !== "not_started") {
      return res.status(400).json({
        message: `La matrícula de laboratorios ya está en estado "${semester.labEnrollment.status}".`
      });
    }

    semester.labEnrollment.status = "open";
    semester.labEnrollment.openedAt = new Date();

    await semester.save();

    return res.json({
      message: "Matrícula de laboratorios abierta correctamente.",
      semester
    });

  } catch (error) {
    console.error("Error en openLabEnrollment:", error);
    res.status(500).json({ message: "Error al abrir matrícula de laboratorios" });
  }
};

function hasScheduleConflict(labSection, studentSlots) {
  if (!Array.isArray(labSection.schedule) || !Array.isArray(studentSlots)) {
    return false;
  }

  for (const labSlot of labSection.schedule) {
    const labDay = labSlot.day;
    const labStart = labSlot.startHour;
    const labEnd = labSlot.startHour + (labSlot.duration || 1) - 1;

    for (const slot of studentSlots) {
      if (slot.day !== labDay) continue;

      const sStart = slot.startHour;
      const sEnd = slot.startHour + (slot.duration || 1) - 1;

      const overlaps = !(labEnd < sStart || labStart > sEnd);
      if (overlaps) return true;
    }
  }

  return false;
}

export const preprocessLabEnrollment = async (req, res) => {
  try {
    const { semesterId } = req.params;

    if (!semesterId) {
      return res.status(400).json({ message: 'semesterId es obligatorio' });
    }

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semestre no encontrado' });
    }

    // 1) Sacar TODAS las secciones de lab de ese semestre, agrupadas por curso
    const labSections = await Section.find({
      semester: semesterId,
      type: 'lab',
    });

    if (labSections.length === 0) {
      return res.json({
        message: 'No hay secciones de laboratorio en este semestre.',
        semesterId,
        autoEnrolledCount: 0,
        processedStudents: 0,
      });
    }

    const labsByCourse = new Map();
    for (const sec of labSections) {
      const courseId = sec.course.toString();
      if (!labsByCourse.has(courseId)) {
        labsByCourse.set(courseId, []);
      }
      labsByCourse.get(courseId).push(sec);
    }

    // 2) Traer TODAS las matrículas del semestre con sus secciones (para conocer horarios de teoría)
    const allEnrollments = await Enrollment.find({
      semester: semesterId,
      status: { $ne: 'dropped' }, // ignorar retirados
    }).populate({
      path: 'section',
      populate: { path: 'course' },
    });

    if (allEnrollments.length === 0) {
      return res.json({
        message: 'No hay matrículas en este semestre.',
        semesterId,
        autoEnrolledCount: 0,
        processedStudents: 0,
      });
    }

    // 3) Agrupar info por estudiante
    const studentsMap = new Map();
    //  - schedule: slots de teoría
    //  - courses: set de cursos en los que está matriculado (teoría)
    for (const enr of allEnrollments) {
      const section = enr.section;
      if (!section) continue;

      const studentId = enr.student.toString();
      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          scheduleSlots: [],
          courseIds: new Set(),
        });
      }

      const studentData = studentsMap.get(studentId);

      if (section.type === 'theory') {
        const courseId = section.course?._id?.toString() || section.course?.toString();
        if (courseId) {
          studentData.courseIds.add(courseId);
        }

        // Añadir horarios de esta sección de teoría al calendario del alumno
        if (Array.isArray(section.schedule)) {
          for (const block of section.schedule) {
            if (!block) continue;
            studentData.scheduleSlots.push({
              day: block.day,
              startHour: block.startHour,
              duration: block.duration || 1,
            });
          }
        }
      }
    }

    let autoEnrolledCount = 0;
    let processedStudents = 0;
    const details = [];

    // 4) Para cada estudiante, revisar si hay cursos con SOLO 1 lab posible
    for (const [studentId, info] of studentsMap.entries()) {
      processedStudents++;

      const scheduleSlots = info.scheduleSlots;
      const courseIds = Array.from(info.courseIds);

      for (const courseId of courseIds) {
        const labsForCourse = labsByCourse.get(courseId);
        if (!labsForCourse || labsForCourse.length === 0) {
          continue; // ese curso no tiene laboratorio
        }

        // Para cada lab, ver si hay capacidad y si NO se cruza con el horario de teoría
        const availableLabs = labsForCourse.filter((labSec) => {
          const hasCapacity =
            typeof labSec.capacity === 'number' &&
            typeof labSec.enrolledCount === 'number'
              ? labSec.enrolledCount < labSec.capacity
              : true; // si no hay datos, asumimos capacidad

          if (!hasCapacity) return false;

          const conflict = hasScheduleConflict(labSec, scheduleSlots);
          return !conflict;
        });

        if (availableLabs.length === 1) {
          const chosenLab = availableLabs[0];

          // Ver si ya existe una matrícula para ese lab
          const existing = await Enrollment.findOne({
            student: studentId,
            section: chosenLab._id,
            semester: semesterId,
          });

          if (existing) {
            // Ya estaba matriculado en ese lab (o viene de otra fase)
            continue;
          }

          // Crear matrícula para ese lab
          await Enrollment.create({
            student: studentId,
            section: chosenLab._id,
            semester: semesterId,
            status: 'enrolled',
            labPreferences: [], // opcionalmente podrías guardar [chosenLab._id]
          });

          // Incrementar su contador de matriculados
          await Section.findByIdAndUpdate(chosenLab._id, {
            $inc: { enrolledCount: 1 },
          });

          autoEnrolledCount++;
          details.push({
            student: studentId,
            course: courseId,
            labSection: chosenLab._id,
          });
        }
      }
    }

    return res.json({
      message:
        'Preprocesamiento de matrículas de laboratorio completado. Alumnos con una sola opción sin cruce fueron matriculados automáticamente.',
      semesterId,
      processedStudents,
      autoEnrolledCount,
      details, // lo puedes quitar si no quieres tanto detalle
    });
  } catch (err) {
    console.error('Error en preprocessLabEnrollment:', err);
    return res.status(500).json({
      message: 'Error al preprocesar matrículas de laboratorio.',
      error: err.message,
    });
  }
};

export const closeLabEnrollment = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: "Semestre no encontrado" });
    }

    if (semester.labEnrollment.status !== "open") {
      return res.status(400).json({
        message: `No se puede cerrar: el estado actual es "${semester.labEnrollment.status}".`
      });
    }

    semester.labEnrollment.status = "processing"; // listo para greedy
    semester.labEnrollment.closedAt = new Date();

    await semester.save();

    return res.json({
      message: "Matrícula cerrada. Se puede ejecutar el procesamiento.",
      semester
    });

  } catch (error) {
    console.error("Error en closeLabEnrollment:", error);
    res.status(500).json({ message: "Error al cerrar matrícula de laboratorios" });
  }
};

export const processLabEnrollment = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: "Semestre no encontrado" });
    }

    if (semester.labEnrollment.status !== "processing") {
      return res.status(400).json({
        message: `El semestre no está listo para procesar. Estado actual: "${semester.labEnrollment.status}".`
      });
    }

    // ===============================================
    // OBTENER ENROLLMENTS TEORÍA CON PREFERENCIAS
    // ===============================================
    const theoryEnrollments = await Enrollment.find({
      semester: semesterId,
      labPreferences: { $exists: true, $not: { $size: 0 } }
    })
      .populate("section") // sección teoría
      .populate("labPreferences"); // secciones lab

    // Aqui guardarás los resultados
    const assignments = [];

    // ===============================================
    // EJECUTAR EL GREEDY (PLANTILLA)
    // ===============================================
    for (const enr of theoryEnrollments) {
      const prefs = enr.labPreferences;

      let assigned = null;

      for (const labSec of prefs) {
        if (labSec.enrolledCount < labSec.capacity) {
          assigned = labSec;
          break;
        }
      }

      if (assigned) {
        assignments.push({ student: enr.student, labSection: assigned._id });

        // incrementar contador
        await Section.findByIdAndUpdate(assigned._id, {
          $inc: { enrolledCount: 1 }
        });

        // crear enrollment de laboratorio
        await Enrollment.create({
          student: enr.student,
          section: assigned._id,
          semester: semesterId,
          status: "enrolled"
        });
      }
    }

    // ===============================================
    // ACTUALIZAR ESTADO DEL SEMESTRE
    // ===============================================
    semester.labEnrollment.status = "processed";
    semester.labEnrollment.processedAt = new Date();
    await semester.save();

    return res.json({
      message: "Procesamiento completado.",
      assignmentsCount: assignments.length,
      assignments
    });

  } catch (error) {
    console.error("Error en processLabEnrollment:", error);
    res.status(500).json({
      message: "Error al procesar matrícula de laboratorios.",
      error: error.message
    });
  }
};


export const getLabEnrollmentResults = async (req, res) => {
  try {
    const { semesterId } = req.params;

    const enrollments = await Enrollment.find({
      semester: semesterId,
      status: 'enrolled',           // opcional, si solo quieres las vigentes
    })
      .populate('student', 'name code email')
      .populate({
        path: 'section',
        populate: { path: 'course', select: 'name code' },
      });

    const results = enrollments
      // por si solo quieres labs, no teoría:
      .filter((enr) => enr.section?.type === 'lab')
      .map((enr) => ({
        studentId: enr.student?._id,
        studentCode: enr.student?.code,
        studentName: enr.student?.name,
        studentEmail: enr.student?.email,
        courseId: enr.section?.course?._id,
        courseCode: enr.section?.course?.code,
        courseName: enr.section?.course?.name,
        labSectionId: enr.section?._id,
        labGroup: enr.section?.group,
      }));

    res.json(results);
  } catch (error) {
    console.error('Error en getLabEnrollmentResults:', error);
    res.status(500).json({ message: 'Error al obtener resultados' });
  }
};
