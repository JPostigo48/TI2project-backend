export const SECTIONS = [
  // ============================================================
  // Malla 2025 — 1er año — Semestre 2025-B
  // Aula base: A-201
  // Labs: LAB01 -> L-1, LAB02 -> L-2
  // ============================================================

  // ------------------------------------------------------------
  // PROGRAMACIÓN I (2501208)
  // Grupo A — Teoría/Práctica (aula)
  {
    course: "2501208",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-001",
    capacity: 30,
    schedule: [
      // Martes 07:00–08:40 (1ra-2da) PROGRAMACIÓN I TEORIA A
      { day: "Tuesday", startHour: 1, duration: 2, room: "A-201" },
      // Viernes 08:50–10:30 (3ra-4ta) PROGRAMACIÓN I PRACTICA A
      { day: "Friday", startHour: 3, duration: 2, room: "A-201" },
    ],
  },
  // Grupo A — Laboratorio (LAB A)
  {
    course: "2501208",
    semester: "2025-B",
    type: "lab",
    group: "A",
    teacher: "T-002",
    capacity: 20,
    schedule: [
      // Viernes 10:40–12:20 (5ta-6ta) PROGRAMACIÓN I LAB01 (LAB A)
      { day: "Friday", startHour: 5, duration: 2, room: "L-1" },
      // Martes 11:30–13:10 (6ta-7ma) PROGRAMACIÓN I LAB02 (LAB A)
      { day: "Tuesday", startHour: 6, duration: 2, room: "L-2" },
    ],
  },

  // Grupo B — Teoría/Práctica (aula)
  {
    course: "2501208",
    semester: "2025-B",
    type: "theory",
    group: "B",
    teacher: "T-001",
    capacity: 30,
    schedule: [
      // Lunes 15:50–17:30 (11ra-12da) PROGRAMACIÓN I TEORIA B
      { day: "Monday", startHour: 11, duration: 2, room: "A-201" },
      // Jueves 15:50–17:30 (11ra-12da) PROGRAMACIÓN I PRACTICA B
      { day: "Thursday", startHour: 11, duration: 2, room: "A-201" },
    ],
  },

  // Grupo B — Laboratorios (LAB B y LAB C)
  {
    course: "2501208",
    semester: "2025-B",
    type: "lab",
    group: "B", // LAB B
    teacher: "T-002",
    capacity: 20,
    schedule: [
      // Miércoles 17:40–19:20 (13ra-14ta) PROGRAMACIÓN I LAB01 (LAB B)
      { day: "Wednesday", startHour: 13, duration: 2, room: "L-1" },
      // Jueves 17:40–19:20 (13ra-14ta) PROGRAMACIÓN I LAB01 (LAB B) ...
      { day: "Thursday", startHour: 13, duration: 2, room: "L-1" },
    ],
  },
  {
    course: "2501208",
    semester: "2025-B",
    type: "lab",
    group: "C", // LAB C (LAB01/LAB02)
    teacher: "T-002",
    capacity: 20,
    schedule: [
      // Lunes 17:40–19:20 (13ra-14ta) PROGRAMACIÓN I LAB01 (LAB C)
      { day: "Monday", startHour: 13, duration: 2, room: "L-1" },
      // Jueves 17:40–19:20 también aparece "... Y PROGRAMACIÓN I LAB02 (LAB C)"
      // (mismo bloque horario; aquí lo representamos como sesión en LAB02)
      { day: "Thursday", startHour: 13, duration: 2, room: "L-2" },
    ],
  },

  // ------------------------------------------------------------
  // REALIDAD NACIONAL (2501212)
  // Grupo A
  {
    course: "2501212",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-003",
    capacity: 30,
    schedule: [
      // Miércoles 07:00–08:40 (1ra-2da) TEORIA + PRACTICA
      { day: "Wednesday", startHour: 1, duration: 2, room: "A-201" },
      // Miércoles 08:50–09:40 (3ra) PRACTICA
      { day: "Wednesday", startHour: 3, duration: 1, room: "A-201" },
    ],
  },
  // Grupo B
  {
    course: "2501212",
    semester: "2025-B",
    type: "theory",
    group: "B",
    teacher: "T-003",
    capacity: 30,
    schedule: [
      // Martes 16:40–19:20 (12da-14ta) TEORIA + PRACTICA
      { day: "Tuesday", startHour: 12, duration: 3, room: "A-201" },
    ],
  },

  // ------------------------------------------------------------
  // CÁLCULO EN UNA VARIABLE (2501209)
  // Grupo A — Teoría/Práctica
  {
    course: "2501209",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-004",
    capacity: 30,
    schedule: [
      // Lunes 08:50–10:30 (3ra-4ta) TEORIA
      { day: "Monday", startHour: 3, duration: 2, room: "A-201" },
      // Martes 08:50–10:30 (3ra-4ta) TEORIA
      { day: "Tuesday", startHour: 3, duration: 2, room: "A-201" },
      // Jueves 10:40–12:20 (5ta-6ta) PRACTICA
      { day: "Thursday", startHour: 5, duration: 2, room: "A-201" },
    ],
  },

  // Grupo B — Teoría/Práctica
  {
    course: "2501209",
    semester: "2025-B",
    type: "theory",
    group: "B",
    teacher: "T-004",
    capacity: 30,
    schedule: [
      // Martes 12:20–14:00 (7ma-8va) TEORIA (aparece en el horario del grupo A con “/”)
      { day: "Tuesday", startHour: 7, duration: 2, room: "A-201" },
      // Miércoles 15:50–17:30 (11ra-12da) TEORIA
      { day: "Wednesday", startHour: 11, duration: 2, room: "A-201" },
      // Viernes 15:50–17:30 (11ra-12da) PRACTICA
      { day: "Friday", startHour: 11, duration: 2, room: "A-201" },
    ],
  },

  // ------------------------------------------------------------
  // INGLÉS II (2501210)
  // Grupo A
  {
    course: "2501210",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-005",
    capacity: 30,
    schedule: [
      // Lunes 10:40–12:20 (5ta-6ta)
      { day: "Monday", startHour: 5, duration: 2, room: "A-201" },
      // Jueves 08:50–10:30 (3ra-4ta)
      { day: "Thursday", startHour: 3, duration: 2, room: "A-201" },
    ],
  },

  // Grupo B (aparece 2 veces en el horario: viernes mañana + viernes tarde)
  {
    course: "2501210",
    semester: "2025-B",
    type: "theory",
    group: "B",
    teacher: "T-005",
    capacity: 30,
    schedule: [
      // Viernes 12:20–14:00 (7ma-8va) “Ingles II (B) Teoria”
      { day: "Friday", startHour: 7, duration: 2, room: "A-201" },
      // Viernes 17:40–19:20 (13ra-14ta) “Ingles II (B)”
      { day: "Friday", startHour: 13, duration: 2, room: "A-201" },
    ],
  },

  // ------------------------------------------------------------
  // LINGÜÍSTICA, COMPRENSIÓN Y REDACCIÓN ACADÉMICA (2501211)
  // Grupo A
  {
    course: "2501211",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-006",
    capacity: 30,
    schedule: [
      // Miércoles 09:40–10:30 TEORIA
      { day: "Wednesday", startHour: 4, duration: 1, room: "A-201" },
      // Miércoles 10:40–12:20 PRACTICA
      { day: "Wednesday", startHour: 5, duration: 2, room: "A-201" },
      // Viernes 07:00–08:40 PRACTICA
      { day: "Friday", startHour: 1, duration: 2, room: "A-201" },
    ],
  },

  // Grupo B
  {
    course: "2501211",
    semester: "2025-B",
    type: "theory",
    group: "B",
    teacher: "T-006",
    capacity: 30,
    schedule: [
      // Martes 14:00–14:50 TEORIA
      { day: "Tuesday", startHour: 9, duration: 1, room: "A-201" },
      // Martes 14:50–16:40 PRACTICA
      { day: "Tuesday", startHour: 10, duration: 2, room: "A-201" },
      // Viernes 14:00–15:40 PRACTICA
      { day: "Friday", startHour: 9, duration: 2, room: "A-201" },
    ],
  },

  // ------------------------------------------------------------
  // ESTRUCTURAS DISCRETAS II (2501207)
  // Grupo A (incluye teoría + práctica)
  {
    course: "2501207",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-007",
    capacity: 30,
    schedule: [
      // Lunes 12:20–14:00 (7ma-8va) TEORIA
      { day: "Monday", startHour: 7, duration: 2, room: "A-201" },
      // Miércoles 12:20–14:00 (7ma-8va) TEORIA
      { day: "Wednesday", startHour: 7, duration: 2, room: "A-201" },
      // Jueves 12:20–14:00 (7ma-8va) PRACTICA
      { day: "Thursday", startHour: 7, duration: 2, room: "A-201" },
    ],
  },

  // Grupo B (incluye teoría + práctica)
  {
    course: "2501207",
    semester: "2025-B",
    type: "theory",
    group: "B",
    teacher: "T-007",
    capacity: 30,
    schedule: [
      // Lunes 14:00–15:40 (9na-10ma) TEORIA
      { day: "Monday", startHour: 9, duration: 2, room: "A-201" },
      // Miércoles 14:00–15:40 (9na-10ma) TEORIA
      { day: "Wednesday", startHour: 9, duration: 2, room: "A-201" },
      // Jueves 14:00–15:40 (9na-10ma) PRACTICA
      { day: "Thursday", startHour: 9, duration: 2, room: "A-201" },
    ],
  },

  // ============================================================
  // Malla 2017 — 3er año (Cursos del semester 6) — Semestre 2025-B
  // Aula base: A-203
  // Labs (asumidos):
  //  - LAB01 -> L-1
  //  - LAB02 -> L-2
  //  - LAB04 -> L-3   
  // ============================================================

  // ------------------------------------------------------------
  // MATEMÁTICA APLICADA A LA COMPUTACIÓN (1703241)
  // Grupo A — teoría + práctica (aula)
  {
    course: "1703241",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-001",
    capacity: 30,
    schedule: [
      // Lunes 07:00–08:40 (1ra-2da) TEORIA
      { day: "Monday", startHour: 1, duration: 2, room: "A-203" },
      // Martes 09:40–11:30 (4ta-5ta) PRACTICA
      { day: "Tuesday", startHour: 4, duration: 2, room: "A-203" },
    ],
  },
  // Grupo A — lab (LAB A) LAB02
  {
    course: "1703241",
    semester: "2025-B",
    type: "lab",
    group: "A",
    teacher: "T-002",
    capacity: 24,
    schedule: [
      // Viernes 08:50–10:30 (3ra-4ta) LAB02 (LAB A)
      { day: "Friday", startHour: 3, duration: 2, room: "L-2" },
    ],
  },

  // Grupo B — teoría + práctica (aula)
  {
    course: "1703241",
    semester: "2025-B",
    type: "theory",
    group: "B",
    teacher: "T-001",
    capacity: 30,
    schedule: [
      // Jueves 15:50–17:30 (11ra-12da) TEORIA
      { day: "Thursday", startHour: 11, duration: 2, room: "A-203" },
      // Viernes 14:00–15:40 (9na-10ma) PRACTICA
      { day: "Friday", startHour: 9, duration: 2, room: "A-203" },
    ],
  },
  // Grupo B — lab (LAB B) LAB02
  {
    course: "1703241",
    semester: "2025-B",
    type: "lab",
    group: "B",
    teacher: "T-002",
    capacity: 24,
    schedule: [
      // Martes 15:50–17:30 (11ra-12da) LAB02 (LAB B)
      { day: "Tuesday", startHour: 11, duration: 2, room: "L-2" },
    ],
  },

  // ------------------------------------------------------------
  // ANÁLISIS Y DISEÑO DE ALGORITMOS (1703131)
  // Grupo A — teoría/práctica (aula)
  {
    course: "1703131",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-003",
    capacity: 30,
    schedule: [
      // Viernes 07:00–08:40 PRACTICA
      { day: "Friday", startHour: 1, duration: 2, room: "A-203" },
    ],
  },
  // Grupo A — lab (LAB02)
  {
    course: "1703131",
    semester: "2025-B",
    type: "lab",
    group: "A",
    teacher: "T-003",
    capacity: 24,
    schedule: [
      // Martes 07:00–08:40 LAB02
      { day: "Tuesday", startHour: 1, duration: 2, room: "L-2" },
    ],
  },

  // Grupo B — teoría (aparece combinado con EDA lab en lunes)
  {
    course: "1703131",
    semester: "2025-B",
    type: "theory",
    group: "B",
    teacher: "T-003",
    capacity: 30,
    schedule: [
      // Lunes 15:50–17:30 TEORIA (compartido con EDA LAB02 según tu celda con "/")
      { day: "Monday", startHour: 11, duration: 2, room: "A-203" },
    ],
  },

  // ------------------------------------------------------------
  // TRABAJO INTERDISCIPLINAR II (1703240)
  // Grupo A — teoría + práctica
  {
    course: "1703240",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-004",
    capacity: 28,
    schedule: [
      // Miércoles 07:00–08:40 TEORIA
      { day: "Wednesday", startHour: 1, duration: 2, room: "A-203" },
      // Jueves 10:40–12:20 PRACTICA
      { day: "Thursday", startHour: 5, duration: 2, room: "A-203" },
    ],
  },

  // ------------------------------------------------------------
  // PROGRAMACIÓN COMPETITIVA (1703236)
  // Grupo A — teoría/práctica (aula)
  {
    course: "1703236",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-005",
    capacity: 30,
    schedule: [
      // Jueves 07:00–08:40 PRACTICA
      { day: "Thursday", startHour: 1, duration: 2, room: "A-203" },
      // Martes 08:50–09:40 PRACTICA
      { day: "Tuesday", startHour: 3, duration: 1, room: "A-203" },
      // Martes 11:30–12:20 PRACTICA
      { day: "Tuesday", startHour: 6, duration: 1, room: "A-203" },
      // Viernes 10:40–12:20 (aparece “PROGRAMACION COMPETITIVA” sin etiqueta; lo contamos como teoría)
      { day: "Friday", startHour: 5, duration: 2, room: "A-203" },
    ],
  },

  // ------------------------------------------------------------
  // ESTRUCTURAS DE DATOS AVANZADOS (1703238)
  // Grupo A — teoría/práctica (aula)
  {
    course: "1703238",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-006",
    capacity: 30,
    schedule: [
      // Lunes 10:40–12:20 TEORIA
      { day: "Monday", startHour: 5, duration: 2, room: "A-203" },
      // Jueves 08:50–10:30 PRACTICA
      { day: "Thursday", startHour: 3, duration: 2, room: "A-203" },
    ],
  },
  // Grupo A — lab (LAB01 A)
  {
    course: "1703238",
    semester: "2025-B",
    type: "lab",
    group: "A",
    teacher: "T-006",
    capacity: 24,
    schedule: [
      // Miércoles 08:50–10:30 LAB01 (LAB A)
      { day: "Wednesday", startHour: 3, duration: 2, room: "L-1" },
    ],
  },

  // Grupo B — lab (LAB02 B) (celda compartida con ADA teoría)
  {
    course: "1703238",
    semester: "2025-B",
    type: "lab",
    group: "B",
    teacher: "T-006",
    capacity: 24,
    schedule: [
      // Lunes 15:50–17:30 LAB02 (LAB B) (compartido con ADA teoría)
      { day: "Monday", startHour: 11, duration: 2, room: "L-2" },
    ],
  },

  // ------------------------------------------------------------
  // SISTEMAS OPERATIVOS (1703239)
  // Grupo A — teoría/práctica (aula)
  {
    course: "1703239",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-000",
    capacity: 30,
    schedule: [
      // Lunes 12:20–14:00 TEORIA
      { day: "Monday", startHour: 7, duration: 2, room: "A-203" },
      // Miércoles 10:40–12:20 PRACTICA (A)
      { day: "Wednesday", startHour: 5, duration: 2, room: "A-203" },
    ],
  },
  // Grupo A — lab (LAB01 A)
  {
    course: "1703239",
    semester: "2025-B",
    type: "lab",
    group: "A",
    teacher: "T-000",
    capacity: 20,
    schedule: [
      // Martes 12:20–14:00 LAB01 (LAB A)
      { day: "Tuesday", startHour: 7, duration: 2, room: "L-1" },
    ],
  },

  // Grupo B — teoría/práctica (aula)
  {
    course: "1703239",
    semester: "2025-B",
    type: "theory",
    group: "B",
    teacher: "T-000",
    capacity: 30,
    schedule: [
      // Miércoles 15:50–17:30 TEORIA (B)
      { day: "Wednesday", startHour: 11, duration: 2, room: "A-203" },
      // Viernes 15:50–17:30 PRACTICA (B)
      { day: "Friday", startHour: 11, duration: 2, room: "A-203" },
    ],
  },
  // Grupo B — lab (LAB01 B)
  {
    course: "1703239",
    semester: "2025-B",
    type: "lab",
    group: "B",
    teacher: "T-000",
    capacity: 20,
    schedule: [
      // Martes 14:00–15:40 LAB01 (LAB B)
      { day: "Tuesday", startHour: 9, duration: 2, room: "L-1" },
    ],
  },

  // ------------------------------------------------------------
  // INGENIERÍA DE SOFTWARE II (1703237)
  // Grupo A — teoría/práctica (aula)
  {
    course: "1703237",
    semester: "2025-B",
    type: "theory",
    group: "A",
    teacher: "T-007",
    capacity: 32,
    schedule: [
      // Miércoles 12:20–14:00 TEORIA A
      { day: "Wednesday", startHour: 7, duration: 2, room: "A-203" },
      // Jueves 12:20–14:00 PRACTICA A
      { day: "Thursday", startHour: 7, duration: 2, room: "A-203" },
    ],
  },
  // Grupo A — lab (LAB04 A)
  {
    course: "1703237",
    semester: "2025-B",
    type: "lab",
    group: "A",
    teacher: "T-007",
    capacity: 20,
    schedule: [
      // Lunes 08:50–10:30 LAB04 (LAB A)
      { day: "Monday", startHour: 3, duration: 2, room: "L-3" },
    ],
  },

  // Grupo B — teoría/práctica (aula)
  {
    course: "1703237",
    semester: "2025-B",
    type: "theory",
    group: "B",
    teacher: "T-008",
    capacity: 32,
    schedule: [
      // Miércoles 14:00–15:40 TEORIA B
      { day: "Wednesday", startHour: 9, duration: 2, room: "A-203" },
      // Jueves 14:00–15:40 PRACTICA B
      { day: "Thursday", startHour: 9, duration: 2, room: "A-203" },
    ],
  },
  // Grupo B — lab (LAB04 B)
  {
    course: "1703237",
    semester: "2025-B",
    type: "lab",
    group: "B",
    teacher: "T-008",
    capacity: 20,
    schedule: [
      // Lunes 14:00–15:40 LAB04 (LAB B)
      { day: "Monday", startHour: 9, duration: 2, room: "L-3" },
    ],
  },
];

