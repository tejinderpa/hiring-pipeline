import { Router } from 'express';

import {
  buildApplicationAdvanceData,
  buildApplicationReinstateData,
  buildApplicationRejectData,
} from './applicationPipeline.js';
import { authenticate, requireRole } from './auth.js';
import { prisma } from './prisma.js';

const router = Router();
const applicationEditableFields = new Set(['candidateName', 'candidateEmail', 'source', 'notes']);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const applicationTransactionOptions = {
  maxWait: 10000,
  timeout: 20000,
};

router.use(authenticate, requireRole('RECRUITER'));

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

      const application = await tx.application.update({
        where: { id: applicationId },
        data: transition.applicationData,
      });

      await tx.applicationEvent.create({
        data: transition.eventData,
      });

      return { application };
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
