// controllers/grades.controller.js
import Grade from "../models/grade.model.js";
import Enrollment from "../models/enrollment.model.js";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const toScoreOrNull = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return clamp(n, 0, 20);
};

const toWeight = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return clamp(n, 0, 100);
};

const sumWeights100 = (weights) => {
  const w =
    (weights?.P1?.continuous ?? 0) +
    (weights?.P1?.exam ?? 0) +
    (weights?.P2?.continuous ?? 0) +
    (weights?.P2?.exam ?? 0) +
    (weights?.P3?.continuous ?? 0) +
    (weights?.P3?.exam ?? 0);

  return w;
};

// ✅ Regla: si hay susti (no null), reemplaza la menor entre Ex1 y Ex2
const applySubstitutiveToExams = ({ ex1, ex2, sub }) => {
  if (sub == null) return { ex1, ex2, replaced: null };

  // Si solo hay uno presente, reemplazamos ese (es el único candidato)
  if (ex1 == null && ex2 == null) return { ex1, ex2, replaced: null };
  if (ex1 != null && ex2 == null) return { ex1: sub, ex2, replaced: "Ex1" };
  if (ex1 == null && ex2 != null) return { ex1, ex2: sub, replaced: "Ex2" };

  // Ambos existen: reemplazar el menor (si empate, reemplaza Ex1)
  if (ex1 <= ex2) return { ex1: sub, ex2, replaced: "Ex1" };
  return { ex1, ex2: sub, replaced: "Ex2" };
};

// ✅ Final = sum(score * weight)/100, con Ex1/Ex2 ajustados por susti
const computeFinal = (g) => {
  const w = g?.weights || {};
  const s = g?.partials || {};

  const c1 = s?.P1?.continuous?.score ?? null;
  const ex1 = s?.P1?.exam?.score ?? null;
  const c2 = s?.P2?.continuous?.score ?? null;
  const ex2 = s?.P2?.exam?.score ?? null;
  const c3 = s?.P3?.continuous?.score ?? null;
  const ex3 = s?.P3?.exam?.score ?? null;

  const sub = g?.substitutive ?? null;
  const adj = applySubstitutiveToExams({ ex1, ex2, sub });

  // Missing => 0 (tu comportamiento previo)
  const total =
    ((c1 ?? 0) * (w?.P1?.continuous ?? 0)) +
    ((adj.ex1 ?? 0) * (w?.P1?.exam ?? 0)) +
    ((c2 ?? 0) * (w?.P2?.continuous ?? 0)) +
    ((adj.ex2 ?? 0) * (w?.P2?.exam ?? 0)) +
    ((c3 ?? 0) * (w?.P3?.continuous ?? 0)) +
    ((ex3 ?? 0) * (w?.P3?.exam ?? 0));

  const weightSum = sumWeights100(w);

  // Si por alguna razón no suman 100, igual devolvemos calculado sobre weightSum
  const denom = weightSum > 0 ? weightSum : 100;
  const finalScore = total / denom;

  return {
    finalScore,
    appliedSubstitutive: sub != null ? { replaced: adj.replaced } : null,
    adjustedExams: { ex1: adj.ex1, ex2: adj.ex2 },
    weightSum,
  };
};

