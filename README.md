# Sale Dashboard

Next.js (App Router) full-stack app with Postgres (Prisma) and Google sign-in (NextAuth).

## Setup

```bash
cp .env.example .env      # fill in the values
npm install
npx prisma migrate deploy # or `npm run db:migrate` in dev
npm run db:seed           # optional: sample contacts, leads, calls, tasks, notes and teammates (wipes those tables)
npm run dev
```

## Pages

- `/` Dashboard: KPIs, recent lead activity and tasks.
- `/leads` Leads: search, filter (status, lead type, owner), sort, tabs (All / Assigned to me / Unassigned),
  bulk assign / change status / delete, and Add lead (with duplicate-phone detection). `?new=1` opens Add lead.
- `/leads/[id]` Lead profile: details, owner, next action, and Activity / Calls / Tasks / Notes, with
  Edit details, Log call and New task.
- `/contacts` Contacts: search (phone numbers match in any format, matches in bold), filter (company, linked
  lead, created), sort, tabs (All / Individuals / Businesses / Possible duplicates), and Add contact (with the
  duplicate-phone warning and "Also create a lead"). `?new=1` opens Add contact.
- Possible duplicates: pairs with the same phone number, the same email, or the same name at the same company.
  "Not a duplicate" hides a pair for everyone; "Review and merge" picks each field's value and folds one record
  into the other (its leads, calls, tasks, notes and timeline move across; old links open the survivor).
- `/contacts/[id]` Contact profile: details, linked records (leads and company), next action, Activity / Calls /
  Tasks / Notes, Edit details, Log call, New task, and Create lead (new, or link an existing lead).

Owners are team members (any user who has signed in; the seed adds three sample teammates). Each lead gets an
`LD-####` code, numbered from 1001; each contact a `CT-####` code.

### Contacts and leads

A contact is one person or business. Every lead points to a contact and reads its name, phone, email, company
and type from it, so editing the contact updates its leads (nothing is copied). Calls, tasks, notes and timeline
entries link to the contact and, when there is one, the lead. Phone numbers are also stored in +234 form
(`phoneKey`), so `0803 123 4567` and `+234 803 123 4567` count as the same number for search and duplicates.
Migration `0004_contacts` gives every existing lead its own contact; the leads' old name/phone/email/company/type
columns are kept but no longer used.

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
