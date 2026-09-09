# Essays Agent Runtime Storage

Result: selected
Selected option: `OPT-ST-SQLITE`
Authority effect: none

The user selected one SQLite database owned exclusively by the long-running
Rust service daemon. The future binding must define WAL durability,
transactional state/event/idempotency/receipt commits, monotonic migrations,
integrity checks, backup, restore, corruption handling, and recovery tests.

This does not select a Rust crate, ORM, query layer, schema, or migration
library, and it does not prove durability or authorize implementation.

The machine-readable decision is `selection.json`, bound to admissibility
request digest
`d8d73b7f907ed00012c68a16630e93ec2b3c2e5d7057558ddbcd7e56aad3e224`.
