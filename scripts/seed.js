// seeds/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../src/models/user.model.js";
import Course from "../src/models/course.model.js";
import Section from "../src/models/section.model.js";
import Room from "../src/models/room.model.js";
import Semester from "../src/models/semester.model.js";
import Enrollment from "../src/models/enrollment.model.js";
import AttendanceSession from "../src/models/attendance.model.js";

import { SEMESTERS, ROOMS } from "./data/academic.js";
import { BASE_USERS } from "./data/base_users.js";
import { COURSES } from "./data/courses.js";
import { SECTIONS } from "./data/sections.js";
import { SPECIAL_STUDENT_CODE,
      SPECIAL_STUDENT_THEORY_ENROLLMENTS,
      MASS_MAX_THEORY_SECTIONS_PER_STUDENT,
      MASS_ALLOW_FEWER_IF_NEEDED} from "./data/enrollments.js";
import { makeStudents, makeTeachers } from "./data/generator.js";

dotenv.config();

const must = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const toDate = (s) => new Date(s);

const makeSectionCode = ({ courseCode, type, group }) => {
  const prefix = type === "theory" ? "T" : "L";
  return `${prefix}${courseCode}-${group}`;
};

// IMPORTANT: User.create dispara hooks (hash password) si tu modelo lo hace en pre('save')
const createUsersSafely = async (users, passwordPlain) => {
  const created = [];
  for (const u of users) {
    created.push(await User.create({ ...u, password: passwordPlain }));
  }
  return created;
};

