# Calls and Tasks migration notes

The existing database `Call.outcome` column and enum remain in place. Prisma
exposes that legacy column as `Call.legacyOutcome`; the approved outcome is
stored in a new `callOutcome` column exposed as `Call.outcome`. Keeping the old
column/type intact makes the schema migration additive for the currently
deployed app. Every historical enum value remains unchanged. The new
`Call.connectionStatus` and `Call.outcome` values are backfilled as follows:

| Legacy outcome | New connection status | New outcome |
| --- | --- | --- |
| `CONNECTED` | `CONNECTED` | `OTHER` |
| `NO_ANSWER` | `NOT_CONNECTED` | `NOT_APPLICABLE` |
| `NOT_INTERESTED` | `CONNECTED` | `NOT_INTERESTED` |
| `OTHER` | `CONNECTED` | `OTHER` |

The `CONNECTED` and `OTHER` mappings preserve the old dashboard rule that
treated every outcome except `NO_ANSWER` as connected. Since the original enum
is retained in `legacyOutcome`, ambiguous historical dispositions are not
presented as newly observed outcomes. The dashboard reports legacy values in
separate historical categories and uses the new field for newly logged calls.
The migration also installs a compatibility trigger: any legacy
writer that inserts or changes the old outcome column gets the matching new
connection status and outcome. New API writes leave that legacy column null and
use the approved fields directly.

The target Tasks screen in this repository is currently a UI prototype backed
by in-memory sample rows; there is no JSON task store or task API to import.
Existing Prisma Task rows are retained, and their new task type remains null
rather than assuming they were calls. New Calls follow-up tasks use that same
Prisma Task model, carry their call and lead foreign keys, and are assigned to
the authenticated caller. The Tasks page displays those persisted call tasks
alongside its existing sample rows; only persisted call tasks are updated via
the database-backed completion endpoint. This migration does not convert the
sample rows into database records.
