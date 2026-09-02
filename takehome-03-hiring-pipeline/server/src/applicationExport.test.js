import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildApplicationExportCsv,
  buildApplicationExportFilename,
  escapeCsvValue,
  openPipelineApplicationWhere,
} from './applicationExport.js';

test('CSV values are safely quoted and escaped', () => {
  assert.equal(escapeCsvValue('Plain'), '"Plain"');
  assert.equal(escapeCsvValue('Doe, Jane'), '"Doe, Jane"');
  assert.equal(escapeCsvValue('Jane "JJ" Doe'), '"Jane ""JJ"" Doe"');
  assert.equal(escapeCsvValue('Line one\nLine two'), '"Line one\nLine two"');
  assert.equal(escapeCsvValue(null), '""');
});

test('application export CSV contains concise headers and rows', () => {
  const csv = buildApplicationExportCsv([
    {
      id: 'app-1',
      candidateName: 'Doe, Jane',
      candidateEmail: 'jane@example.com',
      jobOpening: { title: 'Frontend "Platform" Engineer' },
      source: 'Referral',
      stage: 'INTERVIEW',
      appliedAt: new Date('2026-09-01T10:00:00.000Z'),
      updatedAt: new Date('2026-09-02T11:30:00.000Z'),
    },
    {
      id: 'app-2',
      candidateName: 'Line Break',
      candidateEmail: 'line@example.com',
      jobOpening: { title: 'Customer\nSuccess Manager' },
      source: 'LinkedIn',
      stage: 'OFFER',
      appliedAt: new Date('2026-09-03T10:00:00.000Z'),
      updatedAt: new Date('2026-09-04T11:30:00.000Z'),
    },
  ]);

  assert.equal(csv, [
    '"Application ID","Candidate Name","Candidate Email","Job Opening","Source","Stage","Applied At","Last Updated"',
    '"app-1","Doe, Jane","jane@example.com","Frontend ""Platform"" Engineer","Referral","INTERVIEW","2026-09-01T10:00:00.000Z","2026-09-02T11:30:00.000Z"',
    '"app-2","Line Break","line@example.com","Customer\nSuccess Manager","LinkedIn","OFFER","2026-09-03T10:00:00.000Z","2026-09-04T11:30:00.000Z"',
  ].join('\r\n'));
});

test('export filename includes ISO date stamp', () => {
  assert.equal(
    buildApplicationExportFilename(new Date('2026-09-05T12:00:00.000Z')),
    'hiring-pipeline-2026-09-05.csv',
  );
});

test('open pipeline export excludes rejected applications and inactive job openings', () => {
  assert.deepEqual(openPipelineApplicationWhere, {
    stage: {
      not: 'REJECTED',
    },
    jobOpening: {
      status: 'OPEN',
      archivedAt: null,
    },
  });
});

test('export route is recruiter-only and registered before parameterized routes', async () => {
  const source = await readFile(new URL('./applications.js', import.meta.url), 'utf8');
  const recruiterMiddlewareIndex = source.indexOf("router.use(authenticate, requireRole('RECRUITER'))");
  const exportRouteIndex = source.indexOf("router.get('/export'");
  const singleHistoryIndex = source.indexOf("router.get('/:id/history'");

  assert.notEqual(recruiterMiddlewareIndex, -1);
  assert.notEqual(exportRouteIndex, -1);
  assert.notEqual(singleHistoryIndex, -1);
  assert.ok(recruiterMiddlewareIndex < exportRouteIndex);
  assert.ok(exportRouteIndex < singleHistoryIndex);
});
