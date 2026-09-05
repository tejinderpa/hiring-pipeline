# Decisions

Log the decisions that actually shaped this codebase - the ones where a real alternative existed and
you picked one. At least five entries. For each: what you chose, what you rejected, and why. At least
one entry must be a decision you later reversed - say what changed your mind. It can be any entry
below, not necessarily the last one; add a **Later reversed:** line to whichever one it is.

## Decision 1 - Choosing PostgreSQL over MongoDB

Chose:
PostgreSQL with Prisma.

Rejected:
MongoDB/Mongoose.

Why:
The domain has several relational structures ahead - applications belong to jobs,
interviewer assignments will be many-to-many, and application history will reference
users and applications. I am also comfortable enough with Prisma that this does not
introduce significant learning overhead.

## Decision 2 - Supabase database connection strategy

Chose:
Initially used Supabase's direct PostgreSQL connection with Prisma.

Rejected:
Using the Supabase connection pooler from the beginning.

Why:
The direct connection was the simplest option and seemed appropriate for local
development, so I tried it first rather than adding another connection layer unnecessarily.

Later reversed:
Prisma schema validation succeeded, but an actual database connectivity check failed
with `P1001`. A separate network test showed that the Supabase direct database hostname
was not resolving from my local environment. Instead of changing the Prisma setup or
creating database models prematurely, I switched to Supabase's Session Pooler connection
string and kept the application configuration unchanged apart from `DATABASE_URL`.

## Decision 3 - Seed demo users instead of signup

Chose:
Seed demo users and provide login only.

Rejected:
Public registration/signup.

Why:
Account creation is outside the stated assignment requirements. Adding signup would
consume implementation and validation time without contributing to the core hiring
pipeline workflow.

## Decision 4 - Bearer JWT for assessment scope

Chose:
Bearer JWT stored client-side for simplicity.

Rejected:
Full httpOnly cookie plus refresh-token architecture.

Why:
The assignment has a constrained 12-hour budget and does not require a production
identity system. A production version would strengthen token storage against XSS and
add refresh token rotation.

## Decision 5 - Separate authentication from role authorization

Chose:
Use one middleware to authenticate the request and another reusable middleware to
check roles.

Rejected:
Combining token verification and role checks into route handlers.

Why:
Authentication answers who the user is, while authorization answers whether that user
can access a route. Keeping them separate makes future recruiter-only and
interviewer-only routes easier to read and maintain.


## Decision 6 model archiving with archivedAt

Chose:
Keep OPEN/CLOSED as the business status and represent archival separately
through archivedAt.

Rejected:
Hard deleting openings or treating ARCHIVED as the same type of state as
OPEN/CLOSED.

Why:
Closing a job and removing it from the recruiter's default working set are
different actions. More importantly, the assignment requires archived jobs
to retain their applications and be restorable. archivedAt preserves the
record and also tells us when it was archived.

## Decision 7 - Action endpoints instead of arbitrary stage PATCH

Chose:
Dedicated pipeline endpoints: `advance`, `reject`, and `reinstate`.

Rejected:
Allowing clients to send arbitrary `stage` values through generic application PATCH.

Why:
Stage changes are business actions, not ordinary field edits. The server needs to own the legal transition, preserve rejection state, and write an immutable history event for each state change.

## Decision 8 - Centralized next-stage map

Chose:
Put the forward pipeline rule in one domain helper with a simple map:
`APPLIED -> SCREENING -> INTERVIEW -> OFFER -> HIRED`.

Rejected:
Repeating transition conditionals inside each route handler.

Why:
The allowed forward path is small but important. Keeping it centralized makes it easier to audit and prevents one route from drifting from another.

## Decision 9 - Store rejectedFromStage on Application

Chose:
Store the stage a candidate was rejected from in `Application.rejectedFromStage`.

Rejected:
Always reinstating candidates to `APPLIED`, or deriving the previous stage from history during reinstatement.

Why:
The assignment requires reinstatement to return to the exact previous stage. Storing that value makes the write path deterministic and fails safely if the value is unexpectedly missing.

## Decision 10 - Append-only ApplicationEvent history

Chose:
Use an `ApplicationEvent` table for creation, stage changes, rejection, reinstatement, and future feedback events.

Rejected:
Mutable history fields on `Application`, or update/delete APIs for history rows.

