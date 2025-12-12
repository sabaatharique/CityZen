const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const env = require('../config/env');

async function signup(req, res, next) {
  try {
    const { email, password, role, fullName } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role, fullName });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpire });
    return res.json({ success: true, message: 'Account created successfully', data: { user, token } });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ where: { email, role } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpire });
    return res.json({ success: true, data: { user, token } });
  } catch (e) { next(e); }
}

async function verify(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const user = await User.findByPk(userId, { attributes: { exclude: ['passwordHash'] } });
    if (!user) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, user });
  } catch (e) { next(e); }
}

module.exports = { signup, login, verify };
