# Assignment 03 — Hiring Pipeline

## The scenario

Picture a company hiring across several open roles at once — engineering, sales, support — with a
small recruiting team coordinating a growing list of candidates through interviews. Right now,
tracking who applied to what and which stage they have reached lives across a shared spreadsheet, a
handful of personal inboxes, and whatever an interviewer remembers to mention afterward.

The result is predictable. A candidate promised feedback within a week hears nothing for a month
because nobody noticed their application had sat at the same stage the whole time. Two interviewers
each assume the other is following up with the same person, and nobody does. When someone asks how
many people are currently being interviewed for the sales role, the honest answer is to go count by
hand across three different sheets. A candidate who was rejected months ago and reapplies has no
history anyone can find.

They want one shared pipeline: recruiters open positions, move candidates through a defined set of
stages, and see the whole funnel at a glance, while interviewers see just the candidates assigned to
them and leave feedback without needing access to the rest of the pipeline. Anyone should be able to
answer "which candidates are stuck" or "how many are we talking to right now" without tallying
spreadsheets by hand. That is the tool you are building.

## What it must do

Everything below is required. Several of the ten spell out exact rules — what happens on an illegal
move, what a bulk action must report back, when a dismissed alert is allowed to reappear — and those
specifics are the actual ask, not just the bold headline in front of them.

1. **Accounts and roles.** People sign in with an email and password, and there are at least two
roles — a recruiter role and an interviewer role. Recruiters can open and close job openings, add
and edit applications, move candidates through the pipeline, and assign interviewers. Interviewers
can only see applications they are assigned to and leave feedback on them — they cannot change a
candidate's stage or see other openings' pipelines. The difference must be enforced on the server,
not just hidden in the interface.

2. **Job openings.** Recruiters create job openings with a title, a department, a description and a
status, and can edit them later. Openings can be archived and restored. Archiving hides an opening
from the default views without destroying its applications.

3. **Applications inside job openings.** Every application belongs to exactly one job opening and
carries a candidate name, an email, a source, and any notes. Applications can be created and edited.
Opening a job opening shows its applications.

4. **A pipeline with rules.** An application advances *Applied → Screening → Interview → Offer →
Hired*, one stage at a time. It can be marked *Rejected* from any stage, immediately halting its
progress. A rejected application is never deleted — it can be reinstated back to the exact stage it
was rejected from, not reset to Applied. Any attempt to skip a stage forward, such as jumping from
Screening straight to Offer, must be rejected by the server with a message explaining why.

5. **Interview panel.** Any number of interviewers can be assigned to an application, and an
interviewer can be assigned to any number of applications across every opening. Only users with the
interviewer role may be assigned. Every interviewer can see one list of every application they are
on the panel for.

6. **Finding candidates.** One list shows applications across every opening the viewer can see, with
a text search over candidate name and email, filters for job opening, stage and source, sorting by
applied date, stage or last update, and pagination showing the total number of matches. All of this
must happen on the server — do not load every application into the browser and filter there.

7. **Acting on many candidates at once.** Select several applications from the list and bulk-advance
them to the next stage, or bulk-reject them, in one action. Because some selected applications will
not be eligible for the move, the result must report per candidate what succeeded and what was
refused and why, not just fail the whole batch. Separately, export a snapshot of the pipeline —
every open application and its current stage — as a CSV file.

8. **A dashboard.** A landing view shows headline numbers — open positions, active applications,
interviews scheduled this week, hires this month. It also breaks applications down by job opening
and by stage, and charts applications received per week over the last quarter.

9. **History you cannot rewrite.** Every application has a timeline showing when it was created,
every stage change with the old and new stage and who made it, every rejection and reinstatement,
and any feedback interviewers have left. Feedback is part of this timeline. Nothing in it can be
edited or deleted after the fact, including by recruiters.

10. **Stalled-application alerts.** Any application that has sat in the same stage for more than ten
days appears in an alerts area, with a count badge visible in the navigation. A recruiter can
dismiss an alert for a specific application. If that application later advances and then stalls in
its new stage for the same length of time, the alert returns.

## Stretch ideas (optional)

None of these are required, and none substitute for a goal above. If you finish all ten with time
left over, pick whichever of these sounds most useful and build it:

- A public careers page listing open positions.
- Structured interview scorecards per stage.
- Self-service scheduling links for interviews.
- A candidate-facing status portal.
- Resume tagging and search by skill.
- Offer letter generation.
- Source-of-hire reporting.
- An email digest of stalled candidates.
- Referral tracking.


---

## What we are assessing

A working application is table stakes. Almost every serious candidate will produce something that runs, has a login, and roughly does what was asked. That's the floor, not the differentiator.

What actually separates submissions is the record of thinking behind the app: the decisions you made and why, the trade-offs you weighed, what you built first and what you deliberately left out, and whether you can explain any part of your own system when asked. We are hiring for judgement. The app is the evidence for that judgement, not the deliverable in itself.

