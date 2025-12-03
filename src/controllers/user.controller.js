import User from '../models/user.model.js';

/**
 * @desc Crea un nuevo usuario de cualquier rol.
 * @route POST /api/admin/users
 * @access Privado (solo admin)
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, code } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    const user = await User.create({ name, email, password, role, code, active: true });
    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

/**
 * @desc Restablece la contraseña de un usuario existente.
 * @route PATCH /api/admin/users/:id/reset-password
 * @access Privado (solo admin)
 */
export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'Debe proporcionar una nueva contraseña' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashed },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Contraseña restablecida' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (admin)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (admin or self)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (admin or user itself)
export const updateUser = async (req, res) => {
  try {
    const updates = req.body;
    // Prevent password update here; use separate route for change password
    delete updates.password;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Disable user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (admin)
export const disableUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User disabled', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};