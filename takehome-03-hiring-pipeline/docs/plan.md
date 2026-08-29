# Plan

This project was planned as a time-boxed hiring assessment, so I split the work into small sessions and tried to keep each step understandable before moving to the next one. I used AI to plan and implement incrementally, but only after asking for the files that would change and the reason for each change.

## How I broke the work into sessions

### Session 1 - Repository inspection and setup direction

I started by asking the AI to inspect the repository structure without changing files. The goal was to understand what already existed, whether the assignment structure looked correct, and what the first technical step should be.

This helped set the rule that the project should be built incrementally instead of jumping directly into application features.

### Session 2 - Minimal client and server scaffolding

Next, I created the base application structure:

- `client/` with React, Vite, Tailwind CSS, and React Router
- `server/` with Node.js, Express, dotenv, and cors

I intentionally kept both apps minimal. At this stage I did not add Prisma, authentication, database models, routes, frontend pages, dashboards, or hiring pipeline features.

The goal was just to make sure the frontend and backend could start independently before adding real functionality.

### Session 3 - Prisma and database connectivity

After the client and server were running, I configured Prisma in the server. Prisma was set up to read `DATABASE_URL` from environment variables and use PostgreSQL as the provider.

The original plan was to use the direct Supabase PostgreSQL connection, but the direct hostname did not resolve correctly from my local environment. I switched to the Supabase Session Pooler connection string while keeping the application code and Prisma setup the same.

This session was focused only on database connectivity. I did not create authentication logic or seed data yet.

### Session 4 - User model and demo users

Once Prisma could connect to the database, I added the authentication foundation:

- a `User` table
- unique email addresses
- bcrypt password hashes
- role values for recruiter and interviewer
- a seed script with exactly two demo users

The seed script uses `upsert`, so it can be run repeatedly without creating duplicate users. Passwords are hashed before storage, and plaintext passwords are not stored in the database.

### Session 5 - Authentication design

Before implementing login, I asked the AI to design the simplest email/password authentication flow for the assignment using Express, Prisma, bcrypt, and JWT.

The planned endpoints were:

- `POST /api/auth/login`
- `GET /api/auth/me`

The design intentionally excluded signup, forgot password, email verification, OAuth, refresh tokens, logout API, and production-level identity management. For a 12-hour assessment, the goal was to show a clear and safe basic authentication flow rather than build a full identity platform.

### Session 6 - Implement login only

I then implemented only `POST /api/auth/login`.

The login endpoint:

- accepts `email` and `password`
- finds the user by email using Prisma
- verifies the password using bcrypt
- returns the same authentication error for unknown email and wrong password
- signs a JWT using `JWT_SECRET` from environment variables
- stores only the user id in the token payload as `sub`
- returns a safe user object without `passwordHash`

I did not implement `GET /api/auth/me`, role authorization, refresh tokens, logout, or frontend login UI in this step.

## What order I built in, and why

I built the project in this order:

1. Inspect the repository and confirm the assignment shape.
2. Scaffold the frontend and backend.
3. Configure Prisma and prove database connectivity.
4. Add the `User` model.
5. Seed demo users with hashed passwords.
6. Design the authentication flow.
7. Implement `POST /api/auth/login`.

I chose this order because each step depends on the one before it. The backend must exist before Prisma is useful. Prisma must connect before database models and seed data matter. Users must exist before login can be tested. The authentication flow should be designed before adding routes so the implementation stays small and intentional.

I also built authentication before the larger hiring pipeline features because the assignment expects users and roles. Having login and demo users first gives the rest of the app a realistic foundation.

## What I estimated versus what it actually took

I expected the initial setup to be quick, and it mostly was:

- React/Vite/Tailwind setup: estimated about 30-45 minutes; actually close to that.
- Express setup: estimated about 15-20 minutes; actually straightforward.
- Prisma setup: estimated about 30 minutes; actually took longer because the first Supabase connection approach failed.
- User model and seed data: estimated about 30-45 minutes; actually close to that after Prisma connectivity was fixed.
- Authentication design: estimated about 15-20 minutes; actually quick because the scope was intentionally small.
- Login endpoint: estimated about 30-45 minutes; actually took a little longer because I added the JWT dependency and verified the endpoint manually.

The main unexpected cost was database connectivity. Prisma schema validation was not enough; I needed to test an actual connection and then switch from the direct Supabase database URL to the Session Pooler URL.

Another small unexpected issue was testing JSON requests on Windows PowerShell. Some `curl.exe` quoting attempts sent malformed JSON, so I used Node's built-in `fetch` to test the endpoint reliably.

## What I cut when I ran short

I deliberately cut anything that was not needed for the current milestone:

- no signup
- no forgot password
- no email verification
- no OAuth
- no refresh tokens
- no logout API
- no `GET /api/auth/me` yet
- no role authorization yet
- no frontend login form yet
- no hiring pipeline entities yet
- no dashboards or candidate workflows yet
- no Docker, CI/CD, or deployment setup

These were not cut because they are unimportant in a real product. They were cut because this is a roughly 12-hour assessment, and the priority was to build a small, working foundation with clear decisions.

The current authentication scope is intentionally simple: seeded demo users, bcrypt password verification, a signed JWT containing only the user id, and a safe login response.
