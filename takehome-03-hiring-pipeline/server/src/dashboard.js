import { Router } from 'express';

import { authenticate, requireRole } from './auth.js';
import {
  activeApplicationWhere,
  buildDashboardResponse,
  getDashboardDateRanges,
  openPositionWhere,
} from './dashboardMetrics.js';
import { prisma } from './prisma.js';

const router = Router();

router.use(authenticate, requireRole('RECRUITER'));

router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const {
      weekStart,
      weekEnd,
      monthStart,
      monthEnd,
      applicationWeekStart,
      applicationWeekEnd,
    } = getDashboardDateRanges(now);

    const [
      openPositions,
      activeApplications,
      interviewsThisWeek,
      hiresThisMonth,
      stageRows,
      jobRows,
      applicationRows,
    ] = await Promise.all([
      prisma.jobOpening.count({ where: openPositionWhere }),
      prisma.application.count({ where: activeApplicationWhere }),
      prisma.application.count({
        where: {
          interviewScheduledAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      }),
      prisma.application.count({
        where: {
          stage: 'HIRED',
          stageEnteredAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      }),
      prisma.application.groupBy({
        by: ['stage'],
        _count: {
          _all: true,
        },
      }),
      prisma.jobOpening.findMany({
        orderBy: [
          { title: 'asc' },
          { id: 'asc' },
        ],
        select: {
          id: true,
          title: true,
          _count: {
            select: {
              applications: true,
            },
          },
        },
      }),
      prisma.application.findMany({
        where: {
          appliedAt: {
            gte: applicationWeekStart,
            lt: applicationWeekEnd,
          },
        },
        select: {
          appliedAt: true,
        },
      }),
    ]);

    return res.json(buildDashboardResponse({
      openPositions,
      activeApplications,
      interviewsThisWeek,
      hiresThisMonth,
      stageRows,
      jobRows,
      applicationRows,
      now,
    }));
  } catch (error) {
    return next(error);
  }
});

export default router;
