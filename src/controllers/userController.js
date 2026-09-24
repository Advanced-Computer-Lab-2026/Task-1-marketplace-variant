import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const createSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(60),
  email: Joi.string().email()
});

function publicUser(u) {
  return { id: u._id.toString(), name: u.name, email: u.email, createdAt: u.createdAt };
}

// GET /api/users
export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json({ users: users.map(publicUser) });
  } catch (err) { next(err); }
}

// GET /api/users/:id
export async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
}

// POST /api/users
export async function createUser(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const existing = await User.findOne({ email: value.email });
    if (existing) return res.status(409).json({ message: 'Email already used' });

    const password = await bcrypt.hash(value.password, 10);
    const user = await User.create({ name: value.name, email: value.email, password });
    res.status(201).json({ user: publicUser(user) });
  } catch (err) { next(err); }
}

// PATCH /api/users/:id
export async function updateUser(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const doc = await User.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: 'User not found' });
    res.json({ user: publicUser(doc) });
  } catch (err) { next(err); }
}

// DELETE /api/users/:id
export async function deleteUser(req, res, next) {
  try {
    const doc = await User.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'User not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
