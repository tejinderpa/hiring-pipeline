import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildBulkApplicationActionResponse,
  buildBulkApplicationIds,
  bulkUpdateApplicationsWithEvents,
  maxBulkApplicationIds,
} from './applicationBulkActions.js';
import {
  buildApplicationAdvanceData,
  buildApplicationRejectData,
} from './applicationPipeline.js';

const actorId = 'user-recruiter';

function buildApplication(id, stage) {
  return { id, stage };
}

function buildFakePrisma(applications) {
  return {
    application: {
      async findMany(query) {
        const ids = new Set(query.where.id.in);
        return applications.filter((application) => ids.has(application.id));
      },
    },
  };
}

function buildFakeUpdater(applications, calls = []) {
  const applicationsById = new Map(applications.map((application) => [application.id, { ...application }]));

  return {
    async updateApplicationWithEvent(applicationId, nextActorId, buildTransition) {
      const application = applicationsById.get(applicationId);
      const transition = buildTransition(application, nextActorId);

      calls.push(applicationId);

      if (transition.error) {
        return {
          status: 409,
          error: transition.error,
        };
      }

      const from = application.stage;
      const to = transition.eventData.newStage;

      applicationsById.set(applicationId, {
        ...application,
        ...transition.applicationData,
      });

      return { from, to };
    },
    getApplication(applicationId) {
      return applicationsById.get(applicationId);
    },
  };
}

test('bulk request requires applicationIds', () => {
  assert.equal(buildBulkApplicationIds({}).error, 'applicationIds is required');
});

test('bulk request requires applicationIds array', () => {
  assert.equal(buildBulkApplicationIds({ applicationIds: 'app-1' }).error, 'applicationIds must be an array');
});

test('bulk request rejects empty applicationIds array', () => {
  assert.equal(buildBulkApplicationIds({ applicationIds: [] }).error, 'applicationIds must contain at least one id');
});

test('bulk request rejects unreasonable batch size', () => {
  const applicationIds = Array.from({ length: maxBulkApplicationIds + 1 }, (_, index) => `app-${index}`);

  assert.equal(
    buildBulkApplicationIds({ applicationIds }).error,
    `applicationIds cannot contain more than ${maxBulkApplicationIds} ids`,
  );
});

test('bulk request rejects invalid ids', () => {
  assert.equal(
    buildBulkApplicationIds({ applicationIds: ['app-1', ''] }).error,
    'applicationIds must contain only non-empty strings',
  );
});

test('bulk request deduplicates ids while preserving order', () => {
  const result = buildBulkApplicationIds({ applicationIds: [' app-1 ', 'app-2', 'app-1'] });

  assert.deepEqual(result.applicationIds, ['app-1', 'app-2']);
});

test('bulk response wraps results', () => {
  assert.deepEqual(buildBulkApplicationActionResponse([{ applicationId: 'app-1' }]), {
    results: [{ applicationId: 'app-1' }],
  });
});

test('bulk advance succeeds when all applications are valid', async () => {
  const applications = [
    buildApplication('app-applied', 'APPLIED'),
    buildApplication('app-screening', 'SCREENING'),
    buildApplication('app-interview', 'INTERVIEW'),
    buildApplication('app-offer', 'OFFER'),
  ];
  const updater = buildFakeUpdater(applications);
  const results = await bulkUpdateApplicationsWithEvents({
    prisma: buildFakePrisma(applications),
    applicationIds: applications.map((application) => application.id),
    actorId,
    buildTransition: buildApplicationAdvanceData,
    updateApplicationWithEvent: updater.updateApplicationWithEvent,
  });

  assert.deepEqual(results, [
    { applicationId: 'app-applied', success: true, from: 'APPLIED', to: 'SCREENING' },
    { applicationId: 'app-screening', success: true, from: 'SCREENING', to: 'INTERVIEW' },
    { applicationId: 'app-interview', success: true, from: 'INTERVIEW', to: 'OFFER' },
    { applicationId: 'app-offer', success: true, from: 'OFFER', to: 'HIRED' },
  ]);
});

test('bulk advance reports hired and rejected failures independently', async () => {
  const applications = [
    buildApplication('app-valid', 'SCREENING'),
    buildApplication('app-hired', 'HIRED'),
    buildApplication('app-rejected', 'REJECTED'),
  ];
  const updater = buildFakeUpdater(applications);
  const results = await bulkUpdateApplicationsWithEvents({
    prisma: buildFakePrisma(applications),
    applicationIds: ['app-valid', 'app-hired', 'app-rejected'],
    actorId,
    buildTransition: buildApplicationAdvanceData,
    updateApplicationWithEvent: updater.updateApplicationWithEvent,
  });

  assert.deepEqual(results, [
    { applicationId: 'app-valid', success: true, from: 'SCREENING', to: 'INTERVIEW' },
    {
      applicationId: 'app-hired',
      success: false,
      reason: 'Applications in HIRED stage cannot be advanced',
    },
    {
      applicationId: 'app-rejected',
      success: false,
      reason: 'Applications in REJECTED stage cannot be advanced',
    },
  ]);
});

