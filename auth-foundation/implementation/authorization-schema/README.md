# Auth SQLite schema source

The SQL files in `migrations/` are the current source for Auth's native SQLite
readers, admission service, and legacy decision service. The prior copies under
`sqlite-provider`, `trusted-input-provider`, and `authorization-service` remain
unchanged because historical source-bound evidence names and hashes those
paths. At this checkpoint each corresponding pair has identical SHA-256 bytes;
active Rust `include_str!` references now point here.

This is source ownership, not a migration performed on a live database. Schema
operations remain explicit, and authorization startup does not migrate.

## Open Questions

- When the versioned successor evidence replaces historical source bindings,
  should the old migration copies be removed? Keep them until that evidence
  transition is reviewed; do not silently change their bytes.
