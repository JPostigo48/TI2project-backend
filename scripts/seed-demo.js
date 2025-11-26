import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../src/models/user.model.js'; 
import Course from '../src/models/course.model.js';
import Section from '../src/models/section.model.js'; 
import Room from '../src/models/room.model.js';
import Semester from '../src/models/semester.model.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log('🧹 Limpiando colecciones...');
        await mongoose.connection.dropDatabase();

        // ----------------------------------------------------
        // 1. SEMESTRE
        // ----------------------------------------------------
        const semestre = await Semester.create({
            name: "2025-B",
            startDate: new Date("2025-08-15"), 
            endDate: new Date("2025-12-15"),
            isActive: true
        });
        console.log('✅ Semestre creado');

        // ----------------------------------------------------
        // 2. AULAS 
        // ----------------------------------------------------
        const aula201 = await Room.create({ code: "A-201", name: "Aula 201", capacity: 30, location: "Piso 2" });
        const aula203 = await Room.create({ code: "A-203", name: "Aula 203", capacity: 32, location: "Piso 2" });
        const lab1 = await Room.create({ code: "L-1", name: "Laboratorio 1", capacity: 20, location: "Piso 1", type: "lab" });
        const lab2 = await Room.create({ code: "L-2", name: "Laboratorio 2", capacity: 24, location: "Piso 1", type: "lab" });
        console.log('✅ Aulas creadas');

        // ----------------------------------------------------
        // 3. USUARIOS 
        // ----------------------------------------------------
        const salt = await bcrypt.genSalt(10);
        // const passwordHash = await bcrypt.hash('pass_test_123', salt); 
        const passwordHash = 'pass_test_123'; 

        const admin = await User.create({
            name: "Administrador Principal", email: "admin@unsa.edu.pe", password: passwordHash, role: "admin", active: true
        });

        const docente = await User.create({
            name: "Docente de Prueba", code: "D-001", email: "docente_test@unsa.edu.pe", password: passwordHash, role: "teacher", active: true
        });

        const docente2 = await User.create({
            name: "Docente de Prueba 2", code: "D-002", email: "docente_test_2@unsa.edu.pe", password: passwordHash, role: "teacher", active: true
        });

        const alumno = await User.create({
            name: "Alumno de Prueba", code: "20251001", email: "alumno_test@unsa.edu.pe", password: passwordHash, role: "student", active: true
        });
        console.log('✅ Usuarios creados (Pass: pass_test_123)');

        // ----------------------------------------------------
        // 4. CURSOS (Catálogo)
        // ----------------------------------------------------
        const cursoSO = await Course.create({
            name: "Sistemas Operativos", code: "1703239", credits: 4, year: 3, semester: 6,
            hoursPerWeek: 6, theoryHours: 4, labHours: 2
        });
        
        const cursoTI = await Course.create({
            name: "Trabajo Interdisciplinar II", code: "1703240", credits: 3, year: 3, semester: 6,
            hoursPerWeek: 2, theoryHours: 2, labHours: 0
        });
        
        const cursoMAC = await Course.create({
            name: "Matemática Aplicada a la Computación", code: "1703241", credits: 4, year: 3, semester: 6,
            hoursPerWeek: 6, theoryHours: 4, labHours: 2
        });
        console.log('✅ Cursos base creados');

        // ----------------------------------------------------
        // 5. SECCIONES (Instancias del Semestre)
        // ----------------------------------------------------
        
        // --- Teoría ---
        const seccionTeoriaSO = await Section.create({
            course: cursoSO._id,
            semester: semestre._id,
            type: "theory",
            group: "A",
            teacher: docente._id,
            capacity: 30,
            enrolledCount: 1, 
            schedule: [
                { day: "Monday", startHour: 7, duration: 2, room: aula203._id }, 
                { day: "Wednesday", startHour: 5, duration: 2, room: aula203._id } 
            ]
        });
        const seccionTeoriaSOB = await Section.create({
            course: cursoSO._id,
            semester: semestre._id,
            type: "theory",
            group: "B",
            teacher: docente2._id,
            capacity: 30,
            enrolledCount: 1, 
            schedule: [
                { day: "Wednesday", startHour: 11, duration: 2, room: aula203._id },
                { day: "Friday", startHour: 11, duration: 2, room: aula203._id }
            ]
        });

        const seccionTeoriaTIA = await Section.create({
            course: cursoTI._id,
            semester: semestre._id,
            type: "theory",
            group: "A",
            teacher: docente._id,
            capacity: 28,
            enrolledCount: 1, 
            schedule: [
                { day: "Wednesday", startHour: 1, duration: 2, room: aula203._id }
            ]
        });

        const seccionTeoriaTIB = await Section.create({
            course: cursoTI._id,
            semester: semestre._id,
            type: "theory",
            group: "B",
            teacher: docente._id,
            capacity: 28,
            enrolledCount: 1, 
            schedule: [
                { day: "Thursday", startHour: 3, duration: 2, room: aula203._id }
            ]
        });

        const seccionTeoriaMAC = await Section.create({
            course: cursoMAC._id,
            semester: semestre._id,
            type: "theory",
            group: "A",
            teacher: docente._id,
            capacity: 32,
            enrolledCount: 1, 
            schedule: [
                { day: "Monday", startHour: 1, duration: 2, room: aula203._id },
                { day: "Tuesday", startHour: 4, duration: 2, room: aula203._id }
            ]
        });

        // --- Laboratorios ---
        
        const seccionSOLabA = await Section.create({
            course: cursoSO._id,
            semester: semestre._id,
            type: "lab",
            group: "A", 
            teacher: docente2._id,
            capacity: 20,
            enrolledCount: 0,
            schedule: [
                { day: "Tuesday", startHour: 7, duration: 2, room: lab1._id } // Martes 8-10
            ]
        });

        const seccionSOLabB = await Section.create({
            course: cursoSO._id,
            semester: semestre._id,
            type: "lab",
            group: "B", 
            teacher: docente2._id,
            capacity: 20,
            enrolledCount: 0,
            schedule: [
                { day: "Tuesday", startHour: 9, duration: 2, room: lab1._id } // Martes 10-12
            ]
        });

        const seccionMACLabA = await Section.create({
            course: cursoMAC._id,
            semester: semestre._id,
            type: "lab",
            group: "A", 
            teacher: docente._id,
            capacity: 24,
            enrolledCount: 0,
            schedule: [
                { day: "Friday", startHour: 3, duration: 2, room: lab2._id }
            ]
        });

        const seccionMACLabB = await Section.create({
            course: cursoMAC._id,
            semester: semestre._id,
            type: "lab",
            group: "B", 
            teacher: docente._id,
            capacity: 24,
            enrolledCount: 0,
            schedule: [
                { day: "Tuesday", startHour: 11, duration: 2, room: lab2._id }
            ]
        });

        console.log('✅ Secciones creadas');

        // ----------------------------------------------------
        // 6. MATRÍCULA (Intento dinámico)
        // ----------------------------------------------------
        try {
            const enrollmentModule = await import('../src/models/enrollment.model.js');
            const Enrollment = enrollmentModule.default;
            
            await Enrollment.create({
                student: alumno._id,
                section: seccionTeoriaSOB._id, 
                semester: semestre._id,
                status: 'enrolled',
                labPreferences: []
            });
            
            await Enrollment.create({
                student: alumno._id,
                section: seccionTeoriaTIA._id, 
                semester: semestre._id,
                status: 'enrolled',
                labPreferences: []
            });
            
            await Enrollment.create({
                student: alumno._id,
                section: seccionTeoriaMAC._id, 
                semester: semestre._id,
                status: 'enrolled',
                labPreferences: []
            });
            console.log('✅ Alumno matriculado');
        } catch (e) {
            console.log('⚠️ Modelo Enrollment no encontrado o error al crear. Se omitió este paso.'+e);
        }

        console.log('🏁 SEED COMPLETADO. Base de datos lista para la demo.');
        process.exit();

    } catch (error) {
        console.error('❌ Error fatal en el seed:', error);
        process.exit(1);
    }
};

seedDatabase();