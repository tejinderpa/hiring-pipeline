# AI prompts

The prompts you actually used, in the order you used them, grouped by what you were trying to achieve. For each significant one: what you asked, what you got back, and what you had to correct.

Include at least one prompt that produced something wrong, and what you did about it.

If you did not use AI at all, say so here, and describe your process instead.

## <What you were trying to achieve>

### Prompt

### What you got

### What you corrected


# 29 August : Starting the project with Global Prompt
## TechStack and Constraints
I'm building a take-home hiring pipeline assignment using:

Frontend:
- React
- Vite
- Tailwind CSS

Backend:
- Node.js
- Express

Database:
- PostgreSQL on Supabase
- Prisma ORM

Authentication:
- JWT
- bcrypt

This is a time-boxed hiring assessment, so I want to work incrementally and understand every change.

For this entire session, follow these rules:

1. Do not create, edit, move, or delete any files unless I explicitly ask you to implement a specific step.
2. If I ask you to analyse or plan something, give me analysis only. Do not start implementing it.
3. Before every implementation, first tell me:
   - which files you intend to create/change
   - what each change is for
4. Keep implementations limited to the exact feature I request.
5. Do not add unrelated libraries, abstractions, features, tests, UI pages, Docker, CI/CD, deployment configuration, refresh tokens, jobs, candidates, dashboards, or future assignment features unless I ask.
6. Prefer straightforward readable code over clever abstractions.
7. Do not modify README.md or the files under docs/ unless I explicitly ask.
8. Never put secrets or database credentials in source code.
9. After implementing something, explain:
   - what changed
   - how I can verify it
   - any trade-off I should understand
10. Stop after completing the requested step and wait for my next instruction.

For now, do not change anything.

Inspect the existing repository structure and tell me only:
- what files currently exist
- whether the provided assignment structure looks correct
- what you recommend doing as the first technical step.

## Starting Project Scaffolding

Create:

client/
- React application using Vite
- JavaScript, not TypeScript
- Tailwind CSS
- React Router

server/
- Node.js application
- Express
- dotenv
- cors

Do not add Prisma, authentication, database code, routes, business logic, or frontend pages yet.

Keep both applications minimal.

Before making changes, show me the files you intend to create or modify.

After implementation:
1. tell me how to run client and server separately
2. tell me how to verify both start successfully
3. stop there


## Configuring prisma
The frontend and Express backend are now running.

Next I only want to configure Prisma with my PostgreSQL database.

Requirements:

- Install and initialise Prisma in server/
- Configure Prisma to read DATABASE_URL from environment variables
- PostgreSQL is the database provider
- Do not create application models yet
- Do not implement authentication
- Do not create seed data
- Do not modify frontend files
- Do not modify README or docs

Before editing anything, tell me exactly which files will change.

After implementation, explain:
1. what Prisma generated
2. where the database URL comes from
3. how I can verify Prisma can communicate with the database

Stop after database connectivity is working.

## Add demo users
The User table exists.

I want a small development seed script containing exactly two demo accounts:

1. recruiter role
2. interviewer role

Passwords must be hashed with bcrypt before storage.

Requirements:

- use understandable demo names/emails
- no plaintext password should be stored in the database
- seed should be safe to run more than once without creating duplicate users
- do not add login functionality yet
- do not touch frontend
- do not create any other data

Before editing, tell me which files you will change.

After implementation, tell me:
- how the seed works
- why repeated runs don't duplicate users
- how to execute it

## Work on authentication
Next I want to implement email/password login.

Do not change any files yet.

Design the simplest authentication flow suitable for this take-home application using:

- Express
- Prisma
- bcrypt
- JWT

Required endpoints for now:

POST /api/auth/login
GET /api/auth/me

I do not need:
- signup
- forgot password
- email verification
- OAuth
- refresh tokens
- logout API

Explain the flow from login request to authenticated request.

Also explain:
- what should go inside the JWT
- what should NOT go inside the JWT
- what errors login should return
- what GET /api/auth/me should do

Keep the design appropriate for a roughly 12-hour assessment rather than a production identity platform.

Do not implement anything.

## Implementing Login
Let's implement only POST /api/auth/login now.

Requirements:

Request:
{
  "email": "...",
  "password": "..."
}

