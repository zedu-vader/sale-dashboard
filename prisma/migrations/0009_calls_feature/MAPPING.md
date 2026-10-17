# Calls migration mapping

This migration follows the target repository's existing migrations through `0008_everyone_admin`.
It reuses the target's `TaskType`, `Task.callId`, `Task.leadId`, `Call.userId`, `Call.durationSec`, and
existing `Call.notes` columns. It adds only indexes needed for caller/status/disposition filtering and
call-linked task lookup; it does not recreate existing columns, enum types, or foreign keys.

The legacy database enum `CallOutcome` remains mapped to Prisma `LegacyCallOutcome` and the original
`Call.outcome` column. The new Prisma `CallOutcome` enum maps to the distinct database enum
`CallDisposition` and column `Call.callOutcome`. The legacy `durationSec` column is exposed as
`durationSeconds` in Prisma. Existing lead and contact relations are retained.

| Legacy outcome | Connection status | New disposition |
| --- | --- | --- |
| `CONNECTED` | `CONNECTED` | `OTHER` |
| `NO_ANSWER` | `NOT_CONNECTED` | `NOT_APPLICABLE` |
| `NOT_INTERESTED` | `CONNECTED` | `NOT_INTERESTED` |
| `OTHER` | `CONNECTED` | `OTHER` |

Every legacy value remains stored unchanged. The trigger keeps older writers compatible during rollout.
The migration is SQL-only and has not been run against any database.
