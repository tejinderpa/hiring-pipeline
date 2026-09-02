# Schema

## User

| Column | Type | Notes |
| --- | --- | --- |
| `id` | String / UUID | Primary key |
| `email` | String | Unique login email |
| `passwordHash` | String | Bcrypt password hash, never returned by API responses |
| `role` | `Role` enum | `RECRUITER` or `INTERVIEWER` |
| `createdAt` | DateTime | Set when the user is created |
| `updatedAt` | DateTime | Updated automatically by Prisma |

Relationships:

- One `User` can be the actor for many `ApplicationEvent` rows through `ApplicationEvent.actorId`.
- One `User` can be assigned to many applications through `ApplicationInterviewer`.
- One interviewer `User` can leave many `Feedback` rows.

## JobOpening

| Column | Type | Notes |
| --- | --- | --- |
| `id` | String / UUID | Primary key |
| `title` | String | Required job title |
| `department` | String | Required department |
| `description` | String | Required job description |
| `status` | `JobStatus` enum | `OPEN` or `CLOSED` |
| `archivedAt` | DateTime? | Nullable archival marker |
| `createdAt` | DateTime | Set when the opening is created |
| `updatedAt` | DateTime | Updated automatically by Prisma |

Relationships:

- One `JobOpening` has many `Application` rows.
- Applications use `onDelete: Restrict`, so archiving or deleting an opening cannot accidentally remove its applications.

## Application

| Column | Type | Notes |
| --- | --- | --- |
| `id` | String / UUID | Primary key |
| `jobOpeningId` | String | Foreign key to `JobOpening` |
| `candidateName` | String | Required candidate name |
| `candidateEmail` | String | Required candidate email |
| `source` | String | Required source |
| `notes` | String? | Optional recruiter notes |
| `stage` | `ApplicationStage` enum | Current pipeline stage; defaults to `APPLIED` |
| `rejectedFromStage` | `ApplicationStage`? | Stores the exact stage a rejected candidate came from |
| `appliedAt` | DateTime | Set when the application is created |
| `updatedAt` | DateTime | Updated automatically by Prisma |

Relationships:

- Each `Application` belongs to exactly one `JobOpening`.
- One `Application` has many `ApplicationEvent` rows.
- One `Application` can have many interviewer assignments through `ApplicationInterviewer`.
- One `Application` can have many `Feedback` rows.

`Application.stage` is the current state only. The server owns stage changes through action endpoints, not generic PATCH. The normal advancement path is:

```text
APPLIED -> SCREENING -> INTERVIEW -> OFFER -> HIRED
```

`REJECTED` is outside that forward path. `rejectedFromStage` is deliberately stored so reinstatement is deterministic: a candidate rejected from `INTERVIEW` returns to `INTERVIEW`, not an assumed default like `APPLIED`.

## ApplicationInterviewer

| Column | Type | Notes |
| --- | --- | --- |
| `applicationId` | String | Foreign key to `Application` |
| `interviewerId` | String | Foreign key to `User` |
| `assignedAt` | DateTime | Set when the interviewer is assigned |

Relationships:

- Explicit many-to-many join between `Application` and interviewer `User` records.
- The composite primary key on `applicationId, interviewerId` prevents duplicate assignments.

`INTERVIEWER` role eligibility is enforced in application code, not as a database constraint, because it depends on the mutable `User.role` field and belongs with route/service authorization rules.

## Feedback

| Column | Type | Notes |
| --- | --- | --- |
| `id` | String / UUID | Primary key |
| `applicationId` | String | Foreign key to `Application` |
| `interviewerId` | String | Foreign key to `User` |
| `content` | String | Required immutable feedback text |
| `createdAt` | DateTime | Set when feedback is created |

Relationships:

- Each `Feedback` row belongs to exactly one `Application`.
- Each `Feedback` row belongs to exactly one interviewer `User`.
- One `Application` can have many feedback entries.
- One interviewer can leave feedback on many assigned applications.

