import { Router } from 'express';

import { authenticate, requireRole } from './auth.js';
import { prisma } from './prisma.js';

const router = Router();
const allowedStatuses = new Set(['OPEN', 'CLOSED']);
const editableFields = new Set(['title', 'department', 'description', 'status']);
const createFields = new Set(['title', 'department', 'description', 'status']);

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

function buildJobResponse(job) {
  return { job };
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

async function findJob(id) {
  return prisma.jobOpening.findUnique({
    where: { id },
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
    const job = await findJob(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job opening not found' });
    }

    return res.json(buildJobResponse(job));
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
