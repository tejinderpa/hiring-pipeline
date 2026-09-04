import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildApplicationAdvanceData,
  buildApplicationReinstateData,
  buildApplicationRejectData,
} from './applicationPipeline.js';

const actorId = 'user-recruiter';

function buildApplication(stage) {
  return {
    id: `app-${stage.toLowerCase()}`,
    stage,
  };
}

test('APPLIED advances to SCREENING', () => {
  const application = buildApplication('APPLIED');
  const beforeTransition = Date.now();
  const result = buildApplicationAdvanceData(application, actorId);
  const afterTransition = Date.now();

  assert.equal(result.applicationData.stage, 'SCREENING');
  assert.ok(result.applicationData.stageEnteredAt instanceof Date);
  assert.ok(result.applicationData.stageEnteredAt.getTime() >= beforeTransition);
  assert.ok(result.applicationData.stageEnteredAt.getTime() <= afterTransition);
  assert.equal(result.eventData.type, 'STAGE_CHANGED');
  assert.equal(result.eventData.actorId, actorId);
  assert.equal(result.eventData.oldStage, 'APPLIED');
  assert.equal(result.eventData.newStage, 'SCREENING');
});

test('SCREENING advances to INTERVIEW', () => {
  const result = buildApplicationAdvanceData(buildApplication('SCREENING'), actorId);

  assert.equal(result.applicationData.stage, 'INTERVIEW');
  assert.equal(result.eventData.oldStage, 'SCREENING');
  assert.equal(result.eventData.newStage, 'INTERVIEW');
});

test('INTERVIEW advances to OFFER', () => {
  const result = buildApplicationAdvanceData(buildApplication('INTERVIEW'), actorId);

  assert.equal(result.applicationData.stage, 'OFFER');
  assert.equal(result.eventData.oldStage, 'INTERVIEW');
  assert.equal(result.eventData.newStage, 'OFFER');
});

test('OFFER advances to HIRED', () => {
  const result = buildApplicationAdvanceData(buildApplication('OFFER'), actorId);

  assert.equal(result.applicationData.stage, 'HIRED');
  assert.equal(result.eventData.oldStage, 'OFFER');
  assert.equal(result.eventData.newStage, 'HIRED');
});

test('HIRED cannot advance', () => {
  const result = buildApplicationAdvanceData(buildApplication('HIRED'), actorId);

  assert.equal(result.error, 'Applications in HIRED stage cannot be advanced');
});

test('REJECTED cannot advance', () => {
  const result = buildApplicationAdvanceData(buildApplication('REJECTED'), actorId);

  assert.equal(result.error, 'Applications in REJECTED stage cannot be advanced');
});

test('reject preserves the stage an application was rejected from', () => {
  const result = buildApplicationRejectData(buildApplication('INTERVIEW'), actorId);

  assert.equal(result.applicationData.stage, 'REJECTED');
  assert.equal(result.applicationData.rejectedFromStage, 'INTERVIEW');
  assert.ok(result.applicationData.stageEnteredAt instanceof Date);
  assert.equal(result.eventData.type, 'REJECTED');
  assert.equal(result.eventData.actorId, actorId);
  assert.equal(result.eventData.oldStage, 'INTERVIEW');
  assert.equal(result.eventData.newStage, 'REJECTED');
});

test('already rejected application cannot be rejected again', () => {
  const result = buildApplicationRejectData(buildApplication('REJECTED'), actorId);

  assert.equal(result.error, 'Application has already been rejected');
});

test('reinstating a rejected application restores rejectedFromStage and records stage entry time', () => {
  const application = {
    ...buildApplication('REJECTED'),
    rejectedFromStage: 'SCREENING',
  };
  const result = buildApplicationReinstateData(application, actorId);

  assert.equal(result.applicationData.stage, 'SCREENING');
  assert.equal(result.applicationData.rejectedFromStage, null);
  assert.ok(result.applicationData.stageEnteredAt instanceof Date);
  assert.equal(result.eventData.type, 'REINSTATED');
  assert.equal(result.eventData.oldStage, 'REJECTED');
  assert.equal(result.eventData.newStage, 'SCREENING');
});
