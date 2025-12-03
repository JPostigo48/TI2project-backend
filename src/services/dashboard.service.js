import Enrollment from '../models/enrollment.model.js';

export const getStudentDashboardData = async (studentId) => {
    const enrollments = await Enrollment.find({ student: studentId })
        .populate({
            path: 'section',
            populate: { path: 'course' } // Traemos el nombre del curso
        });

    if (!enrollments.length) {
        return {
            stats: { average: "0.0", coursesCount: 0 },
            nextClass: null
        };
    }

    const stats = calculateStats(enrollments);

    const nextClass = findNextClass(enrollments);

    return { stats, nextClass };
};

// --- Funciones Helpers ---

const calculateStats = (enrollments) => {
    let totalGrades = 0;
    let countGrades = 0;

    enrollments.forEach(enr => {
        // Asumiendo que finalGrade existe y es número
        if (enr.finalGrade !== undefined && enr.finalGrade !== null) {
            totalGrades += enr.finalGrade;
            countGrades++;
        }
    });

    return {
        average: countGrades > 0 ? (totalGrades / countGrades).toFixed(1) : "N/A",
        coursesCount: enrollments.length
    };
};

const findNextClass = (enrollments) => {
    const daysMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    let nextClass = null;
    let minDiff = Infinity;

    enrollments.forEach(enr => {
        // Validamos que exista sección y horario
        if (!enr.section || !enr.section.schedule) return;

        enr.section.schedule.forEach(slot => {
            const slotDayIndex = daysMap[slot.day];
            
            // Lógica de "cuánto falta para la clase"
            let dayDiff = slotDayIndex - currentDay;
            // Si es hoy pero ya pasó la hora, o si es un día anterior, sumamos 7 días (semana siguiente)
            if (dayDiff < 0 || (dayDiff === 0 && slot.startHour <= currentHour)) {
                dayDiff += 7; 
            }

            // Puntaje de tiempo: (Días de espera * 24) + Horas de espera hoy
            const timeScore = (dayDiff * 24) + (slot.startHour - currentHour);

            if (timeScore < minDiff) {
                minDiff = timeScore;
                nextClass = {
                    courseName: enr.section.course ? enr.section.course.name : "Curso Desconocido",
                    type: enr.section.type === 'theory' ? 'Teoría' : 'Laboratorio',
                    room: slot.room ? slot.room.code : 'Virtual', 
                    day: translateDay(slot.day), // Un detalle bonito para el front (Español)
                    time: `${slot.startHour}:00 - ${slot.startHour + slot.duration}:00`
                };
            }
        });
    });

    return nextClass;
};

const translateDay = (englishDay) => {
    const map = {
        'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miércoles',
        'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sábado', 'Sunday': 'Domingo'
    };
    return map[englishDay] || englishDay;
};