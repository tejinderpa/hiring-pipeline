import { Router } from 'express';

import { authenticate, requireRole } from './auth.js';
import { prisma } from './prisma.js';
import {
  buildCurrentStageDismissalFilter,
  buildStalledAlertResponse,
  buildStalledAlertWhere,
  filterUndismissedStalledApplications,
  isStalledApplication,
} from './stalledAlerts.js';

const router = Router();

router.use(authenticate, requireRole('RECRUITER'));

router.get('/stalled', async (req, res, next) => {
  try {
    const now = new Date();
    const applications = await prisma.application.findMany({
      where: buildStalledAlertWhere(now),
      orderBy: [
        { stageEnteredAt: 'asc' },
        { id: 'asc' },
      ],
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        stage: true,
        stageEnteredAt: true,
        jobOpening: {
          select: {
            id: true,
            title: true,
          },
        },
        alertDismissals: {
          select: {
            stage: true,
          },
        },
      },
    });
    const undismissedApplications = filterUndismissedStalledApplications(applications);

    return res.json(buildStalledAlertResponse(undismissedApplications, now));
  } catch (error) {
    return next(error);
  }
});

router.post('/stalled/:applicationId/dismiss', async (req, res, next) => {
  try {
    const now = new Date();
    const application = await prisma.application.findUnique({
      where: { id: req.params.applicationId },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        stage: true,
        stageEnteredAt: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (!isStalledApplication(application, now)) {
      return res.status(409).json({ error: 'Application is not currently stalled' });
    }

    const dismissal = await prisma.alertDismissal.upsert({
      where: {
        applicationId_stage: buildCurrentStageDismissalFilter(application),
      },
      update: {
        dismissedBy: req.auth.userId,
        dismissedAt: now,
      },
      create: {
        applicationId: application.id,
        stage: application.stage,
        dismissedBy: req.auth.userId,
        dismissedAt: now,
      },
    });

    return res.json({
      dismissed: true,
      dismissal,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
