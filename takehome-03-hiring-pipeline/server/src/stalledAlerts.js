export const stalledAlertThresholdDays = 10;
export const stalledAlertTerminalStages = ['HIRED', 'REJECTED'];

export function getStalledCutoff(now = new Date()) {
  return new Date(now.getTime() - stalledAlertThresholdDays * 24 * 60 * 60 * 1000);
}

export function isStalledApplication(application, now = new Date()) {
  if (!application?.stageEnteredAt) {
    return false;
  }

  if (stalledAlertTerminalStages.includes(application.stage)) {
    return false;
  }

  return application.stageEnteredAt.getTime() < getStalledCutoff(now).getTime();
}

export function buildStalledAlertWhere(now = new Date()) {
  return {
    stage: {
      notIn: stalledAlertTerminalStages,
    },
    stageEnteredAt: {
      lt: getStalledCutoff(now),
    },
  };
}

export function hasCurrentStageDismissal(application) {
  return application.alertDismissals?.some((dismissal) => (
    dismissal.stage === application.stage
  )) ?? false;
}

export function filterUndismissedStalledApplications(applications) {
  return applications.filter((application) => !hasCurrentStageDismissal(application));
}

export function buildCurrentStageDismissalFilter(application) {
  return {
    applicationId: application.id,
    stage: application.stage,
  };
}

export function getDaysStalled(stageEnteredAt, now = new Date()) {
  return Math.floor((now.getTime() - stageEnteredAt.getTime()) / (24 * 60 * 60 * 1000));
}

export function buildStalledAlertResponse(applications, now = new Date()) {
  const data = applications.map((application) => ({
    applicationId: application.id,
    candidateName: application.candidateName,
    candidateEmail: application.candidateEmail,
    stage: application.stage,
    stageEnteredAt: application.stageEnteredAt,
    daysStalled: getDaysStalled(application.stageEnteredAt, now),
    job: {
      id: application.jobOpening.id,
      title: application.jobOpening.title,
    },
  }));

  return {
    count: data.length,
    data,
  };
}
