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