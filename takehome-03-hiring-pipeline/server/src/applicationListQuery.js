export const applicationStages = new Set([
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
]);

export const applicationSortFields = new Set(['appliedAt', 'stage', 'updatedAt']);
export const applicationSortOrders = new Set(['asc', 'desc']);

export const defaultApplicationListPage = 1;
export const defaultApplicationListLimit = 20;
export const maxApplicationListLimit = 100;

function getSingleQueryValue(query, field) {
  const value = query[field];

  if (value === undefined) {
    return { value: null };
  }

  if (Array.isArray(value)) {
    return { error: `${field} must be a single value` };
  }

  if (typeof value !== 'string') {
    return { error: `${field} must be a string` };
  }

  return { value: value.trim() };
}

function parsePositiveInteger(query, field, defaultValue) {
  const result = getSingleQueryValue(query, field);

  if (result.error) {
    return { error: result.error };
  }

  if (result.value === null) {
    return { value: defaultValue };
  }

  if (!/^\d+$/.test(result.value)) {
    return { error: `${field} must be a positive integer` };
  }

  const value = Number(result.value);

  if (!Number.isSafeInteger(value) || value <= 0) {
    return { error: `${field} must be a positive integer` };
  }

  return { value };
}

export function buildApplicationListQuery(query) {
  const searchResult = getSingleQueryValue(query, 'search');
  const jobIdResult = getSingleQueryValue(query, 'jobId');
  const stageResult = getSingleQueryValue(query, 'stage');
  const sourceResult = getSingleQueryValue(query, 'source');
  const sortResult = getSingleQueryValue(query, 'sort');
  const orderResult = getSingleQueryValue(query, 'order');
  const pageResult = parsePositiveInteger(query, 'page', defaultApplicationListPage);
  const limitResult = parsePositiveInteger(query, 'limit', defaultApplicationListLimit);
  const results = [
    searchResult,
    jobIdResult,
    stageResult,
    sourceResult,
    sortResult,
    orderResult,
    pageResult,
    limitResult,
  ];
  const firstError = results.find((result) => result.error);

  if (firstError) {
    return { error: firstError.error };
  }

  if (limitResult.value > maxApplicationListLimit) {
    return { error: `limit must be less than or equal to ${maxApplicationListLimit}` };
  }

  const sort = sortResult.value || 'updatedAt';
  const order = orderResult.value || 'desc';

  if (!applicationSortFields.has(sort)) {
    return { error: 'Sort must be appliedAt, stage, or updatedAt' };
  }

  if (!applicationSortOrders.has(order)) {
    return { error: 'Order must be asc or desc' };
  }

  if (stageResult.value && !applicationStages.has(stageResult.value)) {
    return { error: 'Stage must be APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, or REJECTED' };
  }

  const where = {};
  const search = searchResult.value;

  if (search) {
    where.OR = [
      {
        candidateName: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        candidateEmail: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  if (jobIdResult.value) {
    where.jobOpeningId = jobIdResult.value;
  }

  if (stageResult.value) {
    where.stage = stageResult.value;
  }

  if (sourceResult.value) {
    where.source = {
      equals: sourceResult.value,
      mode: 'insensitive',
    };
  }

  const page = pageResult.value;
  const limit = limitResult.value;
  const orderBy = [
    { [sort]: order },
    { id: 'asc' },
  ];

  return {
    where,
    orderBy,
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function buildApplicationListResponse(applications, page, limit, total) {
  return {
    data: applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
