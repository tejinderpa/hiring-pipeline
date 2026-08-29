# Schema

Answer each of these, in your own words.

- Table by table: what columns and types does each one have?
- Which relationships are one-to-many, and which are many-to-many?
- Which constraints are enforced by the database, and which by application code — and why did you draw the line there?
- What did you deliberately denormalise?
- What would break first if this had 100x the data?

# Schema

## User

I started with the authentication part of the project, so at the moment the database only contains the `User` table. I wanted to get login, roles, and basic access control working first before introducing the hiring pipeline entities.

| Column         | Type          | Notes                                                         |
| -------------- | ------------- | ------------------------------------------------------------- |
| `id`           | String / UUID | Primary key used to uniquely identify a user                  |
| `name`         | String        | Name displayed inside the application                         |
| `email`        | String        | Unique email address used for login                           |
| `passwordHash` | String        | Stores the bcrypt hash of the user's password                 |
| `role`         | Role enum     | Defines whether the user is a `RECRUITER` or an `INTERVIEWER` |
| `createdAt`    | DateTime      | Automatically set when the user is created                    |
| `updatedAt`    | DateTime      | Automatically updated whenever the user record changes        |

## Current relationships

There are no hiring-related relationships yet because I have only implemented the authentication foundation so far.

The `User` table is currently independent. Once I start adding job openings, applications, interviewer assignments, feedback, and history, the relationships with users will be added gradually instead of designing the entire schema upfront before the actual flows are implemented.

## Database constraints

Some rules are better enforced directly by the database.

For example, `id` is the primary key, `email` is unique, and the `Role` enum ensures that a user cannot accidentally be stored with an unsupported role.

Other rules belong in the application layer. Password validation, checking login credentials, deciding whether a recruiter or interviewer can perform an action, and similar authorization checks should be handled by the backend rather than the database.

The database only stores the hashed password. It does not need to know the original password or the password-strength rules used during registration.

## Denormalisation

There is no denormalisation at this stage.

The schema is still small, and duplicating data would only add unnecessary complexity. I would only consider denormalising something later if there is a clear performance or reporting reason for doing so.

## Scaling

The `User` table is unlikely to be the first part of the system to become a bottleneck.

As the application grows, I expect the application and pipeline tables to become more important from a scaling point of view because they will support searching, filtering, sorting, pagination, dashboard statistics, stage history, and stalled-application checks.

That is where indexes and query design will probably matter much more than they do for the current user table.
