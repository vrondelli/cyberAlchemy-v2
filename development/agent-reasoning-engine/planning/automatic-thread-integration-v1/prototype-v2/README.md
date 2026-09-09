# ARE integration prototype v2

The six trace-verifier failures found in v1 are repaired. All 32 tests pass:
17 unchanged original cases plus 15 adversarial and recovery cases.

Dispatch now rechecks the prepared lesson selection against the current
checkpointed mode and disabled lessons. A rebuilt empty projection permits safe
continuation after disabling reuse. Events must match session and workspace as
well as thread, participant and product. Request IDs must be nonblank strings.
A completed episode must precede the arrival of feedback that cites it.

The previous candidate and its failing test receipts remain unchanged. This is a
new prototype candidate, not an approval or activation of v1 or v2.

Run from the repository root:

```sh
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node --test cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/prototype-v2/contract-verifier.test.mjs cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/prototype-v2/adversarial.test.mjs
```

TEST-RECEIPT.json binds the result to source hashes. PROTOTYPE.json carries the
non-authoritative definitions and construction scaffolds; CONTRACT.json states
the revised event semantics. PROGRESS.json separates construction from operations.

These tests validate declared synthetic traces. They do not authenticate input,
interpret natural-language controls, measure actual context bytes, prove fsync,
or establish live learning. Array order must eventually come from a trusted host
adapter. No hook adapter was installed or implemented here; ARE is not activated.

Next product construction: implement and test a disposable native hook adapter
using the existing ARE lifecycle. Live installation, trust/reload verification,
and rollback preparation belong to operational support owned by the host
integrator. They do not block isolated adapter construction. Full product tests
and approval must precede a separate live activation decision.