Behaviour:
1. Find user by email using Prisma.
2. Verify password using bcrypt.
3. If credentials are invalid, return a clear authentication error without revealing whether the email or password was wrong.
4. Generate a signed JWT containing only the minimum identity information needed.
5. Return the token and a safe user object.
6. Never return passwordHash.
7. JWT secret must come from environment variables.

Keep controller/business logic separated enough to remain readable, but don't create unnecessary architecture for one endpoint.

Do not implement GET /api/auth/me yet.
Do not implement role authorization yet.
Do not touch frontend.

Before editing, tell me the exact files that will change.

After implementation:
- explain the request flow
- give me one successful request example
- give me one invalid credential example
- tell me how to test both


## Implementing Middleware for authentication
POST /api/auth/login is working.

Now implement reusable authentication middleware and GET /api/auth/me.

Requirements:

Authentication middleware should:

1. Read a Bearer token from the Authorization header.
2. Verify the JWT using the environment JWT secret.
3. Reject missing, malformed or invalid tokens.
4. Make the authenticated user's identity available to downstream handlers.

GET /api/auth/me should:

1. require authentication
2. return the currently authenticated user
3. never expose passwordHash

Keep error responses consistent with the login endpoint.

Do not implement role authorization yet.
Do not touch frontend yet.

Before implementation, list the files you will modify.

Afterward show me exactly how to verify:

- valid token
- no token
- invalid token


# 30 August : Working on Job openings section
## Thinking about Schema
Let's design today's database models before editing anything.

Do not modify files.

I currently need two new models:

JobOpening

Required concepts:
- id
- title
- department
- description
- status
- archivedAt
- createdAt
- updatedAt

Application

Required concepts:
- id
- jobOpeningId
- candidateName
- candidateEmail
- source
- notes
- stage
- appliedAt
- updatedAt

Requirements:

- one JobOpening has many Applications
- each Application belongs to exactly one JobOpening
- archiving a JobOpening must never delete its Applications
- applications should start at APPLIED
- I am NOT implementing stage transitions today

Please recommend:

1. exact Prisma field types
2. JobOpening status representation
3. Application stage representation
4. nullable versus required fields
5. relationship and foreign-key behavior
6. useful indexes or constraints that are genuinely justified today

Also specifically explain:

- why archivedAt is preferable to isDeleted here
- whether OPEN/CLOSED should be separate from archived state
- whether candidate email should be globally unique, unique per job, or not unique at all
- whether notes should be optional

Do not implement anything.

## Designing Job Opening API
The database models are working.

Now help me design only the Job Opening API.

Do not edit files.

I need these recruiter-only operations:

POST   /api/jobs
GET    /api/jobs
GET    /api/jobs/:id
PATCH  /api/jobs/:id

POST   /api/jobs/:id/archive
POST   /api/jobs/:id/restore

Requirements:

- every endpoint requires authentication
- only recruiters can manage job openings
- GET /api/jobs should hide archived openings by default
- there still needs to be a straightforward way for the frontend to request archived openings so recruiters can restore them
- GET /api/jobs/:id should return one opening
- PATCH should edit normal opening fields
- archive and restore should be explicit operations rather than arbitrary archivedAt changes from PATCH
- applications must never be deleted by archive

Recommend:
1. request/response shapes
2. validation rules
3. status codes
4. error cases
5. how archived records should be requested

Keep the API simple.

Do not implement anything.

## Implementing Applications API
Implement today's Application API.

Required functionality:

POST /api/jobs/:jobId/applications
PATCH /api/applications/:id

And use the read approach we just selected so opening a job can show its applications.

Rules:

1. All routes require authentication.
2. Application creation/editing is recruiter-only.
3. Creating an application requires a valid JobOpening.
4. Clients may provide only:
   - candidateName
   - candidateEmail
   - source
   - notes
5. New applications automatically start at APPLIED.
6. Clients must NOT be able to provide stage during creation.
7. PATCH must NOT permit changing stage.
8. PATCH must NOT permit changing jobOpeningId.
9. Do not implement stage advancement.
10. Do not implement rejection or reinstatement.
11. Do not implement interviewer assignments.
12. Do not create application history yet.

Reuse the existing error-response style and auth middleware.

Before editing:
- list the exact files that will change

After implementation show me how to verify:
- application creation
- application appears under the correct job
- application update
- invalid job id
- interviewer receives 403
- unauthenticated request receives 401
- attempts to manipulate stage are refused or ignored according to the API design

