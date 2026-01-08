// seeds/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../src/models/user.model.js";
import Course from "../src/models/course.model.js";
import Section from "../src/models/section.model.js";
import Room from "../src/models/room.model.js";
import Semester from "../src/models/semester.model.js";
import Enrollment from "../src/models/enrollment.model.js";

import {
  SEMESTERS,
  ROOMS,
  BASE_USERS,
  COURSES,
  SECTIONS,
  makeStudents,
  STUDENT_THEORY_ENROLLMENTS,
} from "./seed.data.js";

dotenv.config();

const must = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const toDate = (s) => new Date(s);

// ⚠️ Importante: si tu modelo User hashea el password en pre('save'),
// NO uses insertMany para usuarios (puede saltarse middlewares).
// Mejor usa User.create en bulk controlado o hashea tú con bcrypt.
// Aquí uso User.create para asegurar hashing.
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
    console.log("🧹 Limpiando colecciones...");
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

    const semesterByKey = new Map();
    SEMESTERS.forEach((s, idx) => semesterByKey.set(s.key, semestersDocs[idx]));

    console.log("✅ Semestres creados");

    // ========== 2) Aulas ==========
    const roomsDocs = await Room.insertMany(ROOMS);
    const roomByKey = new Map();
    ROOMS.forEach((r, idx) => roomByKey.set(r.key, roomsDocs[idx]));
    console.log("✅ Aulas creadas");

    // ========== 3) Usuarios ==========
    const passwordPlain = "pass_test_123";

    const baseUsers = Object.values(BASE_USERS);
    const baseUsersCreated = await createUsersSafely(baseUsers, passwordPlain);

    const baseUserByKey = new Map();
    baseUsers.forEach((u, idx) => baseUserByKey.set(u.key, baseUsersCreated[idx]));

    // alumnos masivos
    const studentsData = makeStudents(300, 20251001);
    const studentsCreated = await createUsersSafely(studentsData, passwordPlain);

    const userByKey = new Map(baseUserByKey);
    studentsData.forEach((u, idx) => userByKey.set(u.key, studentsCreated[idx]));

    console.log(`✅ Usuarios creados (admin/docentes + ${studentsCreated.length} alumnos)`);

    // ========== 4) Cursos ==========
    const coursesDocs = await Course.insertMany(
      COURSES.map((c) => ({
        name: c.name,
        code: c.code,
        credits: c.credits,
        year: c.year,
        semester: c.semester,
        hoursPerWeek: c.hoursPerWeek,
        theoryHours: c.theoryHours,
        labHours: c.labHours,
      }))
    );

    const courseByKey = new Map();
    COURSES.forEach((c, idx) => courseByKey.set(c.key, coursesDocs[idx]));

    console.log("✅ Cursos creados");

    // ========== 5) Secciones ==========
    const sectionsPayload = SECTIONS.map((s) => {
      const course = courseByKey.get(s.courseKey);
      const semester = semesterByKey.get(s.semesterKey);
      const teacher = userByKey.get(s.teacherKey);
      must(course, `No existe courseKey ${s.courseKey}`);
      must(semester, `No existe semesterKey ${s.semesterKey}`);
      must(teacher, `No existe teacherKey ${s.teacherKey}`);

      const schedule = s.schedule.map((slot) => {
        const room = roomByKey.get(slot.roomKey);
        must(room, `No existe roomKey ${slot.roomKey}`);
        return {
          day: slot.day,
          startHour: slot.startHour,
          duration: slot.duration,
          room: room._id,
        };
      });

      return {
        course: course._id,
        semester: semester._id,
        type: s.type,
        group: s.group,
        teacher: teacher._id,
        capacity: s.capacity,
        enrolledCount: 0,
        schedule,
      };
    });

    const sectionsDocs = await Section.insertMany(sectionsPayload);

    const sectionByKey = new Map();
    SECTIONS.forEach((s, idx) => sectionByKey.set(s.key, sectionsDocs[idx]));

    console.log("✅ Secciones creadas");

    // ========== 6) Matrículas de teoría para todos los alumnos ==========
    // Usa el semestre activo por key o por flag
    const activeSemesterKey = SEMESTERS.find((s) => s.isActive)?.key;
    must(activeSemesterKey, "No hay semestre activo en SEMESTERS");
    const activeSemester = semesterByKey.get(activeSemesterKey);

    const theorySectionIds = STUDENT_THEORY_ENROLLMENTS.map((k) => {
      const sec = sectionByKey.get(k);
      must(sec, `No existe sectionKey ${k} en STUDENT_THEORY_ENROLLMENTS`);
      return sec._id;
    });

    // insertMany masivo para enrollments (aquí no hay hashing, todo ok)
    const enrollmentsPayload = [];
    for (const student of studentsCreated) {
      for (const sectionId of theorySectionIds) {
        enrollmentsPayload.push({
          student: student._id,
          section: sectionId,
          semester: activeSemester._id,
          status: "enrolled",
          labPreferences: [],
        });
      }
    }

    // Si tienes índice único y no quieres que reviente por duplicados futuros:
    // Enrollment.insertMany(payload, { ordered: false })
    await Enrollment.insertMany(enrollmentsPayload);
    console.log(`✅ Matrículas creadas: ${enrollmentsPayload.length}`);

    console.log("🏁 SEED COMPLETADO. Base de datos lista para la demo.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fatal en el seed:", error);
    process.exit(1);
  }
};

seedDatabase();