Why:
Application history is audit data. Appending events preserves what happened over time and avoids allowing users to rewrite the timeline through the public API.

## Decision 11 - State mutation and event insertion in one transaction

Chose:
Wrap application creation or stage mutation together with event creation in a Prisma transaction.

Rejected:
Updating the application first and creating the event in a separate follow-up query.

Why:
Those operations must succeed or fail together. Testing against the hosted database also showed that the transaction start wait needed to be more tolerant of remote pool latency, so the application-history transactions now use an explicit wait budget.

## Decision 12 - Explicit interviewer assignment join model

Chose:
Model interviewer panels with an explicit `ApplicationInterviewer` join table.

Rejected:
Prisma's implicit many-to-many relationship between `Application` and `User`.

Why:
The assignment needs `assignedAt` as relationship metadata, and the explicit model gives clear database constraints plus straightforward authorization queries for "is this interviewer assigned to this application?"

## Decision 13 - Server-side candidate listing

Chose:
Use `GET /api/applications` with Prisma `where`, `orderBy`, `skip`, `take`, and a matching filtered `count`.

Rejected:
Fetching all applications into React and using client-side filtering, sorting, or slicing.

Why:
Requirement 6 explicitly requires the database to perform search, filtering, sorting, pagination, and total counts. Server-side querying also preserves authorization boundaries because interviewers never receive recruiter-wide application data.

## Decision 14 - Allowlisted sort fields

Chose:
Accept only `appliedAt`, `stage`, and `updatedAt`, and only `asc` or `desc`.

Rejected:
Passing arbitrary query parameter values directly into Prisma `orderBy`.

Why:
The UI needs only three sort choices, and an allowlist prevents users from driving unexpected Prisma query shapes.

## Decision 15 - Per-application bulk transactions

Chose:
For bulk advance/reject, fetch requested applications once, then process each candidate through the same per-application transaction helper used by single actions.

Rejected:
One all-or-nothing transaction for the whole batch.

Why:
Requirement 7 requires partial success. A valid candidate should remain advanced or rejected even if another selected candidate is missing, already hired, or already rejected. The per-application transaction still keeps each successful application state change and timeline event atomic.

## Decision 16 - Current-page bulk selection

Chose:
The candidate page's select-all checkbox selects only the currently loaded server page.

Rejected:
Implicitly selecting every candidate matching the current search across all pages.

Why:
Current-page selection is safer and easier to explain. It also matches the frontend data model: the browser only knows the current page returned by `GET /api/applications`.

## Decision 17 - Authenticated Blob CSV download

Chose:
Download CSV with authenticated `fetch`, convert the response to a Blob, create an object URL, and trigger a temporary download link.

Rejected:
A plain anchor tag to `/api/applications/export`.

Why:
Authentication uses bearer tokens in the `Authorization` header. A plain anchor would not include that header, so it would fail or encourage weakening the backend auth model.

## Decision 18 - Full active-pipeline CSV export

Chose:
Export non-rejected applications attached to non-archived `OPEN` job openings.

Rejected:
Exporting only the current UI page or adding a new application status field.

Why:
The assignment asks for a pipeline snapshot, not a paginated page export. The existing schema already has job `status`, job `archivedAt`, and application `stage`, which are enough to define the active pipeline for this implementation.

## Decision 19 - Stage-scoped stalled alert dismissals

Chose:
Stage-scoped `AlertDismissal` records keyed by `applicationId` and `stage`.

Rejected:
A global `alertDismissed` boolean on `Application`.

Why:
A global boolean would permanently suppress future stalled alerts for that application. Stage-scoped dismissal lets a recruiter dismiss a `SCREENING` alert, then see a new alert later if the same candidate advances to `INTERVIEW` and stalls there.

## Decision 20 - Compute stalled alerts on request

Chose:
Compute stalled alerts from `Application.stageEnteredAt`, current application stage, current time, and `AlertDismissal` rows when `/api/alerts/stalled` is requested.

Rejected:
A cron job and persistent generated `Alert` table.

Why:
Stalled status is derived from current state. Persisting generated alerts would create another source of truth that must be synchronized whenever a candidate advances, is rejected, is reinstated, or has an alert dismissed. For the take-home scope, computed alerts are simpler and less error-prone.
