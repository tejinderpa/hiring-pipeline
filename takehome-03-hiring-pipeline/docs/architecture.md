# Architecture

## Moving pieces

The application is split into a React client, an Express API server, and a PostgreSQL database managed
through Prisma.

The React client handles the authenticated user interface. It stores the JWT returned by login and
sends it as a bearer token when calling protected API routes.

The Express server owns authentication, role authorization, validation, and all database writes. The
client may hide recruiter-only controls, but the server is still the enforcement layer.

Prisma is the data access layer between Express and PostgreSQL. The current domain tables are
`User`, `JobOpening`, and `Application`.

## Where each piece runs

- React runs in the browser through Vite during local development.
- Express runs locally as the backend API server.
- PostgreSQL runs in Supabase.
- Prisma Client runs inside the Express server process.

## Representative request path

```text
Recruiter clicks Add Candidate
-> ApplicationForm
-> POST /api/jobs/:jobId/applications
-> authenticate
-> requireRole('RECRUITER')
-> validate request fields
-> Prisma verifies the JobOpening exists
-> Application is inserted with the default APPLIED stage
-> API returns the created application
-> React refreshes the job detail page and applications list
```

## Deliberately not built yet

For the current stage of the project I have only built authentication, job opening management, and
basic application create/edit inside a job opening.

I have not built stage transitions, rejection/reinstatement, interviewer assignment, feedback,
history, alerts, bulk actions, candidate search, exports, or dashboard analytics yet. Those features
have more rules attached to them, so I am keeping them separate from the simpler job/application CRUD
foundation.
