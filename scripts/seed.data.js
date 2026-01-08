// seeds/seed.data.js
export const SEMESTERS = [
  {
    key: "2025-A",
    name: "2025-A",
    startDate: "2025-04-15",
    endDate: "2025-07-29",
    isActive: false,
  },
  {
    key: "2025-B",
    name: "2025-B",
    startDate: "2025-08-15",
    endDate: "2026-01-16",
    isActive: true,
  },
];

export const ROOMS = [
  { key: "A-201", code: "A-201", name: "Aula 201", capacity: 30, location: "Piso 2" },
  { key: "A-203", code: "A-203", name: "Aula 203", capacity: 32, location: "Piso 2" },
  { key: "L-1", code: "L-1", name: "Laboratorio 1", capacity: 20, location: "Piso 1", type: "lab" },
  { key: "L-2", code: "L-2", name: "Laboratorio 2", capacity: 24, location: "Piso 1", type: "lab" },
];

export const BASE_USERS = {
  admin: {
    key: "admin",
    name: "Administrador Principal",
    email: "admin@unsa.edu.pe",
    code: "A-001",
    role: "admin",
    active: true,
  },
  teacher1: {
    key: "teacher1",
    name: "Docente de Prueba",
    email: "docente_test@unsa.edu.pe",
    code: "D-001",
    role: "teacher",
    active: true,
  },
  teacher2: {
    key: "teacher2",
    name: "Docente de Prueba 2",
    email: "docente_test_2@unsa.edu.pe",
    code: "D-002",
    role: "teacher",
    active: true,
  },
};

export const COURSES = [
  {
    key: "SO",
    name: "Sistemas Operativos",
    code: "1703239",
    credits: 4,
    year: 3,
    semester: 6,
    hoursPerWeek: 6,
    theoryHours: 4,
    labHours: 2,
  },
  {
    key: "TI",
    name: "Trabajo Interdisciplinar II",
    code: "1703240",
    credits: 3,
    year: 3,
    semester: 6,
    hoursPerWeek: 2,
    theoryHours: 2,
    labHours: 0,
  },
  {
    key: "MAC",
    name: "Matemática Aplicada a la Computación",
    code: "1703241",
    credits: 4,
    year: 3,
    semester: 6,
    hoursPerWeek: 6,
    theoryHours: 4,
    labHours: 2,
  },
  {
    key: "ISII",
    name: "Ingeniería de Software II",
    code: "1703237",
    credits: 4,
    year: 3,
    semester: 6,
    hoursPerWeek: 6,
    theoryHours: 4,
    labHours: 2,
  },
];

