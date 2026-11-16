# Football rich — Legacy Result Snapshot Import v1.0

- Accept only Football Time `legacy_match_result_snapshots` / `non_revision_legacy` envelopes.
- Require exact Shared Match ID mapping, provider, league, season, full-time score and explicit `legacy_database_snapshot`, `not_independently_verified`, `revision_history_available:false` evidence.
- Reject revision/verified-provenance fields, ambiguous mappings, conflicting repeat imports and score conflicts with a verified result.
- Store additively in `footballTimeLegacyResultSnapshot` on the existing `matches` record only.
- Never overwrite verified results, predictions, analysis or evaluation records. Identical re-import is idempotent.
- Exclude from Verified Performance; any future retrospective view must be separately labelled and must not pool legacy and verified metrics.
