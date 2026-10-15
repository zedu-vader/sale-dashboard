# Sale Dashboard

Next.js (App Router) full-stack app with Postgres (Prisma) and Google sign-in (NextAuth).

## Setup

```bash
cp .env.example .env      # fill in the values
npm install
npx prisma migrate deploy # or `npm run db:migrate` in dev
npm run db:seed           # optional: sample leads, calls and tasks (wipes those tables)
npm run dev
```

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
