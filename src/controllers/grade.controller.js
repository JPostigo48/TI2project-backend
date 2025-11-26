import Grade from '../models/grade.model.js';
import Enrollment from '../models/enrollment.model.js';

export const setGrade = async (req, res) => {
  const { section, studentId, partial, kind, value } = req.body;

  try {
    // Validamos que el valor sea numérico o null (para borrar)
    const valToSave = (value === '' || value === null) ? null : Number(value);

    // USAMOS OPERACIÓN ATÓMICA ($set)
    // Esto evita que si guardas continua y examen al mismo tiempo, uno borre al otro.
    const updatedGrade = await Grade.findOneAndUpdate(
      {
        section: section,
        student: studentId,
        evaluation: partial // Ej: "P1"
      },
      {
        $set: {
          [`components.${kind}`]: valToSave, // Ej: "components.continuous": 15
          weight: 1 
        }
      },
      {
        upsert: true, // Si no existe, lo crea
        new: true,    // Devuelve el objeto nuevo
        setDefaultsOnInsert: true
      }
    );

    res.json(updatedGrade);

  } catch (error) {
    console.error("Error setGrade:", error);
    res.status(500).json({ message: 'Error guardando nota' });
  }
};

// ... Mantén tu función getGrades igual, esa estaba bien ...
export const getGrades = async (req, res) => {
    const { section, studentId, mode } = req.query; // Agregamos studentId

    try {
        // VALIDACIÓN: Se requiere section O studentId
        if (!section && !studentId) {
            return res.status(400).json({ message: "Faltan parámetros (section o studentId)" });
        }

        if (section) {

        const enrollments = await Enrollment.find({ section })
        .populate('student', 'name code')
        .lean();

        const grades = await Grade.find({ section }).lean();

        const roster = enrollments.map(enr => {
        const studentId = enr.student._id.toString();
        const studentGrades = grades.filter(g => g.student.toString() === studentId);

        const row = {
            studentId: studentId,
            studentName: enr.student.name,
            code: enr.student.code,
            partials: {
            P1: { continuous: null, exam: null },
            P2: { continuous: null, exam: null },
            P3: { continuous: null, exam: null }
            },
            substitutive: null,
            computed: { finalScore: null }
        };

        studentGrades.forEach(g => {
            const ev = g.evaluation;
            if (row.partials[ev] && g.components) {
                row.partials[ev].continuous = g.components.continuous;
                row.partials[ev].exam = g.components.exam;
            }
            if (ev === 'SUB') {
                row.substitutive = g.components ? g.components.value : null;
            }
        });

        let sum = 0;
        let count = 0;
        ['P1', 'P2', 'P3'].forEach(p => {
            const c = row.partials[p].continuous;
            const e = row.partials[p].exam;
            
            if (c != null && e != null) {
                const partialScore = (c + e) / 2; 
                sum += partialScore;
                count++;
            } else if (c != null || e != null) {
                // Si falta una nota, asumimos 0 en la faltante para el promedio temporal
                const partialScore = ((c||0) + (e||0)) / 2;
                sum += partialScore;
                count++;
            }
        });
        
        row.computed.finalScore = count > 0 ? (sum / 3) : null;

        return row;
        });

        res.json(roster);
      }

      if (studentId) {
        // 1. Buscar todas las notas de ese estudiante
        const grades = await Grade.find({ student: studentId })
            .populate({
                path: 'section',
                populate: { path: 'course', select: 'name code' } // Traer info del curso
            })
            .lean();

        // 2. Agrupar por curso/sección
        const gradesBySection = {};

        grades.forEach(g => {
            if (!g.section) return;
            const sectionId = g.section._id.toString();
            
            if (!gradesBySection[sectionId]) {
                gradesBySection[sectionId] = {
                    courseCode: g.section.course?.code,
                    courseName: g.section.course?.name,
                    group: g.section.group,
                    partials: { P1:{}, P2:{}, P3:{} },
                    substitutive: null,
                    computed: { finalScore: 0 }
                };
            }

            const record = gradesBySection[sectionId];
            const ev = g.evaluation;

            if (record.partials[ev] && g.components) {
                record.partials[ev] = g.components;
            }
            if (ev === 'SUB') {
                record.substitutive = g.components?.value;
            }
        });

        // 3. Calcular promedios (Opcional, si no se guardan calculados)
        const results = Object.values(gradesBySection).map(record => {
            let sum = 0; 
            let count = 0;
            ['P1', 'P2', 'P3'].forEach(p => {
                const c = record.partials[p].continuous;
                const e = record.partials[p].exam;
                if (c != null || e != null) {
                    sum += ((c||0) + (e||0)) / 2;
                    count++;
                }
            });
            record.computed.finalScore = count > 0 ? sum / 3 : 0;
            return record;
        });

        return res.json(results);
    }

    } catch (error) {
        console.error("GetGrades Error:", error);
        res.status(500).json({ message: 'Server error fetching grades' });
    }
};