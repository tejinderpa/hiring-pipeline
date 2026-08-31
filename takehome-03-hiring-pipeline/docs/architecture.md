# Architecture

## Moving Pieces

The application is split into a React client, an Express API server, and a PostgreSQL database managed through Prisma.

The React client handles the authenticated user interface. It stores the JWT returned by login and sends it as a bearer token when calling protected API routes.

The Express server owns authentication, role authorization, request validation, pipeline rules, and database writes. Client-side UI restrictions are useful for experience, but the server is the enforcement layer.

Prisma is the data access layer between Express and PostgreSQL. The current domain tables are `User`, `JobOpening`, `Application`, and `ApplicationEvent`.

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

## Pipeline Writes And History

Application creation and pipeline actions append `ApplicationEvent` rows. The application mutation and event insertion happen inside a Prisma transaction so the system does not successfully change application state and then fail to write the corresponding history event.

Current transactional operations:

- `POST /api/jobs/:jobId/applications`
- `POST /api/applications/:id/advance`
- `POST /api/applications/:id/reject`
- `POST /api/applications/:id/reinstate`

The transaction wait budget is configured on these application-history transactions because testing against the hosted Supabase database exposed occasional transaction start timeouts under repeated API verification.

## Representative Request Path

Recruiter advances a candidate from `SCREENING` to `INTERVIEW`:

```text
POST /api/applications/:id/advance
-> authenticate bearer JWT
-> requireRole('RECRUITER')
-> load the application inside a Prisma transaction
-> applicationPipeline maps SCREENING to INTERVIEW
-> update Application.stage to INTERVIEW
-> create ApplicationEvent:
   type = STAGE_CHANGED
   oldStage = SCREENING
   newStage = INTERVIEW
   actorId = authenticated recruiter id
-> commit transaction
-> return { application }
```

The request body is not allowed to choose the destination stage. A generic `PATCH /api/applications/:id` can edit candidate fields, but explicitly rejects `stage`.

## Timeline Reads

`GET /api/applications/:id/history` returns immutable events for one application ordered oldest-to-newest. Actor information is limited to safe display fields: `id`, `email`, and `role`. Password hashes are never selected for this response.

## Deliberately Not Built Yet

The backend does not yet include interviewer assignment, feedback submission, dashboard analytics, alerts, bulk operations, CSV export, or frontend timeline controls. `FEEDBACK_ADDED` exists in the event enum so the history model can support feedback later, but no feedback API was added for this step.
