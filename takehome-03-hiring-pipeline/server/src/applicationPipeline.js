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
