const nextStageByStage = {
  APPLIED: 'SCREENING',
  SCREENING: 'INTERVIEW',
  INTERVIEW: 'OFFER',
  OFFER: 'HIRED',
};

export function getNextApplicationStage(stage) {
  return nextStageByStage[stage] ?? null;
}

function buildApplicationEventData(application, actorId, type, oldStage, newStage, metadata = null) {
  const eventData = {
    applicationId: application.id,
    type,
    actorId,
    oldStage,
    newStage,
  };

  if (metadata !== null) {
    eventData.metadata = metadata;
  }

  return eventData;
}

export function buildApplicationCreatedEventData(application, actorId) {
  return buildApplicationEventData(
    application,
    actorId,
    'APPLICATION_CREATED',
    null,
    application.stage,
  );
}

export function buildFeedbackAddedEventData(applicationId, actorId, feedback) {
  return buildApplicationEventData(
    { id: applicationId },
    actorId,
    'FEEDBACK_ADDED',
    null,
    null,
    {
      feedbackId: feedback.id,
      content: feedback.content,
    },
  );
}

export function buildApplicationAdvanceData(application, actorId) {
  const nextStage = getNextApplicationStage(application.stage);

  if (!nextStage) {
    return {
      error: `Applications in ${application.stage} stage cannot be advanced`,
    };
  }

  return {
    applicationData: {
      stage: nextStage,
    },
    eventData: buildApplicationEventData(
      application,
      actorId,
      'STAGE_CHANGED',
      application.stage,
      nextStage,
    ),
  };
}

export function buildApplicationRejectData(application, actorId) {
  if (application.stage === 'REJECTED') {
    return {
      error: 'Application has already been rejected',
    };
  }

  return {
    applicationData: {
      stage: 'REJECTED',
      rejectedFromStage: application.stage,
    },
    eventData: buildApplicationEventData(
      application,
      actorId,
      'REJECTED',
      application.stage,
      'REJECTED',
    ),
  };
}

export function buildApplicationReinstateData(application, actorId) {
  if (application.stage !== 'REJECTED') {
    return {
      error: 'Only rejected applications can be reinstated',
    };
  }

  if (!application.rejectedFromStage) {
    return {
      error: 'Cannot reinstate application because rejectedFromStage is missing',
    };
  }

  return {
    applicationData: {
      stage: application.rejectedFromStage,
      rejectedFromStage: null,
    },
    eventData: buildApplicationEventData(
      application,
      actorId,
      'REINSTATED',
      'REJECTED',
      application.rejectedFromStage,
    ),
  };
}
