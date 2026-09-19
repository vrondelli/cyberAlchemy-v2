# Comparison run files review — R1

Not approved yet. All five tests passed independently, and actual started/completed schemas match both runtime paths.

Root-level evidence files are opened read-only before the regular-file check. A preexisting named pipe without a writer blocks open indefinitely. This is malformed settled evidence, not a hostile concurrent mutation scenario, and bypasses bounded file handling. Require a final regular-file lstat check and/or nonblocking open, with an isolated timeout regression.

Exact reviewed source bindings are in the companion JSON. Outer process exit, concurrent mutation protection, task-file authentication and campaign seal binding remain explicit later caller responsibilities. No provider calls or implementation edits occurred.

## Open Questions

Owned by [COMPARISON-RUN-FILES.md](COMPARISON-RUN-FILES.md).