// Secciones se definen “por key” (resueltas luego a IDs en la lógica)
export const SECTIONS = [
  // --- TEORÍA ---
  {
    key: "SO-THEORY-A",
    courseKey: "SO",
    semesterKey: "2025-B",
    type: "theory",
    group: "A",
    teacherKey: "teacher1",
    capacity: 30,
    schedule: [
      { day: "Monday", startHour: 7, duration: 2, roomKey: "A-203" },
      { day: "Wednesday", startHour: 5, duration: 2, roomKey: "A-203" },
    ],
  },
  {
    key: "SO-THEORY-B",
    courseKey: "SO",
    semesterKey: "2025-B",
    type: "theory",
    group: "B",
    teacherKey: "teacher2",
    capacity: 30,
    schedule: [
      { day: "Wednesday", startHour: 11, duration: 2, roomKey: "A-203" },
      { day: "Friday", startHour: 11, duration: 2, roomKey: "A-203" },
    ],
  },

  {
    key: "TI-THEORY-A",
    courseKey: "TI",
    semesterKey: "2025-B",
    type: "theory",
    group: "A",
    teacherKey: "teacher1",
    capacity: 28,
    schedule: [{ day: "Wednesday", startHour: 1, duration: 2, roomKey: "A-203" }],
  },
  {
    key: "TI-THEORY-B",
    courseKey: "TI",
    semesterKey: "2025-B",
    type: "theory",
    group: "B",
    teacherKey: "teacher1",
    capacity: 28,
    schedule: [{ day: "Thursday", startHour: 3, duration: 2, roomKey: "A-203" }],
  },

  {
    key: "MAC-THEORY-A",
    courseKey: "MAC",
    semesterKey: "2025-B",
    type: "theory",
    group: "A",
    teacherKey: "teacher1",
    capacity: 32,
    schedule: [
      { day: "Monday", startHour: 1, duration: 2, roomKey: "A-203" },
      { day: "Tuesday", startHour: 4, duration: 2, roomKey: "A-203" },
    ],
  },

  {
    key: "ISII-THEORY-A",
    courseKey: "ISII",
    semesterKey: "2025-B",
    type: "theory",
    group: "A",
    teacherKey: "teacher1",
    capacity: 32,
    schedule: [
      { day: "Monday", startHour: 3, duration: 2, roomKey: "A-203" },
      { day: "Thursday", startHour: 1, duration: 2, roomKey: "A-203" },
    ],
  },

  // --- LABS ---
  {
    key: "SO-LAB-A",
    courseKey: "SO",
    semesterKey: "2025-B",
    type: "lab",
    group: "A",
    teacherKey: "teacher2",
    capacity: 20,
    schedule: [{ day: "Tuesday", startHour: 7, duration: 2, roomKey: "L-1" }],
  },
  {
    key: "SO-LAB-B",
    courseKey: "SO",
    semesterKey: "2025-B",
    type: "lab",
    group: "B",
    teacherKey: "teacher2",
    capacity: 20,
    schedule: [{ day: "Tuesday", startHour: 9, duration: 2, roomKey: "L-1" }],
  },

  {
    key: "MAC-LAB-A",
    courseKey: "MAC",
    semesterKey: "2025-B",
    type: "lab",
    group: "A",
    teacherKey: "teacher1",
    capacity: 24,
    schedule: [{ day: "Friday", startHour: 3, duration: 2, roomKey: "L-2" }],
  },
  {
    key: "MAC-LAB-B",
    courseKey: "MAC",
    semesterKey: "2025-B",
    type: "lab",
    group: "B",
    teacherKey: "teacher1",
    capacity: 24,
    schedule: [{ day: "Tuesday", startHour: 11, duration: 2, roomKey: "L-2" }],
  },
  {
    key: "MAC-LAB-C",
    courseKey: "MAC",
    semesterKey: "2025-B",
    type: "lab",
    group: "C",
    teacherKey: "teacher2",
    capacity: 20,
    schedule: [{ day: "Wednesday", startHour: 11, duration: 2, roomKey: "A-203" }],
  },

  {
    key: "ISII-LAB-A",
    courseKey: "ISII",
    semesterKey: "2025-B",
    type: "lab",
    group: "A",
    teacherKey: "teacher2",
    capacity: 20,
    schedule: [{ day: "Monday", startHour: 1, duration: 2, roomKey: "A-203" }],
  },
  {
    key: "ISII-LAB-B",
    courseKey: "ISII",
    semesterKey: "2025-B",
    type: "lab",
    group: "B",
    teacherKey: "teacher2",
    capacity: 20,
    schedule: [{ day: "Wednesday", startHour: 1, duration: 2, roomKey: "A-203" }],
  },
  {
    key: "ISII-LAB-C",
    courseKey: "ISII",
    semesterKey: "2025-B",
    type: "lab",
    group: "C",
    teacherKey: "teacher2",
    capacity: 20,
    schedule: [{ day: "Friday", startHour: 1, duration: 2, roomKey: "A-203" }],
  },
];

// Generador de alumnos (300 por ejemplo)
export const makeStudents = (count = 300, startCode = 20251001) => {
  const students = [];
  for (let i = 0; i < count; i++) {
    const code = String(startCode + i);
    students.push({
      key: `student-${code}`,
      name: `Alumno ${i + 1}`,
      email: `alumno_${code}@unsa.edu.pe`,
      code,
      role: "student",
      active: true,
    });
  }
  return students;
};

// Matrículas de teoría por alumno: lista de sectionKeys
export const STUDENT_THEORY_ENROLLMENTS = [
  "SO-THEORY-B",
  "TI-THEORY-A",
  "MAC-THEORY-A",
  "ISII-THEORY-A",
];
