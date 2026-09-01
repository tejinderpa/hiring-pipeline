import { Router } from 'express';

import { authenticate, requireRole } from './auth.js';
import { prisma } from './prisma.js';

const router = Router();

router.use(authenticate, requireRole('INTERVIEWER'));

router.get('/applications', async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where: {
        interviewers: {
          some: {
            interviewerId: req.auth.userId,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
      include: {
        jobOpening: {
          select: {
            id: true,
            title: true,
            department: true,
            status: true,
          },
        },
        interviewers: {
          where: {
            interviewerId: req.auth.userId,
          },
          select: {
            assignedAt: true,
          },
        },
      },
    });

    return res.json({ applications });
  } catch (error) {
    return next(error);
  }
});

export default router;
