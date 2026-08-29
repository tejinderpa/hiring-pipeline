# Plan

## Session 1 - August 29

### Planned

- Repository setup
- React/Express scaffolding
- PostgreSQL + Prisma configuration
- User model and demo users
- Email/password login
- JWT authentication
- recruiter/interviewer authorization
- basic login interface
- authenticated frontend shell

### Why I started here

Authentication and authorization affect almost every later feature. In particular, the
assignment requires interviewers to have more restricted access than recruiters, and that
restriction has to be enforced on the server. Establishing the identity and authorization
layer first gives later job and application APIs a consistent security foundation.

I also wanted the frontend and backend to be runnable early. A minimal React client,
Express server, Prisma setup, seeded users, and login flow give the rest of the project a
working base instead of leaving authentication as a risky final integration step.

### Estimated

About 2 hours.

### Actual

This took longer than the estimate. The basic React and Express scaffolding was quick, but
Prisma and Supabase connectivity needed extra time. The direct Supabase database hostname
did not work from my local environment, so I verified the failure and switched to the
Supabase Session Pooler connection string.

The authentication work also took extra time because I implemented and verified the flow in
small steps:

- created the `User` model
- added two seeded demo users with bcrypt password hashes
- implemented `POST /api/auth/login`
- added `GET /api/auth/me`
- added reusable authentication middleware
- added reusable role authorization middleware
- added temporary protected demo endpoints to verify recruiter/interviewer access
- connected the React login flow to the real API
- added a basic authenticated application shell

The total session was closer to a half day than 2 hours once verification and UI polish were
included.

### Deferred / cut

I intentionally deferred anything that was not needed to prove the authentication and layout
foundation:

- signup
- forgot password
- email verification
- OAuth
- refresh tokens
- logout API on the server
- production-grade session management
- job opening APIs
- candidate APIs
- application tracking
- interviewer assignment workflows
- alerts implementation
- dashboard statistics or charts
- role-specific business pages
- deployment, Docker, and CI/CD

The only role-specific backend routes added so far are temporary verification endpoints.
They exist to confirm server-side authorization and should be replaced later by real
business routes.
