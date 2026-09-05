import { Router } from 'express';

import { authenticate, requireRole } from './auth.js';
import { prisma } from './prisma.js';

const router = Router();
const allowedRoles = new Set(['RECRUITER', 'INTERVIEWER']);

router.use(authenticate, requireRole('RECRUITER'));

router.get('/', async (req, res, next) => {
  try {
    const role = typeof req.query.role === 'string' ? req.query.role : '';

    if (role && !allowedRoles.has(role)) {
      return res.status(400).json({ error: 'Role filter must be RECRUITER or INTERVIEWER' });
    }

    const users = await prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { email: 'asc' },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

export default router;
