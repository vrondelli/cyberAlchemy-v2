---
schema: context-pack/v1
task: SWU-IOLM-00C-B
mode: lean
strict: true
status: blocked
preparedAt: 2026-07-20
filesSelected: 8
excerptLines: 63
---

# Context Pack — SWU-IOLM-00C-B

## Execution target

Compile a minimal private candidate graph spanning the CyberAlchemy Method and
Craft seed features, prove two clean builds agree, and return graph/source/build
receipts without granting authority.

## Selected evidence

| # | Selector | Obligation |
|---|---|---|
| 1 | `work-pack/tasks/TASK-IOLM-00C-CANDIDATE-SUBSTRATE.md#SWU-IOLM-00C-B` | Requires two seed features, at least one typed cross-feature connection, deterministic compilation, candidate provenance, exact write scope, and a stop before 00C-C. |
| 2 | `work-pack/session-evidence/SWU-IOLM-00C-A/RESULT.md#Candidate-contract-handle` | Supplies the passing `iolm-candidate-contract/v1` input/build/view guard. |
| 3 | `SPEC.md#DomainSpec-graph-consumer-boundary`, `#Acceptance-criteria` | Candidate input grants no FPR authority; every build carries posture, source digest, compiler version, and provenance. |
| 4 | `ARCHITECTURE-BUNDLE.md#Component-contracts`, `#Stable-identity-policy` | The minted adapter emits one normalized candidate graph and preserves stable record identities. |
| 5 | `IMPLEMENTATION-LAYERING.md#Layer-decisions` | L0C must prove the candidate substrate without performing L0A authority rebind. |
| 6 | `projects/domainspec-v2/impl/spec/minted-project/{feature,node,connection}.schema.json` | The active `per-node-connections` profile owns outgoing connection records inside source node files. |
| 7 | `projects/domainspec-v2/impl/tools/minted-project/compiler.ts#compileMintedProject` | The live compiler throws `CROSS_FEATURE_UNSUPPORTED` whenever source and target feature IDs differ. |
| 8 | `projects/domainspec-v2/impl/tools/tests/minted-project-compiler.test.ts#cross-feature-edges-fail-until-a-separate-multi-feature-design-is-admitted` | A host-native test intentionally locks cross-feature rejection as the current supported boundary. |

## Obligation matrix

| ID | Obligation | Coverage | Gate |
|---|---|---|---|
| O-01 | Consume `iolm-candidate-contract/v1`. | Covered by 00C-A receipt. | pass |
| O-02 | Emit project plus two feature source families in the declared prototype scope. | Covered by task and minted schemas. | pass in isolation |
| O-03 | Include at least one typed connection crossing the two seed features. | Contradicted by the live compiler and its regression test. | **block** |
| O-04 | Compile twice to byte-identical graph and source-manifest outputs. | Validation route exists through `compileMintedProject`; cannot run on a conforming O-03 input. | blocked by O-03 |
| O-05 | Emit build/source provenance and candidate wrappers. | Contract and compiler outputs are available. | blocked by O-03 |
| O-06 | Stay inside IOLM prototype paths and avoid upstream compiler mutation. | Explicit and enforceable. | pass |
| O-07 | Stop before selecting 00C-C. | Explicit. | pass |

## Contradiction

The SWU cannot simultaneously satisfy its cross-feature acceptance criterion and
the current minted compiler contract. The compiler rejects a connection as soon
as the source and target feature IDs differ, before graph emission. Its test says
this is intentional until a separate multi-feature design is admitted.

This is not safely resolved by interpretation:

- storing both concept families under one minted feature would not cross two
  seed features;
- emitting ignored standalone connection files would not be compiler evidence;
- changing `projects/domainspec-v2` would exceed the SWU write scope and mutate
  another authority surface.

## Gate verdict

`BLOCK` before prototype mutation. The user must choose whether to route an
upstream compiler capability, amend the IOLM acceptance contract, or defer.
Decision artifact: `DECISION-GATE.md` in this session-evidence directory.