We also read the code itself for structure and readability, which counts for a small share of the overall score.

## Time budget

Budget about 12 hours total, spent roughly 2 hours a day across a week.

This is not a race. We are not timing you against other candidates, and submitting early scores nothing extra. Twelve hours is a size guide so you know how much to attempt — pace yourself, stop when you're tired, and spend some of that time thinking and documenting, not only typing code.

## Pick any stack you like

Use any language, any framework, any UI library, any ORM, and any database access approach you want. We have no house stack, and no stack scores better than another — this round is not a test of whether you know particular tools.

Use whatever you are fastest and most confident in. Time spent learning something new to impress us is time not spent on the ten goals above, and it will show.

## Using AI is allowed and encouraged

Use AI tools however you want — to scaffold code, debug a stuck problem, write tests, draft documentation, or anything else that helps you move faster. A few things to know about how we treat it:

- We do not penalise AI use, and we make no attempt to detect it.
- We care about whether you understood, directed and verified the output — not about who or what produced the first draft of it.
- `docs/ai-prompts.md` must contain the prompts you actually used, including the ones that produced bad output and what you changed afterwards. If you used no AI at all, say so here and describe how you worked instead — that is assessed the same way.
- Submitting generated code you cannot explain is the single most common way candidates fail this round.

You are accountable for everything in your submission. If a reviewer points at a piece of code and asks why it's there, or why it works the way it does, "the AI wrote it" is not an answer.

## Use git properly

Publish to a public GitHub repository, and commit incrementally as the work actually happens — after each meaningful step, not in one pass at the end.

A repository whose entire history is a single "initial commit" containing a finished app scores zero on git history, and it colours how we read everything else in your submission, however good the app itself is. Your history is how we see the order you built in, where you got stuck, and how the design changed along the way. If it isn't there, we can't assess it, and we won't assume the best.

## What you must commit

Alongside your code, commit these five files under `docs/`. Your zip includes a stub for each with the questions it needs to answer — fill them in as you go, not from memory at the end.

| File | What it must answer |
|------|----------------------|
| `docs/architecture.md` | What the moving pieces are, how they talk to each other, where each one runs, the request path for one representative user action end to end, and what you decided not to build. |
| `docs/schema.md` | Every table's columns and types, which relationships are one-to-many versus many-to-many, which constraints live in the database versus the application, what you deliberately denormalised, and what would break first at 100x the data. |
| `docs/plan.md` | How you split the work into sessions, what order you built in and why, what you estimated versus what it actually took, and what you cut when you ran short. |
| `docs/decisions.md` | At least five real decisions — what you chose, what you rejected, and why — including at least one you later reversed. |
| `docs/ai-prompts.md` | The prompts you actually used, in order, grouped by what you were trying to do, including at least one that produced something wrong and what you did about it. |

## Host it for free

Deploy the whole thing somewhere reachable by URL, using free tiers only.

One combination that works, if you would rather not decide:

- **Database** — a managed service such as Supabase.
- **Server-side code** — Render.
- **Browser-side code** — Vercel.

Deploy in that order: create the database first, give the server its connection details as environment variables, then point the browser-side part at the server's public URL.

This is one option, not a requirement. Any free host is equally acceptable — everything on a single provider, one virtual machine, a container platform, a static host with serverless functions. The choice earns and loses nothing.

Requirements:

- A working live URL.
- Seeded with enough demo data to show the system doing something, not an empty shell.
- Demo credentials for every role recorded in `SUBMISSION.md`.
- Connection strings, keys and passwords kept in environment variables, never in the repository.
- Free tiers often sleep when idle and can take a minute or more to wake. Note it in `SUBMISSION.md` if yours does, so a slow first load is not read as a broken deployment.
- If you cannot get it hosted, submit anyway and record in `SUBMISSION.md` what you tried and where it broke.

## How to submit

Send us:

- The URL of your public GitHub repository.
- The URL of your live, deployed application.
- Your completed `SUBMISSION.md`, committed to the repository.

That's the whole submission. Nothing else to prepare, no separate form.

## What happens next

If your submission clears the bar, we'll set up a short call. We will ask about specific decisions we can see in your repository and its history — why you modelled something a particular way, what a certain commit was fixing, what you'd change if you kept going.

We're telling you this now because it should change how carefully you document as you go. Write `docs/decisions.md` for a version of yourself who has to explain it three weeks from now.

## Scope

The 10 goals stated in this brief are the cutoff. Meet all 10, solidly, and you have a complete submission.

Stretch ideas are optional. They exist for candidates who finish the 10 with time left and want to keep building — they are never required, and they do not make up for a goal you didn't hit. Doing 8 goals well beats doing 10 goals badly. If time is short, finish fewer goals properly rather than leaving all ten half-done.
