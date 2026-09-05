import { Router } from 'express';

import { buildApplicationCreatedEventData } from './applicationPipeline.js';
import { authenticate, requireRole } from './auth.js';
import { prisma } from './prisma.js';

const router = Router();
const allowedStatuses = new Set(['OPEN', 'CLOSED']);
const editableFields = new Set(['title', 'department', 'description', 'status']);
const createFields = new Set(['title', 'department', 'description', 'status']);
const applicationCreateFields = new Set([
  'candidateName',
  'candidateEmail',
  'source',
  'notes',
  'appliedAt',
  'interviewScheduledAt',
]);
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

function parseOptionalDateTime(value, fieldName) {
  if (value === null || value === '') {
    return { value: null };
  }

  if (typeof value !== 'string') {
    return { error: `${fieldName} must be a date string or null` };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { error: `${fieldName} must be a valid date` };
  }

  return { value: date };
}

function getStartOfCurrentMinute() {
  const currentMinute = new Date();
  currentMinute.setSeconds(0, 0);
  return currentMinute;
}

function parseOptionalFutureDateTime(value, fieldName) {
  const result = parseOptionalDateTime(value, fieldName);

  if (result.error || result.value === null) {
    return result;
  }

  if (result.value < getStartOfCurrentMinute()) {
    return { error: `${fieldName} cannot be in the past` };
  }

  return result;
}

function getStartOfTomorrow() {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}

function parseAppliedAt(value) {
  const rawValue = value || new Date().toISOString().slice(0, 10);

  if (typeof rawValue !== 'string') {
    return { error: 'appliedAt must be a date string' };
  }

  const date = new Date(`${rawValue}T00:00:00.000`);

  if (Number.isNaN(date.getTime())) {
    return { error: 'appliedAt must be a valid date' };
  }

  if (date >= getStartOfTomorrow()) {
    return { error: 'Applied date cannot be in the future' };
  }

  return { value: date };
}

function buildJobResponse(job) {
  return { job };
}

function buildApplicationResponse(application) {
  return { application };
}

function validateStatus(status) {
  return allowedStatuses.has(status);
}

function buildCreateData(body) {
  const title = trimString(body.title);
  const department = trimString(body.department);
  const description = trimString(body.description);
  const status = body.status ?? 'OPEN';

  if (!title) {
    return { error: 'Title is required' };
  }

  if (!department) {
    return { error: 'Department is required' };
  }

  if (!description) {
    return { error: 'Description is required' };
  }

  if (!validateStatus(status)) {
    return { error: 'Status must be OPEN or CLOSED' };
  }

  return {
    data: {
      title,
      department,
      description,
      status,
    },
  };
}

function buildPatchData(body) {
  if (Object.keys(body).length === 0) {
    return { error: 'At least one field is required' };
  }

  if (Object.hasOwn(body, 'archivedAt')) {
    return { error: 'Use the archive or restore endpoint to change archived state' };
  }

  if (hasUnknownFields(body, editableFields)) {
    return { error: 'Only title, department, description, and status can be updated' };
  }

  const data = {};

  if (Object.hasOwn(body, 'title')) {
    const title = trimString(body.title);

    if (!title) {
      return { error: 'Title is required' };
    }

    data.title = title;
  }

  if (Object.hasOwn(body, 'department')) {
    const department = trimString(body.department);

    if (!department) {
      return { error: 'Department is required' };
    }

    data.department = department;
  }

  if (Object.hasOwn(body, 'description')) {
    const description = trimString(body.description);

    if (!description) {
      return { error: 'Description is required' };
    }

    data.description = description;
  }

  if (Object.hasOwn(body, 'status')) {
    if (!validateStatus(body.status)) {
      return { error: 'Status must be OPEN or CLOSED' };
    }

    data.status = body.status;
  }

  return { data };
}

