# Sale Dashboard

Next.js (App Router) full-stack app with Postgres (Prisma). Invite-only access: email + password (JWT access token and rotating refresh token in httpOnly cookies) or Google sign-in for existing users.

## Setup

```bash
cp .env.example .env      # fill in the values
npm install
npx prisma migrate deploy # or `npm run db:migrate` in dev
npm run db:seed           # optional: sample leads, calls and tasks (wipes those tables)
npm run dev
```

## Access and invites

There is no sign-up. Every route except `/login`, `/setup`, `/request-access` and `/api/auth/*` requires a session (`src/middleware.ts`).

1. An admin invites someone at `/invites` (emails a 9-character setup code), or a row is added to the `Invite` table by hand.
2. The invitee enters the code at `/setup`, then sets their name, email and password at `/setup/profile` and is signed in.
3. People without an invite use `/request-access`, which emails every admin and appears on `/invites`.
4. Google sign-in only works for emails that already have an account.

Create the first admin by inserting an invite with the `ADMIN` role, then open `/setup`:

```sql
INSERT INTO "Invite" (token, role) VALUES ('ABCDEFGHJ', 'ADMIN');
```

Set `AUTH_SECRET` (32+ random chars) and the `SMTP_*` variables from `.env.example`. Without `SMTP_HOST`, emails are printed to the server log.

## Design system

ZEDU v2 components and tokens live in `src/components/zedu` (see its [README](src/components/zedu/README.md)).
Browse them at `/design-system` while running `npm run dev`.

## Deploy (Coolify)

- Build pack: Dockerfile. The container runs `prisma migrate deploy` on start.
- Set the variables from `.env.example` in Coolify.
- GitHub secrets: `COOLIFY_WEBHOOK_URL` (and optionally `COOLIFY_TOKEN`). The
  `Deploy (Coolify)` workflow only runs after `Malware Scan (CI Gate)` passes on `main`.

## Live

https://sale.zedu.chat
