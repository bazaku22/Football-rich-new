# Football rich Phase 4.0-B.1 — Database Core

- Separate database: `football-rich-local-v2`, IndexedDB version 1.
- Explicit 32-store schema and indexes.
- Unique constraints: match revision (match ID + revision), provider team identity, model version code, and setting key.
- Schema verification runs after opening and fails closed on mismatch.
- Version-change and blocked-open handling are included.
- No UI integration, V1 access, destructive repair, data migration, or live-data migration.
- The source package is copied into the extracted build workspace; the original V1 ZIP remains unchanged.
