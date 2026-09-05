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
        feedback: {
          where: {
            interviewerId: req.auth.userId,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        // Include the most recent stage-change event to surface who last managed this application.
        // The ApplicationInterviewer table does not store who assigned the interviewer, so the
        // STAGE_CHANGED actor is the closest available proxy for "responsible recruiter."
        events: {
          where: {
            type: { in: ['STAGE_CHANGED', 'APPLICATION_CREATED'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            type: true,
            createdAt: true,
            actor: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Flatten: attach the most recent recruiter actor as `assignedByRecruiter` on each application
    const enriched = applications.map((app) => {
      const { events, ...rest } = app;
      const recruiterEvent = events?.[0] ?? null;
      return {
        ...rest,
        assignedByRecruiter: recruiterEvent?.actor ?? null,
      };
    });

    return res.json({ applications: enriched });
  } catch (error) {
    return next(error);
  }
});

export default router;
