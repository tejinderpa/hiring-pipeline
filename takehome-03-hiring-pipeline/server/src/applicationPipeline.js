const nextStageByStage = {
  APPLIED: 'SCREENING',
  SCREENING: 'INTERVIEW',
  INTERVIEW: 'OFFER',
  OFFER: 'HIRED',
};

export function getNextApplicationStage(stage) {
  return nextStageByStage[stage] ?? null;
}

export function buildApplicationAdvanceData(application) {
  const nextStage = getNextApplicationStage(application.stage);

  if (!nextStage) {
    return {
      error: `Applications in ${application.stage} stage cannot be advanced`,
    };
  }

  return {
    data: {
      stage: nextStage,
    },
  };
}

export function buildApplicationRejectData(application) {
  if (application.stage === 'REJECTED') {
    return {
      error: 'Application has already been rejected',
    };
  }

  return {
    data: {
      stage: 'REJECTED',
      rejectedFromStage: application.stage,
    },
  };
}

export function buildApplicationReinstateData(application) {
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
    data: {
      stage: application.rejectedFromStage,
      rejectedFromStage: null,
    },
  };
}
