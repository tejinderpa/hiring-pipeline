import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Router } from 'express';

import { prisma } from './prisma.js';

const router = Router();
const invalidCredentialsResponse = { error: 'Invalid email or password' };
const authenticationRequiredResponse = { error: 'Authentication required' };

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

function getBearerToken(req) {
  const authorization = req.get('authorization');

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

function authenticate(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json(authenticationRequiredResponse);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (!payload.sub) {
      return res.status(401).json(authenticationRequiredResponse);
    }

    req.auth = {
      userId: payload.sub,
    };

    return next();
  } catch (error) {
    return res.status(401).json(authenticationRequiredResponse);
  }
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

async function getCurrentUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
    });

    if (!user) {
      return res.status(401).json(authenticationRequiredResponse);
    }

    return res.json({ user: buildSafeUser(user) });
  } catch (error) {
    return next(error);
  }
}

router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

export default router;
