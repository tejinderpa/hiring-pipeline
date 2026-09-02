const csvHeaders = [
  'Application ID',
  'Candidate Name',
  'Candidate Email',
  'Job Opening',
  'Source',
  'Stage',
  'Applied At',
  'Last Updated',
];

export const openPipelineApplicationWhere = {
  stage: {
    not: 'REJECTED',
  },
  jobOpening: {
    status: 'OPEN',
    archivedAt: null,
  },
};

function formatCsvDate(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString();
}

export function escapeCsvValue(value) {
  const normalizedValue = value === null || value === undefined ? '' : String(value);

  return `"${normalizedValue.replaceAll('"', '""')}"`;
}

export function buildApplicationExportCsv(applications) {
  const rows = applications.map((application) => [
    application.id,
    application.candidateName,
    application.candidateEmail,
    application.jobOpening?.title || '',
    application.source,
    application.stage,
    formatCsvDate(application.appliedAt),
    formatCsvDate(application.updatedAt),
  ]);

  return [
    csvHeaders,
    ...rows,
  ].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
}

export function buildApplicationExportFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10);

  return `hiring-pipeline-${stamp}.csv`;
}