test('bulk advance reports nonexistent ids without aborting valid updates', async () => {
  const applications = [buildApplication('app-valid', 'APPLIED')];
  const updater = buildFakeUpdater(applications);
  const results = await bulkUpdateApplicationsWithEvents({
    prisma: buildFakePrisma(applications),
    applicationIds: ['app-missing', 'app-valid'],
    actorId,
    buildTransition: buildApplicationAdvanceData,
    updateApplicationWithEvent: updater.updateApplicationWithEvent,
  });

  assert.deepEqual(results, [
    { applicationId: 'app-missing', success: false, reason: 'Application not found' },
    { applicationId: 'app-valid', success: true, from: 'APPLIED', to: 'SCREENING' },
  ]);
  assert.equal(updater.getApplication('app-valid').stage, 'SCREENING');
});

test('one bulk advance failure does not roll back successes', async () => {
  const applications = [
    buildApplication('app-before-failure', 'APPLIED'),
    buildApplication('app-failure', 'HIRED'),
    buildApplication('app-after-failure', 'INTERVIEW'),
  ];
  const updater = buildFakeUpdater(applications);

  await bulkUpdateApplicationsWithEvents({
    prisma: buildFakePrisma(applications),
    applicationIds: ['app-before-failure', 'app-failure', 'app-after-failure'],
    actorId,
    buildTransition: buildApplicationAdvanceData,
    updateApplicationWithEvent: updater.updateApplicationWithEvent,
  });

  assert.equal(updater.getApplication('app-before-failure').stage, 'SCREENING');
  assert.equal(updater.getApplication('app-failure').stage, 'HIRED');
  assert.equal(updater.getApplication('app-after-failure').stage, 'OFFER');
});

test('bulk reject succeeds when all applications are valid', async () => {
  const applications = [
    buildApplication('app-applied', 'APPLIED'),
    buildApplication('app-offer', 'OFFER'),
  ];
  const updater = buildFakeUpdater(applications);
  const results = await bulkUpdateApplicationsWithEvents({
    prisma: buildFakePrisma(applications),
    applicationIds: ['app-applied', 'app-offer'],
    actorId,
    buildTransition: buildApplicationRejectData,
    updateApplicationWithEvent: updater.updateApplicationWithEvent,
  });

  assert.deepEqual(results, [
    { applicationId: 'app-applied', success: true, from: 'APPLIED', to: 'REJECTED' },
    { applicationId: 'app-offer', success: true, from: 'OFFER', to: 'REJECTED' },
  ]);
});

test('bulk reject reports mixed success and already rejected behavior', async () => {
  const applications = [
    buildApplication('app-valid', 'INTERVIEW'),
    buildApplication('app-rejected', 'REJECTED'),
  ];
  const updater = buildFakeUpdater(applications);
  const results = await bulkUpdateApplicationsWithEvents({
    prisma: buildFakePrisma(applications),
    applicationIds: ['app-valid', 'app-rejected'],
    actorId,
    buildTransition: buildApplicationRejectData,
    updateApplicationWithEvent: updater.updateApplicationWithEvent,
  });

  assert.deepEqual(results, [
    { applicationId: 'app-valid', success: true, from: 'INTERVIEW', to: 'REJECTED' },
    { applicationId: 'app-rejected', success: false, reason: 'Application has already been rejected' },
  ]);
  assert.deepEqual(updater.getApplication('app-valid'), {
    id: 'app-valid',
    stage: 'REJECTED',
    rejectedFromStage: 'INTERVIEW',
  });
});

test('one bulk reject failure does not roll back successes', async () => {
  const applications = [
    buildApplication('app-before-failure', 'SCREENING'),
    buildApplication('app-failure', 'REJECTED'),
    buildApplication('app-after-failure', 'OFFER'),
  ];
  const updater = buildFakeUpdater(applications);

  await bulkUpdateApplicationsWithEvents({
    prisma: buildFakePrisma(applications),
    applicationIds: ['app-before-failure', 'app-failure', 'app-after-failure'],
    actorId,
    buildTransition: buildApplicationRejectData,
    updateApplicationWithEvent: updater.updateApplicationWithEvent,
  });

  assert.equal(updater.getApplication('app-before-failure').stage, 'REJECTED');
  assert.equal(updater.getApplication('app-before-failure').rejectedFromStage, 'SCREENING');
  assert.equal(updater.getApplication('app-failure').stage, 'REJECTED');
  assert.equal(updater.getApplication('app-after-failure').stage, 'REJECTED');
  assert.equal(updater.getApplication('app-after-failure').rejectedFromStage, 'OFFER');
});

test('bulk routes are recruiter-only and registered before parameterized routes', async () => {
  const source = await readFile(new URL('./applications.js', import.meta.url), 'utf8');
  const recruiterMiddlewareIndex = source.indexOf("router.use(authenticate, requireRole('RECRUITER'))");
  const bulkAdvanceIndex = source.indexOf("router.post('/bulk/advance'");
  const bulkRejectIndex = source.indexOf("router.post('/bulk/reject'");
  const singleAdvanceIndex = source.indexOf("router.post('/:id/advance'");

  assert.notEqual(recruiterMiddlewareIndex, -1);
  assert.notEqual(bulkAdvanceIndex, -1);
  assert.notEqual(bulkRejectIndex, -1);
  assert.notEqual(singleAdvanceIndex, -1);
  assert.ok(recruiterMiddlewareIndex < bulkAdvanceIndex);
  assert.ok(recruiterMiddlewareIndex < bulkRejectIndex);
  assert.ok(bulkAdvanceIndex < singleAdvanceIndex);
  assert.ok(bulkRejectIndex < singleAdvanceIndex);
});
