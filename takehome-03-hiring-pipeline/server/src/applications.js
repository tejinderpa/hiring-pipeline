import { Router } from 'express';

import {
  buildBulkApplicationActionResponse,
  buildBulkApplicationIds,
  bulkUpdateApplicationsWithEvents,
} from './applicationBulkActions.js';
import {
  buildApplicationAdvanceData,
  buildFeedbackAddedEventData,
  buildApplicationReinstateData,
  buildApplicationRejectData,
} from './applicationPipeline.js';
import {
  buildApplicationListQuery,
  buildApplicationListResponse,
} from './applicationListQuery.js';
import { authenticate, requireRole } from './auth.js';
import { prisma } from './prisma.js';

const router = Router();
const applicationEditableFields = new Set(['candidateName', 'candidateEmail', 'source', 'notes']);
const applicationInterviewerCreateFields = new Set(['interviewerId']);
const feedbackCreateFields = new Set(['content']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const applicationTransactionOptions = {
  maxWait: 10000,
  timeout: 20000,
};

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getRequestBody(req) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return null;
  }

  return req.body;
}

function hasUnknownFields(body, allowedFields) {
  return Object.keys(body).some((field) => !allowedFields.has(field));
}

function buildApplicationResponse(application) {
  return { application };
}

function buildApplicationInterviewerResponse(applicationInterviewer) {
  return { applicationInterviewer };
}

function buildApplicationInterviewerData(body) {
  if (hasUnknownFields(body, applicationInterviewerCreateFields)) {
    return { error: 'Only interviewerId is allowed' };
  }

  const interviewerId = trimString(body.interviewerId);

  if (!interviewerId) {
    return { error: 'Interviewer id is required' };
  }

  return { interviewerId };
}

function buildFeedbackCreateData(body) {
  if (hasUnknownFields(body, feedbackCreateFields)) {
    return { error: 'Only content is allowed' };
  }

  const content = trimString(body.content);

  if (!content) {
    return { error: 'Content is required' };
  }

  return { content };
}

function buildApplicationPatchData(body) {
  if (Object.keys(body).length === 0) {
    return { error: 'At least one field is required' };
  }

  if (Object.hasOwn(body, 'stage')) {
    return { error: 'Application stage cannot be changed directly. Use the pipeline transition endpoints.' };
  }

  if (hasUnknownFields(body, applicationEditableFields)) {
    return { error: 'Only candidateName, candidateEmail, source, and notes can be updated' };
  }

  const data = {};

  if (Object.hasOwn(body, 'candidateName')) {
    const candidateName = trimString(body.candidateName);

    if (!candidateName) {
      return { error: 'Candidate name is required' };
    }

    data.candidateName = candidateName;
  }

  if (Object.hasOwn(body, 'candidateEmail')) {
    const candidateEmail = trimString(body.candidateEmail).toLowerCase();

    if (!candidateEmail) {
      return { error: 'Candidate email is required' };
    }

    if (!emailPattern.test(candidateEmail)) {
      return { error: 'Candidate email must be a valid email address' };
    }

    data.candidateEmail = candidateEmail;
  }

  if (Object.hasOwn(body, 'source')) {
    const source = trimString(body.source);

    if (!source) {
      return { error: 'Source is required' };
    }

    data.source = source;
  }

  if (Object.hasOwn(body, 'notes')) {
    if (body.notes !== null && typeof body.notes !== 'string') {
      return { error: 'Notes must be a string' };
    }

    data.notes = trimString(body.notes) || null;
  }

  return { data };
}

async function findApplication(id) {
  return prisma.application.findUnique({
    where: { id },
  });
}

async function updateApplicationWithEvent(applicationId, actorId, buildTransition) {
  return prisma.$transaction(
    async (tx) => {
      const existingApplication = await tx.application.findUnique({
        where: { id: applicationId },
      });

      if (!existingApplication) {
        return { status: 404, error: 'Application not found' };
      }

      const transition = buildTransition(existingApplication, actorId);

      if (transition.error) {
        return { status: 409, error: transition.error };
      }

      const from = existingApplication.stage;
      const to = transition.eventData.newStage;
      const application = await tx.application.update({
        where: { id: applicationId },
        data: transition.applicationData,
      });

      await tx.applicationEvent.create({
        data: transition.eventData,
      });

      return { application, from, to };
    },
    applicationTransactionOptions,
  );
}

async function sendTransitionResponse(req, res, next, buildTransition) {
  try {
    const result = await updateApplicationWithEvent(
      req.params.id,
      req.auth.userId,
      buildTransition,
    );

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json(buildApplicationResponse(result.application));
  } catch (error) {
    return next(error);
  }
}

