import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildCurrentStageDismissalFilter,
  buildStalledAlertResponse,
  buildStalledAlertWhere,
  filterUndismissedStalledApplications,
  getDaysStalled,
  getStalledCutoff,
  isStalledApplication,
} from './stalledAlerts.js';

const now = new Date('2026-09-04T12:00:00.000Z');

function daysAgo(days) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function buildApplication(overrides = {}) {
  return {
    id: 'app-1',
    candidateName: 'Asha Mehta',
    candidateEmail: 'asha@example.com',
    stage: 'SCREENING',
    stageEnteredAt: daysAgo(11),
    jobOpening: {
      id: 'job-1',
      title: 'Frontend Engineer',
    },
    alertDismissals: [],
    ...overrides,
  };
}

test('stalled cutoff is exactly 10 days before now', () => {
  assert.equal(getStalledCutoff(now).toISOString(), '2026-08-25T12:00:00.000Z');
});

test('9 and 10 day candidates are not alerted, but over 10 days is alerted', () => {
  assert.equal(isStalledApplication(buildApplication({ stageEnteredAt: daysAgo(9) }), now), false);
  assert.equal(isStalledApplication(buildApplication({ stageEnteredAt: daysAgo(10) }), now), false);
  assert.equal(
    isStalledApplication(
      buildApplication({ stageEnteredAt: new Date('2026-08-25T11:59:59.999Z') }),
      now,
    ),
    true,
  );
});

test('terminal applications are not stalled alerts', () => {
  assert.equal(isStalledApplication(buildApplication({ stage: 'HIRED' }), now), false);
  assert.equal(isStalledApplication(buildApplication({ stage: 'REJECTED' }), now), false);
});

test('stalled alert query uses stageEnteredAt and excludes terminal stages', () => {
  assert.deepEqual(buildStalledAlertWhere(now), {
    stage: {
      notIn: ['HIRED', 'REJECTED'],
    },
    stageEnteredAt: {
      lt: new Date('2026-08-25T12:00:00.000Z'),
    },
  });
});

test('dismissal removes only the current-stage alert', () => {
  const dismissedCurrentStage = buildApplication({
    stage: 'SCREENING',
    alertDismissals: [{ stage: 'SCREENING' }],
  });
  const dismissedOldStage = buildApplication({
    stage: 'INTERVIEW',
    alertDismissals: [{ stage: 'SCREENING' }],
  });

  assert.deepEqual(filterUndismissedStalledApplications([
    dismissedCurrentStage,
    dismissedOldStage,
  ]), [dismissedOldStage]);
});

test('dismiss endpoint records dismissal for the application current stage only', () => {
  assert.deepEqual(buildCurrentStageDismissalFilter(buildApplication({ stage: 'INTERVIEW' })), {
    applicationId: 'app-1',
    stage: 'INTERVIEW',
  });
});

test('stalled alert response includes days stalled and job summary', () => {
  const response = buildStalledAlertResponse([buildApplication()], now);

  assert.deepEqual(response, {
    count: 1,
    data: [
      {
        applicationId: 'app-1',
        candidateName: 'Asha Mehta',
        candidateEmail: 'asha@example.com',
        stage: 'SCREENING',
        stageEnteredAt: daysAgo(11),
        daysStalled: 11,
        job: {
          id: 'job-1',
          title: 'Frontend Engineer',
        },
      },
    ],
  });
  assert.equal(getDaysStalled(daysAgo(11), now), 11);
});

test('alert routes are recruiter-only', async () => {
  const source = await readFile(new URL('./alerts.js', import.meta.url), 'utf8');

  assert.match(source, /router\.use\(authenticate, requireRole\('RECRUITER'\)\)/);
});

test('application edits do not update stageEnteredAt directly', async () => {
  const source = await readFile(new URL('./applications.js', import.meta.url), 'utf8');
  const patchRouteSource = source.slice(source.indexOf("router.patch('/:id'"));

  assert.match(patchRouteSource, /prisma\.application\.update/);
  assert.doesNotMatch(patchRouteSource, /stageEnteredAt/);
});
