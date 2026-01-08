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
        message: `El semestre no está listo para procesar. Estado actual: "${semester.labEnrollment.status}".`,
      });
    }

    // =====================================================
    // Helpers
    // =====================================================
    const hasOverlap = (aStart, aEnd, bStart, bEnd) => !(aEnd < bStart || aStart > bEnd);

    const hasScheduleConflict = (labSection, studentSlots) => {
      if (!Array.isArray(labSection.schedule) || !Array.isArray(studentSlots)) return false;

      for (const labSlot of labSection.schedule) {
        const labDay = labSlot.day;
        const labStart = labSlot.startHour;
        const labEnd = labSlot.startHour + (labSlot.duration || 1) - 1;

        for (const slot of studentSlots) {
          if (slot.day !== labDay) continue;
          const sStart = slot.startHour;
          const sEnd = slot.startHour + (slot.duration || 1) - 1;

          if (hasOverlap(labStart, labEnd, sStart, sEnd)) return true;
        }
      }
      return false;
    };

    // Para ordenar grupos tipo "A","B","C" o "01","02" en orden DESC (C,B,A o 03,02,01)
    const groupToRank = (g) => {
      if (!g) return -1;
      const s = String(g).trim().toUpperCase();

      // numérico (01,02,10)
      if (/^\d+$/.test(s)) return Number(s);

      // alfabético simple (A,B,C,...)
      if (/^[A-Z]$/.test(s)) return s.charCodeAt(0) - 64; // A=1, B=2...

      // fallback: usar primera letra si existe
      const ch = s[0];
      if (ch >= "A" && ch <= "Z") return ch.charCodeAt(0) - 64;

      return 0;
    };

    // =====================================================
    // 1) Traer TODOS los labs del semestre (para defaults)
    // =====================================================
    const labSections = await Section.find({
      semester: semesterId,
      type: "lab",
    }).lean();

    // Map courseId -> labs[]
    const labsByCourse = new Map();
    for (const lab of labSections) {
      const courseId = lab.course?.toString();
      if (!courseId) continue;
      if (!labsByCourse.has(courseId)) labsByCourse.set(courseId, []);
      labsByCourse.get(courseId).push(lab);
    }

    // Orden default invertido por grupo (C,B,A o 03,02,01)
    for (const [courseId, labs] of labsByCourse.entries()) {
      labs.sort((a, b) => groupToRank(b.group) - groupToRank(a.group));
      labsByCourse.set(courseId, labs);
    }

    // =====================================================
    // 2) Traer TODOS los enrollments de TEORÍA del semestre
    //    (incluye los que NO tienen preferencias)
    // =====================================================
    const theoryEnrollments = await Enrollment.find({
      semester: semesterId,
      status: { $ne: "dropped" },
    })
      .populate({
        path: "section",
        select: "type course schedule",
        populate: { path: "course", select: "name code" },
      })
      .populate("labPreferences") // puede venir vacío
      .lean();

    // Filtrar solo teoría (porque preferencias viven en enrollment de teoría)
    const onlyTheory = theoryEnrollments.filter((enr) => enr.section?.type === "theory");

    if (onlyTheory.length === 0) {
      semester.labEnrollment.status = "processed";
      semester.labEnrollment.processedAt = new Date();
      await semester.save();

      return res.json({
        message: "No hay matrículas de teoría para procesar.",
        assignmentsCount: 0,
        assignments: [],
      });
    }

    // =====================================================
    // 3) Construir horario base por alumno (solo teoría)
    //    + lo iremos extendiendo con labs asignados en este mismo proceso
    // =====================================================
    const scheduleByStudent = new Map(); // studentId -> slots[]
    const courseByEnrollment = new Map(); // enrollmentId -> courseId

    for (const enr of onlyTheory) {
      const studentId = enr.student?.toString();
      if (!studentId) continue;

      if (!scheduleByStudent.has(studentId)) scheduleByStudent.set(studentId, []);

      // meter horarios de teoría
      const sec = enr.section;
      if (Array.isArray(sec?.schedule)) {
        for (const b of sec.schedule) {
          if (!b) continue;
          scheduleByStudent.get(studentId).push({
            day: b.day,
            startHour: b.startHour,
            duration: b.duration || 1,
          });
        }
      }

      const courseId = sec?.course?._id?.toString() || sec?.course?.toString();
      if (courseId) courseByEnrollment.set(enr._id.toString(), courseId);
    }

    // =====================================================
    // 4) Para evitar duplicados: traer labs ya matriculados
    //    (por preprocess o ejecuciones previas)
    // =====================================================
    const alreadyLabEnrollments = await Enrollment.find({
      semester: semesterId,
      status: { $ne: "dropped" },
    })
      .populate({ path: "section", select: "type course" })
      .lean();

    // Map studentId -> Set(courseId) ya tiene lab
    const studentHasLabCourse = new Map();
    for (const enr of alreadyLabEnrollments) {
      if (enr.section?.type !== "lab") continue;
      const studentId = enr.student?.toString();
      const courseId = enr.section?.course?.toString();
      if (!studentId || !courseId) continue;

      if (!studentHasLabCourse.has(studentId)) studentHasLabCourse.set(studentId, new Set());
      studentHasLabCourse.get(studentId).add(courseId);
    }

    // =====================================================
    // 5) Procesar asignación:
    //    - si tiene preferencias: esas primero
    //    - si NO tiene preferencias: default invertido (C,B,A)
    // =====================================================
    const assignments = [];
    let assignedCount = 0;

    for (const enr of onlyTheory) {
      const studentId = enr.student?.toString();
      if (!studentId) continue;

      const courseId = courseByEnrollment.get(enr._id.toString());
      if (!courseId) continue;

      const labsForCourse = labsByCourse.get(courseId);
      if (!labsForCourse || labsForCourse.length === 0) {
        continue; // curso sin lab
      }

      // si ya tiene lab matriculado para este curso, saltar
      const hasSet = studentHasLabCourse.get(studentId);
      if (hasSet && hasSet.has(courseId)) continue;

      // preferencias del alumno (si existen)
      const prefs = Array.isArray(enr.labPreferences) ? enr.labPreferences : [];
      const hasPrefs = prefs.length > 0;

      // construir lista de candidatos (preferencias o default)
      let candidates = [];
      if (hasPrefs) {
        // preferences vienen como docs -> convertir a ids y filtrar los que realmente son labs de este curso/semestre
        const prefIds = prefs
          .map((x) => (x?._id ? x._id.toString() : x?.toString()))
          .filter(Boolean);

        // map rápido id -> lab
        const labById = new Map(labsForCourse.map((l) => [l._id.toString(), l]));
        candidates = prefIds.map((id) => labById.get(id)).filter(Boolean);
      } else {
        // DEFAULT: orden invertido (ya está ordenado labsForCourse DESC)
        candidates = labsForCourse;
      }

      // validar conflicto + capacidad
      const studentSlots = scheduleByStudent.get(studentId) || [];
      let assignedLab = null;

      for (const labSec of candidates) {
        if (!labSec) continue;

        const hasCapacity =
          typeof labSec.capacity === "number" && typeof labSec.enrolledCount === "number"
            ? labSec.enrolledCount < labSec.capacity
            : true;

        if (!hasCapacity) continue;

        const conflict = hasScheduleConflict(labSec, studentSlots);
        if (conflict) continue;

        assignedLab = labSec;
        break;
      }

      if (!assignedLab) {
        // No se pudo asignar nada (por cruces/capacidad)
        continue;
      }

      // Doble check: por si en paralelo ya se creó
      const exists = await Enrollment.findOne({
        student: studentId,
        semester: semesterId,
        section: assignedLab._id,
        status: { $ne: "dropped" },
      }).lean();

      if (exists) {
        // Marcar que ya tiene lab del curso para evitar repetir
        if (!studentHasLabCourse.has(studentId)) studentHasLabCourse.set(studentId, new Set());
        studentHasLabCourse.get(studentId).add(courseId);
        continue;
      }

      // Crear enrollment de lab
      await Enrollment.create({
        student: studentId,
        section: assignedLab._id,
        semester: semesterId,
        status: "enrolled",
      });

      // Incrementar contador
      await Section.findByIdAndUpdate(assignedLab._id, { $inc: { enrolledCount: 1 } });

      // Actualizar el enrolledCount local para que el siguiente estudiante vea la capacidad real
      assignedLab.enrolledCount = (assignedLab.enrolledCount || 0) + 1;

      // Agregar slots del lab al horario del estudiante (para evitar cruces entre labs de distintos cursos)
      if (Array.isArray(assignedLab.schedule)) {
        for (const b of assignedLab.schedule) {
          studentSlots.push({
            day: b.day,
            startHour: b.startHour,
            duration: b.duration || 1,
          });
        }
      }
      scheduleByStudent.set(studentId, studentSlots);

      // marcar curso como ya asignado
      if (!studentHasLabCourse.has(studentId)) studentHasLabCourse.set(studentId, new Set());
      studentHasLabCourse.get(studentId).add(courseId);

      assignedCount++;
      assignments.push({
        student: studentId,
        course: courseId,
        labSection: assignedLab._id,
        usedDefaultPreferences: !hasPrefs,
        chosenGroup: assignedLab.group,
      });
    }

    // =====================================================
    // 6) Marcar semestre como processed
    // =====================================================
    semester.labEnrollment.status = "processed";
    semester.labEnrollment.processedAt = new Date();
    await semester.save();

    return res.json({
      message:
        "Procesamiento completado. Se asignaron labs usando preferencias del alumno o defaults invertidos (C→B→A) cuando no existían.",
      assignmentsCount: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("Error en processLabEnrollment:", error);
    return res.status(500).json({
      message: "Error al procesar matrícula de laboratorios.",
      error: error.message,
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
