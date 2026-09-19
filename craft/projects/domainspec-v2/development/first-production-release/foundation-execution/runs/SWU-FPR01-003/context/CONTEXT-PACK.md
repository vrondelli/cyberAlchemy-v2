# Strict Context Pack — SWU-FPR01-003

Status: PASS for implementation construction
Mode: standard, strict
Evidence date: 2026-07-16
Authority: session evidence only

## Task

Build the FPR-01 authority baseline, schema, dependency-free deterministic validator,
and named negative fixtures from the approved FPR01-002 dispositions. Do not repair
authority sources inside this Task Session and do not turn a live source mismatch into
a green result.

## Bound inputs

| Input | SHA-256 | Role |
|---|---|---|
| `runs/SWU-FPR01-002/TASK-SESSION-RESULT.md` | `2d3b994e9c9251953e28eb39653271ad97f3e8d2ab188ea411a82a80bc188537` | verified predecessor receipt |
| `evidence/authority-source-dispositions.json` | `4b42980eb706d7c43cd81d9eec2b3c37596584a41a115e127b336d3847c75b5a` | approved machine dispositions |
| `evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md` | `b1d6b0682aacfdf698ea308cce9434e25498bf874845bb72ce4296f587653459` | owner decision and downstream constraints |
| `definitions/meta-types/meta-types.yml` | `a3c37a65ed1bffa5cf2dc4e6b11ccffd4463a24e341a234abf60c916f6ab0f04` | live meta-type machine registry |
| `definitions/relationships/relationships.yml` | `567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41` | live relationship machine registry |
| `IMPORT-MANIFEST.md` | `c354581e5c88b67db645ee6c9f59dfb3a9958a1b4dcbad1687f7603ec300a2b1` | stale-path/import posture input |
| `impl/tools/validate-meta-types-noncollapse.ts` | `18fd7410d85e5d568d512b030d09d05b649365f844bf17a27bbe07b4cc526df0` | local dependency-free parser/error convention |

## Obligations

1. Bind execution to the verified FPR01-002 receipt and approved packet.
2. Preserve the declared FPR01-003 write scope and one-SWU selection.
3. Encode exactly 13 active backend IDs, the stable DS-D1.10 gap, 24 staged labels,
   nine UI candidates, and the two distinct deferred UI states.
4. Encode exactly 30 active unique relationship signatures and the bounded
   `typed composable graph fragment` wording.
5. Derive live counts and statuses from machine registries instead of trusting prose
   or baseline count fields alone.
6. Reject the legacy taxonomy as authority and reject `impl/spec/DEFINITIONS.md` as a
   source home while preserving separately owned repairs.
7. Keep the business-plane-to-Spec direction dependency deferred to FPR-03.
8. Supply an explicit JSON Schema contract without adding a runtime dependency.
9. Produce distinct failures for stale count, stale source path, changed status,
   missing owner, and conflicting direction.
10. Make normalized validation output deterministic over two clean runs.
11. Preserve all production, FPR completion, ratification, and successor-execution
    flags as false.
12. Emit a Task Session receipt and stop on any live reconciliation blocker.

Coverage: 12/12 obligations covered, 100 percent.

## Runtime design

- Node/CommonJS only; no network, adapter, Ajv, or YAML package is available at the
  planned entrypoint.
- `authority-baseline.yml` will use JSON syntax, which is valid YAML, so it can be
  parsed deterministically with the standard library.
- `relationships.yml` is parsed explicitly as JSON bytes.
- `meta-types.yml` is read by a bounded purpose-built extractor for the exact governed
  summary and member fields needed by this validator.
- Schema conformance and semantic invariants are enforced directly with stable error
  codes; the JSON Schema remains the portable machine contract.

## Declared writes

- `development/first-production-release/authority-baseline.yml`
- `development/first-production-release/schemas/authority-baseline.schema.json`
- `development/first-production-release/tools/validate-authority-baseline.cjs`
- `development/first-production-release/fixtures/authority-baseline/*.json`
- `development/first-production-release/foundation-execution/runs/SWU-FPR01-003/TASK-SESSION-RESULT.md`

## Known live residue

The meta-type registry currently reports registry status `candidate`, backend maturity
`shape-fixture-backed-candidate`, and all 13 backend member statuses as `candidate`.
The approved packet requires them to be `active`. The validator must report this as a
real live-source failure after the code package is built. This mismatch does not block
construction of the validator; it blocks a false positive and may prevent this SWU
from receiving a PASS receipt until Definitions Governance reconciles the source.

The relationship registry is already internally consistent at 30 declared, recorded,
unique, active signatures.

## Exclusions

- canonical definition, meta-type, relationship, drift-audit, learning-view, taxonomy,
  or import-manifest repair;
- taxonomy deletion;
- FPR01-004 ratification;
- FPR-02 entry;
- public Arcanum mutation; and
- production or release claims.

## Handoff

Run one local Task Session for `SWU-FPR01-003`. If the implementation and mutants work
but live status reconciliation fails, emit a blocked—not PASS—receipt with exact error
evidence and route the repair through Definitions Governance.
