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

export default router;