router.post('/:id/feedback', authenticate, requireRole('INTERVIEWER'), async (req, res, next) => {
  try {
    const body = getRequestBody(req);

    if (!body) {
      return res.status(400).json({ error: 'Request body must be an object' });
    }

    const result = buildFeedbackCreateData(body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const feedbackResult = await prisma.$transaction(
      async (tx) => {
        const existingApplication = await tx.application.findUnique({
          where: { id: req.params.id },
        });

        if (!existingApplication) {
          return { status: 404, error: 'Application not found' };
        }

        const assignment = await tx.applicationInterviewer.findUnique({
          where: {
            applicationId_interviewerId: {
              applicationId: req.params.id,
              interviewerId: req.auth.userId,
            },
          },
        });

        if (!assignment) {
          return { status: 403, error: 'Forbidden' };
        }

        const feedback = await tx.feedback.create({
          data: {
            applicationId: req.params.id,
            interviewerId: req.auth.userId,
            content: result.content,
          },
        });

        await tx.applicationEvent.create({
          data: buildFeedbackAddedEventData(req.params.id, req.auth.userId, feedback),
        });

        return { feedback };
      },
      applicationTransactionOptions,
    );

    if (feedbackResult.error) {
      return res.status(feedbackResult.status).json({ error: feedbackResult.error });
    }

    return res.status(201).json({ feedback: feedbackResult.feedback });
  } catch (error) {
    return next(error);
  }
});

router.use(authenticate, requireRole('RECRUITER'));

router.post('/bulk/advance', async (req, res, next) => {
  try {
    const body = getRequestBody(req);

    if (!body) {
      return res.status(400).json({ error: 'Request body must be an object' });
    }

    const result = buildBulkApplicationIds(body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const results = await bulkUpdateApplicationsWithEvents({
      prisma,
      applicationIds: result.applicationIds,
      actorId: req.auth.userId,
      buildTransition: buildApplicationAdvanceData,
      updateApplicationWithEvent,
    });

    return res.json(buildBulkApplicationActionResponse(results));
  } catch (error) {
    return next(error);
  }
});

router.post('/bulk/reject', async (req, res, next) => {
  try {
    const body = getRequestBody(req);

    if (!body) {
      return res.status(400).json({ error: 'Request body must be an object' });
    }

    const result = buildBulkApplicationIds(body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const results = await bulkUpdateApplicationsWithEvents({
      prisma,
      applicationIds: result.applicationIds,
      actorId: req.auth.userId,
      buildTransition: buildApplicationRejectData,
      updateApplicationWithEvent,
    });

    return res.json(buildBulkApplicationActionResponse(results));
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const query = buildApplicationListQuery(req.query);

    if (query.error) {
      return res.status(400).json({ error: query.error });
    }

    const select = {
      id: true,
      candidateName: true,
      candidateEmail: true,
      source: true,
      stage: true,
      appliedAt: true,
      updatedAt: true,
      jobOpeningId: true,
      jobOpening: {
        select: {
          id: true,
          title: true,
        },
      },
    };

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where: query.where,
        orderBy: query.orderBy,
        skip: query.skip,
        take: query.take,
        select,
      }),
      prisma.application.count({
        where: query.where,
      }),
    ]);

    return res.json(buildApplicationListResponse(
      applications,
      query.page,
      query.limit,
      total,
    ));
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/advance', async (req, res, next) => {
  return sendTransitionResponse(req, res, next, buildApplicationAdvanceData);
});

router.post('/:id/reject', async (req, res, next) => {
  return sendTransitionResponse(req, res, next, buildApplicationRejectData);
});

router.post('/:id/reinstate', async (req, res, next) => {
  return sendTransitionResponse(req, res, next, buildApplicationReinstateData);
});

router.get('/:id/history', async (req, res, next) => {
  try {
    const existingApplication = await findApplication(req.params.id);

    if (!existingApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const events = await prisma.applicationEvent.findMany({
      where: { applicationId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.json({ events });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/interviewers', async (req, res, next) => {
  try {
    const body = getRequestBody(req);

    if (!body) {
      return res.status(400).json({ error: 'Request body must be an object' });
    }

    const result = buildApplicationInterviewerData(body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const existingApplication = await findApplication(req.params.id);

    if (!existingApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const interviewer = await prisma.user.findUnique({
      where: { id: result.interviewerId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!interviewer) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (interviewer.role !== 'INTERVIEWER') {
      return res.status(400).json({ error: 'User must have INTERVIEWER role' });
    }

    const existingAssignment = await prisma.applicationInterviewer.findUnique({
      where: {
        applicationId_interviewerId: {
          applicationId: req.params.id,
          interviewerId: result.interviewerId,
        },
      },
    });

    if (existingAssignment) {
      return res.status(409).json({ error: 'Interviewer is already assigned to this application' });
    }

    const applicationInterviewer = await prisma.applicationInterviewer.create({
      data: {
        applicationId: req.params.id,
        interviewerId: result.interviewerId,
      },
      include: {
        interviewer: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(201).json(buildApplicationInterviewerResponse(applicationInterviewer));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Interviewer is already assigned to this application' });
    }

    return next(error);
  }
});

router.delete('/:id/interviewers/:userId', async (req, res, next) => {
  try {
    const existingApplication = await findApplication(req.params.id);

    if (!existingApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const existingAssignment = await prisma.applicationInterviewer.findUnique({
      where: {
        applicationId_interviewerId: {
          applicationId: req.params.id,
          interviewerId: req.params.userId,
        },
      },
      include: {
        interviewer: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!existingAssignment) {
      return res.status(404).json({ error: 'Application interviewer assignment not found' });
    }

    const applicationInterviewer = await prisma.applicationInterviewer.delete({
      where: {
        applicationId_interviewerId: {
          applicationId: req.params.id,
          interviewerId: req.params.userId,
        },
      },
      include: {
        interviewer: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.json(buildApplicationInterviewerResponse(applicationInterviewer));
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const body = getRequestBody(req);

    if (!body) {
      return res.status(400).json({ error: 'Request body must be an object' });
    }

    const result = buildApplicationPatchData(body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const existingApplication = await findApplication(req.params.id);

    if (!existingApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: result.data,
    });

    return res.json(buildApplicationResponse(application));
  } catch (error) {
    return next(error);
  }
});

export default router;