const seedDatabase = async () => {
  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);

    console.log("🧹 Limpiando BD...");
    await mongoose.connection.dropDatabase();

    // ========== 1) Semestres ==========
    const semestersDocs = await Semester.insertMany(
      SEMESTERS.map((s) => ({
        name: s.name,
        startDate: toDate(s.startDate),
        endDate: toDate(s.endDate),
        isActive: s.isActive,
      }))
    );

    const semesterByName = new Map();
    semestersDocs.forEach((doc) => semesterByName.set(doc.name, doc));
    console.log("✅ Semestres creados");

    // ========== 2) Aulas ==========
    const roomsDocs = await Room.insertMany(ROOMS);
    const roomByCode = new Map();
    roomsDocs.forEach((doc) => roomByCode.set(doc.code, doc));
    console.log("✅ Aulas creadas");

    // ========== 3) Usuarios ==========
    const passwordPlain = "pass_test_123";

    const baseUsersArr = Object.values(BASE_USERS);

    // opcional: generar más docentes
    const generatedTeachers = makeTeachers ? makeTeachers(15, 1) : [];

    // alumnos masivos
    const studentsData = makeStudents ? makeStudents(300, 1) : [];

    // ⚠️ Si tu email es UNIQUE, asegúrate que no haya repetidos aquí.
    const allUsersData = [
      ...baseUsersArr,
      ...generatedTeachers,
      ...studentsData,
    ];

    // Validación rápida por code (key) para no meter duplicados
    const seenCodes = new Set();
    for (const u of allUsersData) {
      must(u.code, `User sin code: ${u.email || u.name}`);
      must(!seenCodes.has(u.code), `Código de usuario duplicado: ${u.code}`);
      seenCodes.add(u.code);
    }

    const usersCreated = await createUsersSafely(allUsersData, passwordPlain);

    const userByCode = new Map();
    usersCreated.forEach((u) => userByCode.set(u.code, u));

    // Para enrollments: normalmente quieres SOLO los students generados (no admin/docentes)
    const studentsCreated = usersCreated.filter((u) => u.role === "student");

    console.log(`✅ Usuarios creados: ${usersCreated.length} (students: ${studentsCreated.length})`);

    // ========== 4) Cursos ==========
    const coursesDocs = await Course.insertMany(
      COURSES.map((c) => ({
        code: c.code,
        name: c.name,
        credits: c.credits,
        year: c.year,
        semester: c.semester,
        hoursPerWeek: c.hoursPerWeek,
        theoryHours: c.theoryHours,
        labHours: c.labHours,
      }))
    );

    const courseByCode = new Map();
    coursesDocs.forEach((doc) => courseByCode.set(doc.code, doc));
    console.log("✅ Cursos creados");

    // ========== 5) Secciones ==========
    const sectionsPayload = SECTIONS.map((s) => {
      must(s.course, `Section sin course: ${JSON.stringify(s)}`);
      must(s.semester, `Section sin semester: ${JSON.stringify(s)}`);
      must(s.teacher, `Section sin teacher: ${JSON.stringify(s)}`);

      const course = courseByCode.get(s.course);
      const semester = semesterByName.get(s.semester);
      const teacher = userByCode.get(s.teacher);

      must(course, `No existe Course.code=${s.course} (en SECTIONS)`);
      must(semester, `No existe Semester.name=${s.semester} (en SECTIONS)`);
      must(teacher, `No existe User.code=${s.teacher} (en SECTIONS)`);

      const code = makeSectionCode({
        courseCode: course.code,
        type: s.type,
        group: s.group,
      });

      const schedule = (s.schedule || []).map((slot) => {
        const room = roomByCode.get(slot.room);
        must(room, `No existe Room.code=${slot.room} (en schedule de ${code})`);
        return {
          day: slot.day,
          startHour: slot.startHour,
          duration: slot.duration,
          room: room._id,
        };
      });

      return {
        code, // ✅ tu key en DB
        course: course._id,
        semester: semester._id,
        type: s.type,
        group: s.group,
        teacher: teacher._id,
        capacity: s.capacity ?? 30,
        enrolledCount: 0,
        schedule,
      };
    });

    // (si tu Section tiene índice unique por code, esto es seguro)
    const sectionsDocs = await Section.insertMany(sectionsPayload);
    const sectionByCode = new Map();
    sectionsDocs.forEach((doc) => sectionByCode.set(doc.code, doc));

    console.log(`✅ Secciones creadas: ${sectionsDocs.length}`);

    // ========== 6) Matrículas (alumno especial + masivos por paquetes sin cruces) ==========

    // Semestre activo por isActive
    const activeSemesterName = SEMESTERS.find((s) => s.isActive)?.name;
    must(activeSemesterName, "No hay semestre activo marcado en SEMESTERS");
    const activeSemester = semesterByName.get(activeSemesterName);
    must(activeSemester, `No se resolvió semestre activo: ${activeSemesterName}`);

    // -------------------- helpers de horario --------------------
    const expandSlots = (schedule = []) => {
      // Convierte {day,startHour,duration} en tokens únicos por hora académica
      // Ej: Tuesday + hour 6 duration 2 => Tuesday-6, Tuesday-7
      const tokens = [];
      for (const s of schedule) {
        for (let k = 0; k < (s.duration || 0); k++) {
          tokens.push(`${s.day}-${s.startHour + k}`);
        }
      }
      return tokens;
    };

    const hasTimeConflict = (secA, secB) => {
      const A = secA._tokens;
      const B = secB._tokens;
      for (const t of A) if (B.has(t)) return true;
      return false;
    };

    const canAddSectionToPackage = (pkg, sec) => {
      for (const existing of pkg) {
        if (hasTimeConflict(existing, sec)) return false;
      }
      return true;
    };

    // -------------------- preprocesar theory sections --------------------
    const theorySections = sectionsDocs
      .filter((s) => s.type === "theory")
      .map((s) => {
        const tokens = expandSlots(
          // schedule en DB ya tiene day/startHour/duration
          // (room es ObjectId, no importa para choques)
          (s.schedule || []).map((x) => ({
            day: x.day,
            startHour: x.startHour,
            duration: x.duration,
          }))
        );
        return { ...s.toObject(), _tokens: new Set(tokens) };
      });

    // Orden estable (por curso+grupo) para que siempre genere lo mismo
    theorySections.sort((a, b) => String(a.code).localeCompare(String(b.code)));

    // Control de cupos en memoria (no pasamos capacity)
    const usedBySectionId = new Map(); // sectionId(str) -> usedCount

    const sectionDocById = new Map();
    sectionsDocs.forEach((s) => sectionDocById.set(String(s._id), s));

    const enrollmentsPayload = [];

    // -------------------- 6.1) Alumno especial (fijo) --------------------
    const specialStudent = userByCode.get(SPECIAL_STUDENT_CODE);
    must(specialStudent, `No existe alumno especial ${SPECIAL_STUDENT_CODE} en users`);

    for (const sectionCode of SPECIAL_STUDENT_THEORY_ENROLLMENTS) {
      const sec = sectionByCode.get(sectionCode);
      must(sec, `No existe Section.code=${sectionCode} (alumno especial)`);

      const key = String(sec._id);
      const used = usedBySectionId.get(key) || 0;
      must(used < (sec.capacity ?? 30), `No hay cupo en ${sectionCode} para alumno especial`);

      usedBySectionId.set(key, used + 1);

      enrollmentsPayload.push({
        student: specialStudent._id,
        section: sec._id,
        semester: activeSemester._id,
        status: "enrolled",
        labPreferences: [],
      });
    }

    // -------------------- 6.2) Generar PAQUETES (combos sin cruces) --------------------
    // Idea: construir paquetes de tamaño 3, luego 2, luego 1 (según config)
    // y asignarlos round-robin a alumnos, respetando capacidad.

    const makePackages = (maxSize = 3) => {
      const packages = [];

      // greedy: intenta llenar paquetes con secciones distintas (sin choques)
      for (const sec of theorySections) {
        // intenta meter la sección en un paquete existente que aún tenga espacio
        let placed = false;

        for (const pkg of packages) {
          if (pkg.length >= maxSize) continue;
          if (canAddSectionToPackage(pkg, sec)) {
            pkg.push(sec);
            placed = true;
            break;
          }
        }

        if (!placed) packages.push([sec]);
      }

      // Ahora algunos paquetes pueden haber quedado con 1 o 2, pero está bien.
      // Ordenamos paquetes para priorizar los más grandes primero.
      packages.sort((a, b) => b.length - a.length);
      return packages;
    };

    // Creamos paquetes de tamaño máximo deseado
    let packages = makePackages(MASS_MAX_THEORY_SECTIONS_PER_STUDENT);

    // Si NO permites menos, filtramos solo paquetes del tamaño exacto
    if (!MASS_ALLOW_FEWER_IF_NEEDED) {
      packages = packages.filter((p) => p.length === MASS_MAX_THEORY_SECTIONS_PER_STUDENT);
      must(packages.length > 0, "No se pudieron armar paquetes sin cruces del tamaño solicitado.");
    }

    const massStudents = studentsCreated.filter((s) => s.code !== SPECIAL_STUDENT_CODE);

    // -------------------- 6.3) Asignar alumnos por BLOQUES a paquetes --------------------
    const packageHasSeats = (pkg) => {
      // un paquete tiene cupo si todas sus secciones tienen cupo
      for (const sec of pkg) {
        const secDb = sectionDocById.get(String(sec._id)) || sectionByCode.get(sec.code);
        const key = String(sec._id);
        const used = usedBySectionId.get(key) || 0;
        if (used >= (secDb?.capacity ?? 30)) return false;
      }
      return true;
    };

    const reservePackageSeats = (pkg) => {
      for (const sec of pkg) {
        const key = String(sec._id);
        const used = usedBySectionId.get(key) || 0;
        usedBySectionId.set(key, used + 1);
      }
    };

    let pkgIndex = 0;

    for (const student of massStudents) {
      // Buscar el próximo paquete con cupo
      let chosen = null;
      let attempts = 0;

      while (attempts < packages.length) {
        const candidate = packages[pkgIndex % packages.length];
        pkgIndex++;
        attempts++;

        if (candidate && candidate.length > 0 && packageHasSeats(candidate)) {
          chosen = candidate;
          break;
        }
      }

      if (!chosen) {
        // Si no encontramos paquete con cupo:
        if (MASS_ALLOW_FEWER_IF_NEEDED) {
          // Intentar asignarle al menos 1 sección con cupo (la primera disponible)
          const single = theorySections.find((sec) => {
            const secDb = sectionDocById.get(String(sec._id));
            const used = usedBySectionId.get(String(sec._id)) || 0;
            return used < (secDb?.capacity ?? 30);
          });

          if (!single) break; // ya no hay cupos en ninguna sección
          chosen = [single];
        } else {
          break;
        }
      }

      // Reservamos cupos y creamos enrollments para ese alumno
      reservePackageSeats(chosen);

      for (const sec of chosen) {
        enrollmentsPayload.push({
          student: student._id,
          section: sec._id,
          semester: activeSemester._id,
          status: "enrolled",
          labPreferences: [],
        });
      }
    }

    await Enrollment.insertMany(enrollmentsPayload);
    console.log(`✅ Matrículas creadas: ${enrollmentsPayload.length}`);

    // Log de ocupación por sección
    const report = [];
    for (const s of sectionsDocs) {
      const used = usedBySectionId.get(String(s._id)) || 0;
      if (used > 0) report.push({ code: s.code, used, capacity: s.capacity ?? 30 });
    }
    report.sort((a, b) => a.code.localeCompare(b.code));
    console.table(report);

    // ========== 7) Asistencias (solo alumno especial) ==========

    const day0 = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };

    const makeWeeklyStatuses = ({ weeks, absences, lateCount }) => {
      const arr = Array.from({ length: weeks }, () => "present");

      // poner "late" en algunas semanas (sin pisar absent)
      for (let i = 0, placed = 0; placed < lateCount && i < weeks * 5; i++) {
        const idx = (i * 3 + 1) % weeks; 
        if (arr[idx] === "present") {
          arr[idx] = "late";
          placed++;
        }
      }

      for (let i = 0, placed = 0; placed < absences && i < weeks * 10; i++) {
        const idx = (i * 5 + 2) % weeks; 
        if (arr[idx] !== "absent") {
          arr[idx] = "absent";
          placed++;
        }
      }

      return arr;
    };

    const seedSpecialStudentAttendance = async ({
      specialStudentUser,
      sectionDocsByCode,
      semesterDoc,
      createdByUser,
      weeks = 12,
    }) => {
      // elegimos 1 curso para que tenga 7 faltas
      const heavyAbsenceSectionCode = SPECIAL_STUDENT_THEORY_ENROLLMENTS[0];
      const sessionsPayload = [];

      // fecha base: inicio del semestre
      const baseDate = day0(semesterDoc.startDate);

      for (const sectionCode of SPECIAL_STUDENT_THEORY_ENROLLMENTS) {
        const sec = sectionDocsByCode.get(sectionCode);
        must(sec, `No existe Section.code=${sectionCode} (para asistencias)`);

        const isHeavy = sectionCode === heavyAbsenceSectionCode;

        const absences = isHeavy ? 7 : 2;      
        const lateCount = isHeavy ? 2 : 1;     
        const statuses = makeWeeklyStatuses({ weeks, absences, lateCount });

        for (let w = 1; w <= weeks; w++) {
          // una sesión por semana por sección
          const date = day0(new Date(baseDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000));

          sessionsPayload.push({
            section: sec._id,
            date,
            week: w,
            createdBy: createdByUser._id,
            entries: [
              {
                student: specialStudentUser._id,
                status: statuses[w - 1], 
              },
            ],
          });
        }
      }

      await AttendanceSession.insertMany(sessionsPayload);
      console.log(`✅ Asistencias creadas (alumno especial): ${sessionsPayload.length}`);
    };

    const specialStudentUser = userByCode.get(SPECIAL_STUDENT_CODE);
    must(specialStudentUser, `No existe alumno especial ${SPECIAL_STUDENT_CODE} para asistencias`);

    const createdByUser =
      usersCreated.find((u) => u.role === "admin") ||
      usersCreated.find((u) => u.role === "teacher") ||
      usersCreated[0];
    must(createdByUser, "No se pudo resolver createdByUser para asistencias");

    await seedSpecialStudentAttendance({
      specialStudentUser,
      sectionDocsByCode: sectionByCode,
      semesterDoc: activeSemester,
      createdByUser,
      weeks: 12,
    });


    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fatal en el seed:", error);
    process.exit(1);
  }
};

seedDatabase();
