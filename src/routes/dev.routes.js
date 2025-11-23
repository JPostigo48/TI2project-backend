import express from 'express';
import User from '../models/user.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Verificar si ya existen usuarios
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(400).json({
        message: 'Seed ya fue ejecutado. Usuarios existentes en la base de datos.'
      });
    }

    // Crear usuarios iniciales
    const seedUsers = [
      {
        name: 'Administrador Principal',
        email: 'admin@ti2.com',
        password: 'pass_test_123',
        role: 'admin'
      },
      {
        name: 'Secretaría',
        email: 'secretaria@ti2.com',
        password: 'pass_test_123',
        role: 'secretary'
      }
    ];

    const createdUsers = await User.insertMany(seedUsers);

    res.status(201).json({
      message: 'Seed ejecutado correctamente',
      users: createdUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error ejecutando seed' });
  }
});

router.get('/create-admin', async (req, res) => {
  try {
    const exists = await User.findOne({ email: 'admin@unsa.edu.pe' });
    if (exists) {
      return res.status(400).json({ message: 'Admin já existe' });
    }

    const admin = await User.create({
      name: 'Administrador Principal',
      email: 'admin@unsa.edu.pe',
      password: 'pass_test_123',
      role: 'admin',
    });

    res.json({ message: 'Admin creado', admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
