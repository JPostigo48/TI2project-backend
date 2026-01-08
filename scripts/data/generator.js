export const makeStudents = (count = 300, startNumber = 1) => {
  const students = [];

  for (let i = 0; i < count; i++) {
    const sequence = String(startNumber + i).padStart(4, "0");
    const code = `2023${sequence}`; 

    students.push({
      name: `Alumno ${i + 1}`,
      email: `alumno_${code}@unsa.edu.pe`,
      code,
      role: "student",
      active: true,
    });
  }

  return students;
};

export const makeTeachers = (count = 15, startNumber = 1) => {
  const teachers = [];

  for (let i = 0; i < count; i++) {
    const sequence = String(startNumber + i).padStart(3, "0"); // 001, 002, ...
    const code = `T-${sequence}`;

    teachers.push({
      code,
      name: `Docente ${sequence}`,
      email: `docente_${sequence}@unsa.edu.pe`,
      role: "teacher",
      active: true,
    });
  }

  return teachers;
};
