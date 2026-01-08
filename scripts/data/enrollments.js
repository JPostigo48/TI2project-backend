// data/enrollments.js

export const SPECIAL_STUDENT_CODE = "20230000";

// El alumno especial se queda EXACTAMENTE con estas secciones:
export const SPECIAL_STUDENT_THEORY_ENROLLMENTS = [
  "T1703239-B",
  "T1703240-A",
  "T1703241-A",
  "T1703237-A",
  "T1703236-A",
  "T1703238-A",
];

// Para alumnos masivos: cuántos cursos (secciones) máximo por alumno
export const MASS_MAX_THEORY_SECTIONS_PER_STUDENT = 3;

// Si se acaban cupos, ¿permitimos matricularlos con menos?
export const MASS_ALLOW_FEWER_IF_NEEDED = true;