function buildApplicationCreateData(body, jobOpeningId) {
  const candidateName = trimString(body.candidateName);
  const candidateEmail = trimString(body.candidateEmail).toLowerCase();
  const source = trimString(body.source);
  const notes = Object.hasOwn(body, 'notes') ? body.notes : null;
  const appliedAt = Object.hasOwn(body, 'appliedAt') ? body.appliedAt : null;
  const interviewScheduledAt = Object.hasOwn(body, 'interviewScheduledAt')
    ? body.interviewScheduledAt
    : null;

  if (!candidateName) {
    return { error: 'Candidate name is required' };
  }

  if (!candidateEmail) {
    return { error: 'Candidate email is required' };
  }

  if (!emailPattern.test(candidateEmail)) {
    return { error: 'Candidate email must be a valid email address' };
  }

  if (!source) {
    return { error: 'Source is required' };
  }

  if (notes !== null && typeof notes !== 'string') {
    return { error: 'Notes must be a string' };
  }

  const interviewScheduledAtResult = parseOptionalFutureDateTime(
    interviewScheduledAt,
    'interviewScheduledAt',
  );
  const appliedAtResult = parseAppliedAt(appliedAt);

  if (appliedAtResult.error) {
    return { error: appliedAtResult.error };
  }

  if (interviewScheduledAtResult.error) {
    return { error: interviewScheduledAtResult.error };
  }

  return {
    data: {
      jobOpeningId,
      candidateName,
      candidateEmail,
      source,
      notes: trimString(notes) || null,
      appliedAt: appliedAtResult.value,
      stageEnteredAt: appliedAtResult.value,
      interviewScheduledAt: interviewScheduledAtResult.value,
    },
  };
}

async function findJob(id) {
  return prisma.jobOpening.findUnique({
    where: { id },
  });
}

async function findJobWithApplications(id) {
  return prisma.jobOpening.findUnique({
    where: { id },
    include: {
      applications: {
        orderBy: { appliedAt: 'desc' },
      },
    },
  });
}

router.post('/', async (req, res, next) => {
  try {
    const body = getRequestBody(req);

    if (!body) {
      return res.status(400).json({ error: 'Request body must be an object' });
    }

    if (hasUnknownFields(body, createFields)) {
      return res.status(400).json({ error: 'Only title, department, description, and status are allowed' });
    }

    const result = buildCreateData(body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const job = await prisma.jobOpening.create({
      data: result.data,
    });

    return res.status(201).json(buildJobResponse(job));
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const archived = req.query.archived;
    const where = {};

    if (!archived || archived === 'false') {
      where.archivedAt = null;
    } else if (archived === 'true') {
      where.archivedAt = { not: null };
    } else if (archived !== 'all') {
      return res.status(400).json({ error: 'Archived filter must be true, false, or all' });
    }

    const jobs = await prisma.jobOpening.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ jobs });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const job = await findJobWithApplications(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    return res.json(buildJobResponse(job));
  } catch (error) {
    return next(error);
  }
});

router.post('/:jobId/applications', async (req, res, next) => {
  try {
    const body = getRequestBody(req);

    if (!body) {
      return res.status(400).json({ error: 'Request body must be an object' });
    }

    if (hasUnknownFields(body, applicationCreateFields)) {
      return res.status(400).json({ error: 'Only candidateName, candidateEmail, source, notes, appliedAt, and interviewScheduledAt are allowed' });
    }

    const existingJob = await findJob(req.params.jobId);

    if (!existingJob) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    const result = buildApplicationCreateData(body, req.params.jobId);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const application = await prisma.$transaction(
      async (tx) => {
        const createdApplication = await tx.application.create({
          data: result.data,
        });

        await tx.applicationEvent.create({
          data: buildApplicationCreatedEventData(createdApplication, req.auth.userId),
        });

        return createdApplication;
      },
      applicationTransactionOptions,
    );

    return res.status(201).json(buildApplicationResponse(application));
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

    const result = buildPatchData(body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const existingJob = await findJob(req.params.id);

    if (!existingJob) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    const job = await prisma.jobOpening.update({
      where: { id: req.params.id },
      data: result.data,
    });

    return res.json(buildJobResponse(job));
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/archive', async (req, res, next) => {
  try {
    const existingJob = await findJob(req.params.id);

    if (!existingJob) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    if (existingJob.archivedAt) {
      return res.json(buildJobResponse(existingJob));
    }

    const job = await prisma.jobOpening.update({
      where: { id: req.params.id },
      data: { archivedAt: new Date() },
    });

    return res.json(buildJobResponse(job));
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/restore', async (req, res, next) => {
  try {
    const existingJob = await findJob(req.params.id);

    if (!existingJob) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    if (!existingJob.archivedAt) {
      return res.json(buildJobResponse(existingJob));
    }

    const job = await prisma.jobOpening.update({
      where: { id: req.params.id },
      data: { archivedAt: null },
    });

    return res.json(buildJobResponse(job));
  } catch (error) {
    return next(error);
  }
});

export default router;
