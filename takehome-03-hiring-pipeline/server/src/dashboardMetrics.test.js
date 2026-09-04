import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  activeApplicationWhere,
  buildApplicationsByJob,
  buildApplicationsByStage,
  buildApplicationsPerWeek,
  dashboardWeekCount,
  getDashboardDateRanges,
  getUtcStartOfMonth,
  getUtcStartOfWeek,
  openPositionWhere,
} from './dashboardMetrics.js';

test('open positions use the existing open and unarchived job semantics', () => {
  assert.deepEqual(openPositionWhere, {
    status: 'OPEN',
    archivedAt: null,
  });
});

test('active applications exclude hired and rejected terminal stages', () => {
  assert.deepEqual(activeApplicationWhere, {
    stage: {
      notIn: ['HIRED', 'REJECTED'],
    },
  });
});

test('dashboard date ranges use UTC calendar week and current month boundaries', () => {
  const now = new Date('2026-09-04T18:30:00.000Z');
  const ranges = getDashboardDateRanges(now);

  assert.equal(getUtcStartOfWeek(now).toISOString(), '2026-08-31T00:00:00.000Z');
  assert.equal(ranges.weekEnd.toISOString(), '2026-09-07T00:00:00.000Z');
  assert.equal(getUtcStartOfMonth(now).toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(ranges.monthEnd.toISOString(), '2026-10-01T00:00:00.000Z');
});

test('applications per week returns 13 weeks including zero-count weeks', () => {
  const now = new Date('2026-09-04T12:00:00.000Z');
  const rows = [
    { appliedAt: new Date('2026-08-31T00:00:00.000Z') },
    { appliedAt: new Date('2026-09-06T23:59:59.999Z') },
    { appliedAt: new Date('2026-08-24T10:00:00.000Z') },
  ];
  const result = buildApplicationsPerWeek(rows, now);

  assert.equal(result.length, dashboardWeekCount);
  assert.deepEqual(result.at(-2), {
    weekStart: '2026-08-24',
    count: 1,
  });
  assert.deepEqual(result.at(-1), {
    weekStart: '2026-08-31',
    count: 2,
  });
  assert.ok(result.some((week) => week.count === 0));
});

test('applications per week ignores dates outside the last-quarter range', () => {
  const now = new Date('2026-09-04T12:00:00.000Z');
  const result = buildApplicationsPerWeek([
    { appliedAt: new Date('2026-06-01T10:00:00.000Z') },
    { appliedAt: new Date('2026-06-08T10:00:00.000Z') },
  ], now);

  assert.deepEqual(result[0], {
    weekStart: '2026-06-08',
    count: 1,
  });
});

test('dashboard aggregation rows are shaped for the frontend', () => {
  assert.deepEqual(buildApplicationsByStage([
    { stage: 'APPLIED', _count: { _all: 2 } },
    { stage: 'REJECTED', _count: { _all: 1 } },
  ]), [
    { stage: 'APPLIED', count: 2 },
    { stage: 'REJECTED', count: 1 },
  ]);

  assert.deepEqual(buildApplicationsByJob([
    { id: 'job-1', title: 'Frontend Engineer', _count: { applications: 3 } },
  ]), [
    { jobId: 'job-1', title: 'Frontend Engineer', count: 3 },
  ]);
});

test('dashboard route uses scheduled interviews, current-stage hire date, and database aggregation', async () => {
  const source = await readFile(new URL('./dashboard.js', import.meta.url), 'utf8');

  assert.match(source, /router\.use\(authenticate, requireRole\('RECRUITER'\)\)/);
  assert.match(source, /interviewScheduledAt/);
  assert.match(source, /stageEnteredAt/);
  assert.match(source, /stage: 'HIRED'/);
  assert.match(source, /prisma\.application\.groupBy/);
  assert.match(source, /_count/);
});
