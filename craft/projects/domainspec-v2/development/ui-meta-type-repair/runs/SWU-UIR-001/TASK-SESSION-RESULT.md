---
task: SWU-UIR-001
status: complete
result: PASS
run_id: task-session-20260711T212301Z-swu-uir-001-contract-kernel
completed: 2026-07-11T21:23:01Z
---

# SWU-UIR-001 Task Session Result

## Result

Implemented the versioned development contract kernel without touching shared
validators, candidates, prior UIF evidence, DS-D1, or DS-D8.

## Outputs

- Three Draft 2020-12 JSON-formatted YAML schemas for manifests, immutable
  envelopes, and normalized results.
- A dependency-free `canonical-json-v1`/`sha256-v1` reference implementation.
- Persisted golden, malformed, tamper, volatile, semantic, and lineage vectors.
- Stable content, record, and generation identity derivation with no-op proof.

## Validation

- Python Draft 2020-12 schema validation: PASS.
- `node --test .../tests/contract-kernel.test.mjs`: 7 pass, 0 fail.
- Field order and volatile changes preserve identity: PASS.
- Semantic changes alter content/record/generation identity: PASS.
- Predecessor changes generation identity only: PASS.
- Unsafe values, tampering, and ambiguous input handles fail closed: PASS.

## Handoff

SWU-UIR-002 is next. SWU-UIR-003 is independently ready after this kernel but
must remain a separate Task Session. Full receipt: `receipt.json`.