## ApplicationEvent

| Column | Type | Notes |
| --- | --- | --- |
| `id` | String / UUID | Primary key |
| `applicationId` | String | Foreign key to `Application` |
| `type` | `ApplicationEventType` enum | What happened |
| `actorId` | String | Foreign key to the `User` who performed the action |
| `oldStage` | `ApplicationStage`? | Previous stage when relevant |
| `newStage` | `ApplicationStage`? | New stage when relevant |
| `metadata` | Json? | Optional event details for future features |
| `createdAt` | DateTime | Event timestamp |

Event types:

- `APPLICATION_CREATED`
- `STAGE_CHANGED`
- `REJECTED`
- `REINSTATED`
- `FEEDBACK_ADDED`

Relationships:

- Each `ApplicationEvent` belongs to exactly one `Application`.
- Each `ApplicationEvent` has one actor `User`.

Indexes:

- `Application.jobOpeningId` for fetching applications under a job.
- `ApplicationInterviewer.interviewerId` for fetching an interviewer's assigned applications.
- `Feedback.applicationId, createdAt` for chronological feedback reads.
- `Feedback.interviewerId` for interviewer feedback lookups.
- `ApplicationEvent.applicationId, createdAt` for chronological application timelines.
- `ApplicationEvent.actorId` for future actor-based audit queries.

No schema change was required for Requirements 6 and 7. Candidate search, filtering, sorting, pagination, bulk actions, and CSV export reuse the existing `Application`, `JobOpening`, and `ApplicationEvent` tables.

## Database vs Application Constraints

Database-level constraints:

- Primary keys, foreign keys, enum values, and required fields.
- `User.email` uniqueness.
- Referential integrity between jobs, applications, interviewer assignments, feedback, events, and users.
- Duplicate interviewer assignments are prevented by the `ApplicationInterviewer` composite primary key.

Application-level constraints:

- Authentication and recruiter-only authorization.
- Interviewer-only authorization and assignment checks for feedback.
- Enforcing that only users with role `INTERVIEWER` can be assigned to an application.
- Validating request body fields and email format.
- Preventing direct `stage` changes through generic application PATCH.
- Enforcing the legal pipeline transitions.
- Preserving `rejectedFromStage` on rejection and clearing it on reinstatement.
- Appending history events in the same transaction as application creation or stage mutation.
- Validating candidate-list query parameters, including pagination bounds and allowlisted sort fields.
- Deduplicating bulk action IDs while returning one result per unique requested application.
- Defining the CSV "open pipeline" export as non-rejected applications attached to non-archived `OPEN` job openings.

These pipeline rules stay in application code because they are workflow rules, not just data-shape rules. PostgreSQL can restrict values to enum members, but it should not own product-specific transition behavior like refusing `REJECTED -> SCREENING` unless a reinstatement action is used.

## Denormalisation

`Application.stage` is the current state, while `ApplicationEvent` stores the audit timeline. This duplicates stage information in a deliberate way: the current stage remains fast to read for lists and detail pages, while the event table preserves how the application reached that state.

`rejectedFromStage` is also deliberate. It is small duplication of historical state, but it makes reinstatement deterministic and avoids guessing from the event log during the write path.

## Query Patterns And Scaling Limitations

`GET /api/applications` now applies search, filters, sorting, offset pagination, and filtered counts in Prisma rather than loading all applications into memory. The current `Application.jobOpeningId` index helps job filtering. At 100x data, candidate search over `candidateName` and `candidateEmail`, source filtering, stage sorting/filtering, and updated-date ordering may need additional database indexes or a Postgres text-search strategy based on real usage.

The CSV export intentionally reads the full active pipeline because the assignment asks for a snapshot, not one UI page. At much larger scale this may need streaming CSV output instead of building the whole file in memory.

Job detail pages still load every application for one job, and history pages load every event for one application. Those reads should eventually add pagination if individual jobs or timelines become large.
