export const terminalApplicationStages = ['HIRED', 'REJECTED'];
export const dashboardWeekCount = 13;

export const openPositionWhere = {
  status: 'OPEN',
  archivedAt: null,
};

export const activeApplicationWhere = {
  stage: {
    notIn: terminalApplicationStages,
  },
};

function addUtcDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

export function getUtcStartOfWeek(date = new Date()) {
  const start = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
  const day = start.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;

  return addUtcDays(start, -daysSinceMonday);
}

export function getUtcStartOfMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function getDashboardDateRanges(now = new Date()) {
  const weekStart = getUtcStartOfWeek(now);
  const weekEnd = addUtcDays(weekStart, 7);
  const monthStart = getUtcStartOfMonth(now);
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const applicationWeekStart = addUtcDays(weekStart, -(dashboardWeekCount - 1) * 7);
  const applicationWeekEnd = weekEnd;

  return {
    weekStart,
    weekEnd,
    monthStart,
    monthEnd,
    applicationWeekStart,
    applicationWeekEnd,
  };
}

export function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function buildApplicationsByStage(stageRows) {
  return stageRows.map((row) => ({
    stage: row.stage,
    count: row._count?._all ?? row._count?.stage ?? 0,
  }));
}

export function buildApplicationsByJob(jobRows) {
  return jobRows.map((job) => ({
    jobId: job.id,
    title: job.title,
    count: job._count?.applications ?? 0,
  }));
}

export function buildApplicationsPerWeek(applicationRows, now = new Date()) {
  const { applicationWeekStart } = getDashboardDateRanges(now);
  const countsByWeek = new Map();

  for (let index = 0; index < dashboardWeekCount; index += 1) {
    countsByWeek.set(formatDateKey(addUtcDays(applicationWeekStart, index * 7)), 0);
  }

  for (const application of applicationRows) {
    const weekStart = getUtcStartOfWeek(application.appliedAt);
    const weekKey = formatDateKey(weekStart);

    if (countsByWeek.has(weekKey)) {
      countsByWeek.set(weekKey, countsByWeek.get(weekKey) + 1);
    }
  }

  return [...countsByWeek.entries()].map(([weekStart, count]) => ({
    weekStart,
    count,
  }));
}

export function buildDashboardResponse({
  openPositions,
  activeApplications,
  interviewsThisWeek,
  hiresThisMonth,
  stageRows,
  jobRows,
  applicationRows,
  now = new Date(),
}) {
  return {
    openPositions,
    activeApplications,
    interviewsThisWeek,
    hiresThisMonth,
    applicationsByStage: buildApplicationsByStage(stageRows),
    applicationsByJob: buildApplicationsByJob(jobRows),
    applicationsPerWeek: buildApplicationsPerWeek(applicationRows, now),
  };
}
