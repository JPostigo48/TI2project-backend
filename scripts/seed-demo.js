import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../src/models/user.model.js'; 
import Course from '../src/models/course.model.js';
import Section from '../src/models/section.model.js'; 
import Room from '../src/models/room.model.js';
import Semester from '../src/models/semester.model.js';

// Cargar variables de entorno
dotenv.config();

const seedDatabase = async () => {
    try {
        console.log('🔌 Conectando a MongoDB...');
        // Asegúrate de que tu .env tenga MONGO_URI
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log('🧹 Limpiando colecciones...');
        await User.deleteMany({});
        await Course.deleteMany({});
        await Section.deleteMany({});
        await Room.deleteMany({});
        await Semester.deleteMany({});
        
        // Intento de limpiar Enrollment de forma dinámica si existe
        try {
             // Importación dinámica para evitar error si el archivo no existe aún
            const enrollmentModule = await import('../src/models/enrollment.model.js');
            const Enrollment = enrollmentModule.default;
            await Enrollment.deleteMany({});
        } catch (e) {
            // Si falla, asumimos que no existe el modelo y seguimos
        }

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
        // 2. AULAS (Tus datos)
        // ----------------------------------------------------
        const aula201 = await Room.create({ code: "A-201", name: "Aula 201", capacity: 30, location: "Piso 2" });
        const aula203 = await Room.create({ code: "A-203", name: "Aula 203", capacity: 32, location: "Piso 2" });
        const lab1 = await Room.create({ code: "L-1", name: "Laboratorio 1", capacity: 20, location: "Piso 1", type: "lab" });
        console.log('✅ Aulas creadas');

        // ----------------------------------------------------
        // 3. USUARIOS (Con password hasheado)
        // ----------------------------------------------------
        const salt = await bcrypt.genSalt(10);
        // const passwordHash = await bcrypt.hash('pass_test_123', salt); 
        const passwordHash = 'pass_test_123'; 

        const admin = await User.create({
            name: "Administrador Principal", email: "admin@unsa.edu.pe", password: passwordHash, role: "admin", active: true
        });

        // NOTA: Verifica que tu modelo User acepte 'code' para docentes si lo usas en el front
        const docente = await User.create({
            name: "Docente de Prueba", code: "D-001", email: "docente_test@unsa.edu.pe", password: passwordHash, role: "teacher", active: true
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
            hoursPerWeek: 4, theoryHours: 4, labHours: 0
        });
        console.log('✅ Cursos base creados');

        // ----------------------------------------------------
        // 5. SECCIONES (Instancias del Semestre)
        // ----------------------------------------------------
        
        // --- A. Teoría de SO (Donde el alumno YA está matriculado) ---
        const seccionTeoriaSO = await Section.create({
            course: cursoSO._id,
            semester: semestre._id,
            type: "theory",
            group: "A",
            teacher: docente._id,
            capacity: 30,
            enrolledCount: 1, 
            schedule: [
                { day: "Monday", startHour: 8, duration: 2, room: aula203._id }, // Lunes 8-10
                { day: "Wednesday", startHour: 8, duration: 2, room: aula203._id } // Miercoles 8-10
            ]
        });

        // --- B. Laboratorios de SO (Para que el alumno elija) ---
        
        const seccionLabA = await Section.create({
            course: cursoSO._id,
            semester: semestre._id,
            type: "lab",
            group: "A", 
            teacher: docente._id,
            capacity: 20,
            enrolledCount: 0,
            schedule: [
                { day: "Tuesday", startHour: 8, duration: 2, room: lab1._id } // Martes 8-10
            ]
        });

        const seccionLabB = await Section.create({
            course: cursoSO._id,
            semester: semestre._id,
            type: "lab",
            group: "B", 
            teacher: docente._id,
            capacity: 20,
            enrolledCount: 0,
            schedule: [
                { day: "Tuesday", startHour: 10, duration: 2, room: lab1._id } // Martes 10-12
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
                section: seccionTeoriaSO._id, 
                semester: semestre._id,
                status: 'enrolled',
                labPreferences: []
            });
            console.log('✅ Alumno matriculado en Teoría SO (Enrollment creado)');
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