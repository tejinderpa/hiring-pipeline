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

export async function authenticate(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json(authenticationRequiredResponse);
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (!payload.sub) {
      return res.status(401).json(authenticationRequiredResponse);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return res.status(401).json(authenticationRequiredResponse);
    }

    req.auth = {
      userId: user.id,
      user: buildSafeUser(user),
    };

    return next();
  } catch (error) {
    return res.status(401).json(authenticationRequiredResponse);
  }
}

export function requireRole(requiredRole) {
  return function roleMiddleware(req, res, next) {
    if (!req.auth?.user) {
      return res.status(401).json(authenticationRequiredResponse);
    }

    if (req.auth.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
  };
}

async function login(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

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
  return res.json({ user: req.auth.user });
}

router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

export default router;