## Adding 2 to 3 Application per opening 
I want enough development seed data to make today's frontend meaningful.

Do not modify anything yet.

Recommend a very small realistic dataset containing:
- 3 job openings across different departments
- a mix of OPEN and CLOSED status
- several applications across the openings
- realistic but obviously fictional candidate details

Do not create historical events, interviewer assignments, rejected candidates or future-stage behaviour.

Tell me first how you would integrate this with the existing seed script without breaking the two demo authentication users.

## Designing Frontend for Job Openings
Design the Job Openings page for an internal B2B hiring pipeline application.

Use the same visual style as the existing application:
- professional
- clean
- light theme
- restrained B2B SaaS styling
- desktop-first
- consistent sidebar/navigation

Page title:
Job Openings

Purpose:
A recruiter uses this page to manage positions currently being hired for.

Primary action:
Create Job Opening

Each job should clearly show:
- title
- department
- OPEN or CLOSED status
- number of applications
- last updated date

Useful actions:
- Open
- Edit
- Archive

Default page should show non-archived openings.

Include a simple way to switch to or view Archived openings so recruiters can restore them.

Archived rows should provide:
- View
- Restore

Create/edit should use a clean form or modal containing:
- title
- department
- description
- status

Do not include:
- pipeline board
- interviewer assignments
- dashboard charts
- candidate search
- bulk actions
- alerts
- fake analytics

Focus only on managing job openings.

## Routes /jobs and /jobs/:id
see if something left : Implement the recruiter Job Openings page at /jobs.
Functional requirements:
- fetch non-archived jobs from the real backend
- display loading state
- display error state
- display useful empty state
- create opening
- edit opening
- archive opening
- switch/view archived openings
- restore archived opening
- navigate to /jobs/:id when opening a job
Use the existing authenticated API/token handling.
The UI should respect recruiter access, but remember that actual authorization already exists on the server.
Do not implement applications on this step.
Do not build candidate search.
Do not create dashboard functionality.
Before editing:
- list files being changed
After implementation:
- explain data flow
- tell me exactly what browser actions I should test   
  The Job Openings page works.
  Now implement /jobs/:id.
  Requirements:
  Opening header:
  - title
  - department
  - description
  - OPEN/CLOSED status
  - edit action
  - archive action
  Applications section:
  - candidate name
  - email
  - source
  - current stage
  - applied date
  - edit action
  Actions:
  - Add Candidate
  - Edit Candidate
  Add/Edit Candidate fields:
  - candidateName
  - candidateEmail
  - source
  - notes
  Important:
  - stage is display-only
  - do not add advance controls
  - do not add reject controls
  - do not add interviewer controls
  - do not add timeline
  - do not add bulk selection
  Use real backend data.
  Add:
  - loading state
  - job-not-found state
  - no-applications empty state
  - API error handling
  Before editing list all files being changed.
  After implementation explain:
  1. page load data flow
  2. create application data flow
  3. edit application data flow
  4. how the frontend prevents stage editing
  5. why the server is still the real enforcement layer

# 1 September : Requirement 5 interviewer panel and feedback

## Interviewer assignment schema
Asked to add the database foundation for `ApplicationInterviewer` and `Feedback`, using an explicit join model with `assignedAt`, duplicate assignment prevention, and foreign keys to `Application` and `User`.

Implemented the Prisma models and migration, kept role validation out of the database schema, inspected the existing `ApplicationEvent` timeline model, and left feedback timeline wiring for the next step.

## Interviewer assignment API
Asked to implement recruiter-only assignment/removal endpoints and an interviewer-only `GET /interviewer/applications` endpoint. The important security requirement was that the interviewer list must be scoped by the authenticated JWT user, not by client input.

Implemented `POST /api/applications/:id/interviewers`, `DELETE /api/applications/:id/interviewers/:userId`, and `GET /api/interviewer/applications`, then verified role checks, duplicate assignment handling, and database-level list scoping with live API checks.

## Interviewer feedback API and timeline
Asked to implement `POST /api/applications/:id/feedback`, require an assigned interviewer, derive `interviewerId` from the authenticated user, create `Feedback`, and append a `FEEDBACK_ADDED` timeline event.

