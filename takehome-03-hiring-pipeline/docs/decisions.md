# Decisions

Log the decisions that actually shaped this codebase — the ones where a real alternative existed and
you picked one. At least five entries. For each: what you chose, what you rejected, and why. At least
one entry must be a decision you later reversed — say what changed your mind. It can be any entry
below, not necessarily the last one; add a **Later reversed:** line to whichever one it is.

## Decision 1 — Supabase database connection strategy

* **Chose:** Initially used Supabase's direct PostgreSQL connection with Prisma.

* **Rejected:** Using the Supabase connection pooler from the beginning.

* **Why:** The direct connection was the simplest option and seemed appropriate for local development, so I tried it first rather than adding another connection layer unnecessarily.

* **Later reversed:** Prisma schema validation succeeded, but an actual database connectivity check failed with `P1001`. A separate network test showed that the Supabase direct database hostname was not resolving from my local environment. Instead of changing the Prisma setup or creating database models prematurely, I switched to Supabase's Session Pooler connection string and kept the application configuration unchanged apart from `DATABASE_URL`.


## Decision 2 - skipped sign up page

Chose:
Seed demo users and provide login only.

Rejected:
Public registration/signup.

Why:
Account creation is outside the stated assignment requirements. Adding signup
would consume implementation and validation time without contributing to one
of the ten required goals.

## Decision 3

- **Chose:**
- **Rejected:**
- **Why:**

## Decision 4

- **Chose:**
- **Rejected:**
- **Why:**

## Decision 5

- **Chose:**
- **Rejected:**
- **Why:**
