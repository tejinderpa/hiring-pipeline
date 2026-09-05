# Architecture

## Moving Pieces

The application is split into a React client, an Express API server, and a PostgreSQL database managed through Prisma.

The React client handles the authenticated user interface. It stores the JWT returned by login and sends it as a bearer token when calling protected API routes.

The Express server owns authentication, role authorization, request validation, pipeline rules, and database writes. Client-side UI restrictions are useful for experience, but the server is the enforcement layer.

Prisma is the data access layer between Express and PostgreSQL. The current domain tables are `User`, `JobOpening`, `Application`, `AlertDismissal`, `ApplicationInterviewer`, `Feedback`, and `ApplicationEvent`.

## Backend Shape

Routes stay thin and use the existing middleware pattern:

```text
request
-> authenticate
-> requireRole('RECRUITER')
-> route-level request validation
-> domain/helper logic where pipeline rules are needed
-> Prisma write/read
-> JSON response
```

Pipeline decisions live in `server/src/applicationPipeline.js`. That module owns the legal next-stage map, rejection behavior, reinstatement behavior, and event payload construction. The route handlers call it rather than scattering transition conditionals across controllers.

Candidate search/list query parsing lives in `server/src/applicationListQuery.js`. The recruiter-wide candidate list builds a Prisma `where`, `orderBy`, `skip`, and `take` from allowlisted query parameters, then fetches the page and matching count together. The React candidate page only stores the current page returned by `GET /api/applications`; search, filtering, sorting, and pagination are not reimplemented in the browser.

Bulk application request validation and result shaping live in `server/src/applicationBulkActions.js`. Bulk advance/reject routes reuse the same single-application transition builders as the individual endpoints, so the batch actions cannot skip stages or drift from the normal pipeline state machine.

Dashboard metric definitions live in `server/src/dashboardMetrics.js` and are exposed through recruiter-only `GET /api/dashboard`. Active applications are applications whose current stage is not terminal: `HIRED` and `REJECTED` are excluded. Calendar week and month boundaries are computed in UTC so the API has stable behavior regardless of the server's local timezone.

Stalled application alert rules live in `server/src/stalledAlerts.js` and are exposed through recruiter-only `/api/alerts/stalled` routes. Alerts are computed from the current `Application.stageEnteredAt` value and existing `AlertDismissal` rows when requested; the app does not persist alert records or run a cron job.

## Pipeline Writes And History

Application creation and pipeline actions append `ApplicationEvent` rows. The application mutation and event insertion happen inside a Prisma transaction so the system does not successfully change application state and then fail to write the corresponding history event.

Current transactional operations:

- `POST /api/jobs/:jobId/applications`
- `POST /api/applications/:id/advance`
- `POST /api/applications/:id/reject`
- `POST /api/applications/:id/reinstate`
- successful per-application mutations inside `POST /api/applications/bulk/advance`
- successful per-application mutations inside `POST /api/applications/bulk/reject`

The transaction wait budget is configured on these application-history transactions because testing against the hosted Supabase database exposed occasional transaction start timeouts under repeated API verification.

Bulk actions deliberately do not wrap the whole batch in one transaction. Each candidate is evaluated independently, and each successful candidate uses the same per-application transaction as the single action. This preserves partial success: one invalid or missing application does not roll back valid candidates already processed.

## Candidate List And Export

Recruiters use `GET /api/applications` for the global candidate list. Supported query parameters are `search`, `jobId`, `stage`, `source`, `sort`, `order`, `page`, and `limit`. Sort fields and directions are allowlisted before being passed to Prisma.

Recruiters use `GET /api/applications/export` to download a CSV snapshot of the active pipeline. In this codebase, "open pipeline" means applications that:

- are not in `REJECTED`
- belong to a job opening with `status = OPEN`
- belong to a job opening where `archivedAt` is `null`

The export is intentionally not limited to the current UI page. It is protected by the same recruiter-only application router middleware. The client downloads it with authenticated `fetch`, reads the response as a Blob, and uses the `Content-Disposition` filename exposed through CORS.

## Representative Request Path

Recruiter advances a candidate from `SCREENING` to `INTERVIEW`:

```text
POST /api/applications/:id/advance
-> authenticate bearer JWT
-> requireRole('RECRUITER')
-> load the application inside a Prisma transaction
-> applicationPipeline maps SCREENING to INTERVIEW
-> update Application.stage to INTERVIEW
-> update Application.stageEnteredAt to the transition time
-> create ApplicationEvent:
   type = STAGE_CHANGED
   oldStage = SCREENING
   newStage = INTERVIEW
   actorId = authenticated recruiter id
-> commit transaction
-> return { application }
```

The request body is not allowed to choose the destination stage. A generic `PATCH /api/applications/:id` can edit candidate fields, but explicitly rejects `stage`.

## Dashboard Request Path

Recruiter opens the dashboard:

```text
GET /api/dashboard
-> authenticate bearer JWT
-> requireRole('RECRUITER')
-> compute UTC week, month, and 13-week reporting boundaries
-> count open, unarchived job openings
-> count active applications, excluding HIRED and REJECTED
-> count applications with interviewScheduledAt in the current UTC week
-> count applications currently in HIRED with stageEnteredAt in the current UTC month
-> aggregate current applications by stage in the database
-> read job openings with application counts in one query
-> read appliedAt values inside the last-quarter reporting window
-> return frontend-ready metric arrays, including zero-count weeks
```

## Timeline Reads

`GET /api/applications/:id/history` returns immutable events for one application ordered oldest-to-newest. Actor information is limited to safe display fields: `id`, `email`, and `role`. Password hashes are never selected for this response.

## Dashboard And Alerts

`GET /api/dashboard` returns recruiter-wide counts for open positions, active applications, interviews scheduled this week, hires this month, applications by stage, applications by job, and applications received per week for the latest 13 UTC calendar weeks.

`GET /api/alerts/stalled` returns non-terminal applications where `stageEnteredAt` is more than 10 days old and no dismissal exists for the application's current `(applicationId, stage)` pair.

`POST /api/alerts/stalled/:applicationId/dismiss` loads the current application, verifies that it is still stalled, and upserts an `AlertDismissal` for the current stage only. The client cannot choose the dismissal stage.

Stalled alerts are computed on request rather than stored as generated `Alert` rows because stalled state is derived data: it follows directly from the application's current `stage`, its `stageEnteredAt` timestamp, the current time, and any stage-scoped dismissal. A cron job would add operational complexity and create a second source of truth that could drift when an application advances, is rejected, is reinstated, or has a dismissal recorded.

## Deliberately Not Built Yet

The application does not yet include frontend timeline controls or filtering the CSV export by the current candidate-list query. Bulk selection/export are implemented only on the recruiter candidate list; there is no interviewer bulk UI.
