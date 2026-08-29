import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Router } from 'express';

import { prisma } from './prisma.js';

const router = Router();
const invalidCredentialsResponse = { error: 'Invalid email or password' };

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return secret;
}

function buildSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

async function login(req, res, next) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json(invalidCredentialsResponse);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json(invalidCredentialsResponse);
    }

    const token = jwt.sign(
      { sub: user.id },
      getJwtSecret(),
      { expiresIn: '24h' },
    );

    return res.json({
      token,
      user: buildSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

router.post('/login', login);

export default router;
