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

`Application.stage` is the current state only. The server owns stage changes through action endpoints, not generic PATCH. The normal advancement path is:

```text
APPLIED -> SCREENING -> INTERVIEW -> OFFER -> HIRED
```

`REJECTED` is outside that forward path. `rejectedFromStage` is deliberately stored so reinstatement is deterministic: a candidate rejected from `INTERVIEW` returns to `INTERVIEW`, not an assumed default like `APPLIED`.

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
- `ApplicationEvent.applicationId, createdAt` for chronological application timelines.
- `ApplicationEvent.actorId` for future actor-based audit queries.

## Database vs Application Constraints

Database-level constraints:

- Primary keys, foreign keys, enum values, and required fields.
- `User.email` uniqueness.
- Referential integrity between jobs, applications, events, and actor users.

Application-level constraints:

- Authentication and recruiter-only authorization.
- Validating request body fields and email format.
- Preventing direct `stage` changes through generic application PATCH.
- Enforcing the legal pipeline transitions.
- Preserving `rejectedFromStage` on rejection and clearing it on reinstatement.
- Appending history events in the same transaction as application creation or stage mutation.

These pipeline rules stay in application code because they are workflow rules, not just data-shape rules. PostgreSQL can restrict values to enum members, but it should not own product-specific transition behavior like refusing `REJECTED -> SCREENING` unless a reinstatement action is used.

## Denormalisation

`Application.stage` is the current state, while `ApplicationEvent` stores the audit timeline. This duplicates stage information in a deliberate way: the current stage remains fast to read for lists and detail pages, while the event table preserves how the application reached that state.

`rejectedFromStage` is also deliberate. It is small duplication of historical state, but it makes reinstatement deterministic and avoids guessing from the event log during the write path.

## Scaling Limitations

The current indexes support the main expected reads, but list endpoints do not yet implement pagination or search. At 100x data, the first pressure points would likely be job detail pages that load every application for a job and history pages that load every event for an application. Those should eventually add pagination, filtering, and possibly additional indexes based on the real query patterns.
