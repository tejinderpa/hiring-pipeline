export const maxBulkApplicationIds = 100;

const applicationBulkActionFields = new Set(['applicationIds']);

function hasUnknownFields(body, allowedFields) {
  return Object.keys(body).some((field) => !allowedFields.has(field));
}

export function buildBulkApplicationActionResponse(results) {
  return { results };
}

export function buildBulkApplicationIds(body) {
  if (hasUnknownFields(body, applicationBulkActionFields)) {
    return { error: 'Only applicationIds is allowed' };
  }

  if (!Object.hasOwn(body, 'applicationIds')) {
    return { error: 'applicationIds is required' };
  }

  if (!Array.isArray(body.applicationIds)) {
    return { error: 'applicationIds must be an array' };
  }

  if (body.applicationIds.length === 0) {
    return { error: 'applicationIds must contain at least one id' };
  }

  if (body.applicationIds.length > maxBulkApplicationIds) {
    return { error: `applicationIds cannot contain more than ${maxBulkApplicationIds} ids` };
  }

  const applicationIds = [];
  const seenApplicationIds = new Set();

  for (const applicationId of body.applicationIds) {
    if (typeof applicationId !== 'string' || !applicationId.trim()) {
      return { error: 'applicationIds must contain only non-empty strings' };
    }

    const trimmedApplicationId = applicationId.trim();

    if (!seenApplicationIds.has(trimmedApplicationId)) {
      applicationIds.push(trimmedApplicationId);
      seenApplicationIds.add(trimmedApplicationId);
    }
  }

  return { applicationIds };
}

export async function bulkUpdateApplicationsWithEvents({
  prisma,
  applicationIds,
  actorId,
  buildTransition,
  updateApplicationWithEvent,
}) {
  const applications = await prisma.application.findMany({
    where: {
      id: {
        in: applicationIds,
      },
    },
  });
  const applicationsById = new Map(applications.map((application) => [application.id, application]));
  const results = [];

  for (const applicationId of applicationIds) {
    if (!applicationsById.has(applicationId)) {
      results.push({
        applicationId,
        success: false,
        reason: 'Application not found',
      });
      continue;
    }

    const result = await updateApplicationWithEvent(
      applicationId,
      actorId,
      buildTransition,
    );

    if (result.error) {
      results.push({
        applicationId,
        success: false,
        reason: result.error,
      });
      continue;
    }

    results.push({
      applicationId,
      success: true,
      from: result.from,
      to: result.to,
    });
  }

  return results;
}