// ===================================
// POST /grades/partial
// Guarda Cx y Exx (no pisa el resto)
// ===================================
export const setPartialGrades = async (req, res) => {
  const { section, studentId, partial, continuous, exam } = req.body;

  try {
    if (!section || !studentId || !partial) {
      return res.status(400).json({
        message: "section, studentId y partial son obligatorios.",
      });
    }

    if (!["P1", "P2", "P3"].includes(partial)) {
      return res.status(400).json({ message: "partial inválido (P1, P2, P3)." });
    }

    const contVal = toScoreOrNull(continuous);
    const examVal = toScoreOrNull(exam);

    const updated = await Grade.findOneAndUpdate(
      { section, student: studentId },
      {
        $set: {
          [`partials.${partial}.continuous.score`]: contVal,
          [`partials.${partial}.exam.score`]: examVal,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    const computed = computeFinal(updated);

    return res.json({
      message: "Parcial actualizado correctamente.",
      grade: updated,
      computed,
    });
  } catch (error) {
    console.error("Error setPartialGrades:", error);
    return res.status(500).json({ message: "Error guardando parcial." });
  }
};

// ===================================
// POST /grades/substitutive
// Guarda susti aparte
// ===================================
export const setSubstitutive = async (req, res) => {
  const { section, studentId, value } = req.body;

  try {
    if (!section || !studentId) {
      return res.status(400).json({ message: "section y studentId son obligatorios." });
    }

    const val = toScoreOrNull(value);

    const updated = await Grade.findOneAndUpdate(
      { section, student: studentId },
      { $set: { substitutive: val } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    const computed = computeFinal(updated);

    return res.json({
      message: "Sustitutivo actualizado correctamente.",
      grade: updated,
      computed,
    });
  } catch (error) {
    console.error("Error setSubstitutive:", error);
    return res.status(500).json({ message: "Error guardando sustitutivo." });
  }
};

// ===================================
// POST /grades/weights
// Cambiar pesos (validar suman 100)
// default: 15 15 15 15 20 20
// ===================================
export const setWeights = async (req, res) => {
  const { section, weights } = req.body;

  try {
    if (!section || !weights) {
      return res.status(400).json({ message: "section y weights son obligatorios." });
    }

    const normalized = {
      P1: {
        continuous: toWeight(weights?.P1?.continuous),
        exam: toWeight(weights?.P1?.exam),
      },
      P2: {
        continuous: toWeight(weights?.P2?.continuous),
        exam: toWeight(weights?.P2?.exam),
      },
      P3: {
        continuous: toWeight(weights?.P3?.continuous),
        exam: toWeight(weights?.P3?.exam),
      },
    };

    const total = sumWeights100(normalized);
    if (total !== 100) {
      return res.status(400).json({
        message: `Los pesos deben sumar 100. Actualmente suman ${total}.`,
      });
    }

    // Opción A (simple): guardar los pesos en TODOS los grades de esa sección
    // (Así el acta y cálculos quedan consistentes para todos)
    await Grade.updateMany(
      { section },
      { $set: { weights: normalized } }
    );

    return res.json({
      message: "Pesos actualizados correctamente.",
      weights: normalized,
    });
  } catch (error) {
    console.error("Error setWeights:", error);
    return res.status(500).json({ message: "Error guardando pesos." });
  }
};

// ===================================
// GET /grades?section=...
// GET /grades?studentId=...
// ===================================
export const getGrades = async (req, res) => {
  const { section, studentId } = req.query;

  try {
    if (!section && !studentId) {
      return res.status(400).json({ message: "Faltan parámetros (section o studentId)" });
    }

    // -------- Acta por sección (docente) --------
    if (section) {
      const enrollments = await Enrollment.find({ section })
        .populate("student", "name code")
        .lean();

      const grades = await Grade.find({ section }).lean();
      const byStudent = new Map(grades.map((g) => [g.student.toString(), g]));

      const roster = enrollments.map((enr) => {
        const sid = enr.student._id.toString();
        const g = byStudent.get(sid);

        const baseRow = {
          studentId: sid,
          studentName: enr.student.name,
          code: enr.student.code,
          partials: {
            P1: { continuous: null, exam: null },
            P2: { continuous: null, exam: null },
            P3: { continuous: null, exam: null },
          },
          weights: {
            P1: { continuous: 15, exam: 15 },
            P2: { continuous: 15, exam: 15 },
            P3: { continuous: 20, exam: 20 },
          },
          substitutive: null,
          computed: { finalScore: null },
        };

        if (!g) {
          // sin grade aún => fila vacía con pesos default
          return baseRow;
        }

        baseRow.partials.P1.continuous = g.partials?.P1?.continuous?.score ?? null;
        baseRow.partials.P1.exam = g.partials?.P1?.exam?.score ?? null;
        baseRow.partials.P2.continuous = g.partials?.P2?.continuous?.score ?? null;
        baseRow.partials.P2.exam = g.partials?.P2?.exam?.score ?? null;
        baseRow.partials.P3.continuous = g.partials?.P3?.continuous?.score ?? null;
        baseRow.partials.P3.exam = g.partials?.P3?.exam?.score ?? null;

        baseRow.weights = g.weights || baseRow.weights;
        baseRow.substitutive = g.substitutive ?? null;

        const computed = computeFinal(g);
        baseRow.computed.finalScore = computed.finalScore;

        return baseRow;
      });

      return res.json(roster);
    }

    // -------- Notas por estudiante (alumno) --------
    if (studentId) {
      const grades = await Grade.find({ student: studentId })
        .populate({
          path: "section",
          populate: { path: "course", select: "name code" },
        })
        .lean();

      const results = grades
        .filter((g) => g.section && g.section.course)
        .map((g) => {
          const computed = computeFinal(g);
          return {
            sectionId: g.section._id.toString(),
            courseCode: g.section.course.code,
            courseName: g.section.course.name,
            group: g.section.group,
            partials: {
              P1: {
                continuous: g.partials?.P1?.continuous?.score ?? null,
                exam: g.partials?.P1?.exam?.score ?? null,
              },
              P2: {
                continuous: g.partials?.P2?.continuous?.score ?? null,
                exam: g.partials?.P2?.exam?.score ?? null,
              },
              P3: {
                continuous: g.partials?.P3?.continuous?.score ?? null,
                exam: g.partials?.P3?.exam?.score ?? null,
              },
            },
            weights: g.weights,
            substitutive: g.substitutive ?? null,
            computed: { finalScore: computed.finalScore },
          };
        });

      return res.json(results);
    }
  } catch (error) {
    console.error("GetGrades Error:", error);
    return res.status(500).json({ message: "Server error fetching grades" });
  }
};