Implemented the feedback route using the existing auth middleware, `ApplicationInterviewer` assignment lookup, `Feedback` table, and `ApplicationEvent` timeline. Kept feedback immutable by adding no edit or delete routes.

# 2 September : Requirements 6 and 7

## Server-side candidate search and pagination

### Prompt

Asked Codex to implement only the backend `GET /api/applications` endpoint for recruiters. The endpoint needed server-side text search over candidate name/email, optional `jobId`, `stage`, and `source` filters, allowlisted sorting by `appliedAt`, `stage`, or `updatedAt`, positive bounded pagination, filtered totals, recruiter-only authorization, and no frontend changes.

### What Codex produced

Codex inspected the Prisma schema, existing application routes, auth middleware, interviewer route, job routes, and frontend list pages. It added `server/src/applicationListQuery.js`, wired `GET /api/applications` into `server/src/applications.js`, and added Node tests for query building and pagination metadata.

### What you corrected

No behavior correction was needed for the endpoint. The test command initially failed in PowerShell because `npm.ps1` was blocked by the local execution policy, so verification switched to `npm.cmd test`.

## Frontend recruiter candidate search page

### Prompt

Asked Codex to implement the recruiter-facing candidate list for Requirement 6, using `GET /api/applications` and relying on the server for search, filters, sorting, and pagination. The page needed search, job/stage/source filters, sort controls, pagination controls, URL query state where practical, loading/empty/error states, and recruiter-only access.

### What Codex produced

Codex added `client/src/pages/CandidatesPage.jsx` and connected `/candidates` in `client/src/App.jsx`. The page stores only the current returned API page, syncs query controls through `useSearchParams`, debounces text search/source input, and renders pagination metadata from the server.

### What you corrected

The initial source filter input updated the URL immediately on every keystroke. Codex corrected it to use the same debounce pattern as the search box. Codex also adjusted the recruiter-only route placeholder so an interviewer manually visiting `/candidates` sees a candidate-specific access message instead of a job-openings message.

## Backend bulk actions

### Prompt

Asked Codex to implement the backend portion of Requirement 7: `POST /api/applications/bulk/advance` and `POST /api/applications/bulk/reject`, recruiter-only, request-level validation for `applicationIds`, duplicate ID handling, independent per-candidate success/failure results, and reuse of the single-candidate transition rules and timeline behavior.

### What Codex produced

Codex added `server/src/applicationBulkActions.js`, added bulk routes to `server/src/applications.js`, and added tests for validation, duplicate deduplication, every forward transition, hired/rejected failures, nonexistent IDs, already rejected behavior, and partial-success semantics.

### What you corrected

After extracting the bulk helper into `applicationBulkActions.js`, a duplicate local helper remained in `applications.js`. Codex caught it during the diff scan and removed the duplicate so the router uses the tested helper implementation.

## CSV export and frontend bulk actions

### Prompt

Asked Codex to finish Requirement 7 with recruiter frontend bulk selection/actions, `GET /api/applications/export`, and authenticated CSV download. The export needed to be recruiter-only, represent the open pipeline snapshot rather than the current page, include current stage, escape commas/quotes/line breaks, and avoid using a plain anchor because authentication uses bearer tokens.

### What Codex produced

Codex added `server/src/applicationExport.js`, `server/src/applicationExport.test.js`, and `GET /api/applications/export`. It updated `client/src/pages/CandidatesPage.jsx` with current-page selection, select-all-current-page, clear selection, advance/reject selected, partial-success summaries with backend reasons, reject confirmation, in-flight duplicate-submit guards, and authenticated Blob CSV download.

### What you corrected

During verification, Codex noticed that browser `fetch` could not reliably read the server's `Content-Disposition` filename across origins unless CORS exposed that response header. It updated `server/src/index.js` to expose `Content-Disposition` and re-verified the export headers.

## Requirement 6/7 audit and documentation

### Prompt

Asked Codex to audit Requirements 6 and 7 for server-side querying, RBAC, performance issues, bulk partial success, timeline consistency, CSV correctness, and to update the repository documentation with the decisions actually made during this phase.

### What Codex produced

Codex reviewed the implementation, found no feature defects, and updated `docs/architecture.md`, `docs/schema.md`, `docs/plan.md`, `docs/decisions.md`, and this prompt log.

### What you corrected

No additional implementation correction was made during this audit pass before documentation updates.
