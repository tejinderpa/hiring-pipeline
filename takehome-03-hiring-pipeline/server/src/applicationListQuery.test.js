import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildApplicationListQuery,
  buildApplicationListResponse,
} from './applicationListQuery.js';

test('default list query uses updatedAt desc with first page defaults', () => {
  const query = buildApplicationListQuery({});

  assert.deepEqual(query.where, {});
  assert.deepEqual(query.orderBy, [{ updatedAt: 'desc' }, { id: 'asc' }]);
  assert.equal(query.page, 1);
  assert.equal(query.limit, 20);
  assert.equal(query.skip, 0);
  assert.equal(query.take, 20);
});

test('search filters candidate name and email case-insensitively', () => {
  const query = buildApplicationListQuery({ search: 'Tej' });

  assert.deepEqual(query.where, {
    OR: [
      { candidateName: { contains: 'Tej', mode: 'insensitive' } },
      { candidateEmail: { contains: 'Tej', mode: 'insensitive' } },
    ],
  });
});

test('candidate email search uses the same database search filter', () => {
  const query = buildApplicationListQuery({ search: 'candidate@example.com' });

  assert.deepEqual(query.where.OR[1], {
    candidateEmail: {
      contains: 'candidate@example.com',
      mode: 'insensitive',
    },
  });
});

test('job filter targets jobOpeningId', () => {
  const query = buildApplicationListQuery({ jobId: 'job-123' });

  assert.equal(query.where.jobOpeningId, 'job-123');
});

test('stage filter validates and filters stage', () => {
  const query = buildApplicationListQuery({ stage: 'INTERVIEW' });

  assert.equal(query.where.stage, 'INTERVIEW');
});

test('source filter is case-insensitive exact match', () => {
  const query = buildApplicationListQuery({ source: 'LinkedIn' });

  assert.deepEqual(query.where.source, {
    equals: 'LinkedIn',
    mode: 'insensitive',
  });
});

test('combined filters are applied together', () => {
  const query = buildApplicationListQuery({
    search: 'tej',
    stage: 'INTERVIEW',
    jobId: 'abc',
    source: 'LinkedIn',
  });

  assert.equal(query.where.jobOpeningId, 'abc');
  assert.equal(query.where.stage, 'INTERVIEW');
  assert.deepEqual(query.where.source, {
    equals: 'LinkedIn',
    mode: 'insensitive',
  });
  assert.equal(query.where.OR.length, 2);
});

test('ascending sorting is allowlisted', () => {
  const query = buildApplicationListQuery({ sort: 'appliedAt', order: 'asc' });

  assert.deepEqual(query.orderBy, [{ appliedAt: 'asc' }, { id: 'asc' }]);
});

test('descending sorting is allowlisted', () => {
  const query = buildApplicationListQuery({ sort: 'stage', order: 'desc' });

  assert.deepEqual(query.orderBy, [{ stage: 'desc' }, { id: 'asc' }]);
});

test('pagination uses skip and take', () => {
  const query = buildApplicationListQuery({ page: '3', limit: '10' });

  assert.equal(query.page, 3);
  assert.equal(query.limit, 10);
  assert.equal(query.skip, 20);
  assert.equal(query.take, 10);
});

test('pagination total reflects all filtered matches', () => {
  const response = buildApplicationListResponse([{ id: 'one' }, { id: 'two' }], 2, 2, 5);

  assert.deepEqual(response.pagination, {
    page: 2,
    limit: 2,
    total: 5,
    pages: 3,
  });
});

test('invalid sort field is rejected', () => {
  const query = buildApplicationListQuery({ sort: 'candidateName' });

  assert.equal(query.error, 'Sort must be appliedAt, stage, or updatedAt');
});

test('non-positive pagination values are rejected', () => {
  assert.equal(
    buildApplicationListQuery({ page: '0' }).error,
    'page must be a positive integer',
  );
  assert.equal(
    buildApplicationListQuery({ limit: '-1' }).error,
    'limit must be a positive integer',
  );
});

test('global application list route is behind recruiter middleware', async () => {
  const source = await readFile(new URL('./applications.js', import.meta.url), 'utf8');
  const recruiterMiddlewareIndex = source.indexOf("router.use(authenticate, requireRole('RECRUITER'))");
  const globalListRouteIndex = source.indexOf("router.get('/', async");

  assert.notEqual(recruiterMiddlewareIndex, -1);
  assert.notEqual(globalListRouteIndex, -1);
  assert.ok(recruiterMiddlewareIndex < globalListRouteIndex);
});
