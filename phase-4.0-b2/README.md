# Football rich Phase 4.0-B.2 — Transaction & Repository

## Scope
- Adds a Native IndexedDB transaction executor for the isolated V2 database.
- Adds repository helpers for add, batch add, get, get-all, index query, count, update, and delete.
- Multi-store atomic transactions are supported by the transaction executor.
- Request callbacks are synchronous by design; callers must queue IndexedDB requests before returning.
- Immutable history/evidence/calculation stores are append-only and reject update/delete operations.
- Duplicate unique-key and quota failures are surfaced as typed database errors.
- V1 archive and V1 database code are not imported or modified.
- No UI integration, Analysis Engine integration, migration, or live-data changes.

## Files
- `src/data/v2/transaction.ts`
- `src/data/v2/repositories.ts`

## Acceptance coverage
- Atomic commit across multiple stores.
- Rollback when the callback throws or a unique index rejects a write.
- Async transaction callbacks are rejected to avoid IndexedDB auto-commit races.
- CRUD and index query behavior.
- Append-only protections.
- Invalid primary keys and unknown indexes are rejected.
