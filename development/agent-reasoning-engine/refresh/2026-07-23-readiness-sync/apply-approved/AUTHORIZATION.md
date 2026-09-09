# Apply authorization

- Authorized route: `invoke:refresh:apply-approved`
- Authorized by: user in the current thread
- Authorized scope:
  - `planning/WORK-PACK.md`
  - `planning/work-pack/tasks/TASK-ARE-READINESS-001.md`
  - `.craft/ledger.yml`
  - `.craft/index.json`
  - `CRAFT.md`
- Required owner split:
  - Invoke owns the two planning targets.
  - Craft owns the ledger and its two derived projections.
- Excluded:
  - evaluator or other implementation work,
  - `implementation_authorized: true`,
  - SWU execution inside the refresh,
  - public/canonical promotion,
  - closure of semantic-witness or downstream gaps.

The same user request separately authorizes serial Task Session execution of
dependency-ready SWUs after this synchronization passes. That later
authorization does not widen this apply package.
