---
artifact_id: CONTEXT-UIR-014-v1
task: SWU-UIR-014
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-12
---

# SWU-UIR-014 Context Pack

## Objective

Persist the four DEC-UIR-010 choices in a separate immutable owner-decision
record linked to relationship packet generation 001 and the unchanged DS-D8
digest. The packet remains decision-free and authority remains unchanged.

## Decision Mapping

| Question | Selected packet option | Recorded outcome |
| --- | --- | --- |
| `action-source` | `admit-distinct-source` | `route-open`; no signature admitted; full successor evidence required |
| `hook-binding` | `retain-separation` | current authority retained |
| `guard-target` | `retain-page-rule` | finite current Page/Rule target set retained |
| `binding-node-relation` | `retain-binding-node` | current fetches/mutates endpoint retained; no DS-D1 promotion |

## Pinned Inputs

- DS-D8 version 1 digest: `sha256:567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41`
- packet generation: `generation:sha256:8768ca294f44e65efbe8d9fad512673d02933770406be474d7cf89992278c28b`
- packet record: `record:sha256:a93f457bc015836e95440da3f75550e6e1b5940697dc2a196acce1b4e11102c9`
- packet byte digest: `sha256:a696827e62d65ad4f87b30a000c60c226d965f96acb52597b3ff6dc0499fe20e`

## Obligation Coverage

| ID | Required proof | Coverage |
| --- | --- | --- |
| O1 | Packet identity and authority digest verify | complete |
| O2 | Exactly one known option is selected per four known questions | complete |
| O3 | Action-source is route-open with no admitted signature | complete |
| O4 | Every route-open decision has explicit evidence obligations | complete |
| O5 | Other three decisions retain current authority outcomes | complete |
| O6 | Every decision has `authority_effect = none` | complete |
| O7 | Invented verb/target, signature-count change, DS-D1 promotion, and packet mutation reject | complete |
| O8 | Packet and DS-D8 byte identity remain unchanged | complete |
| O9 | Immutable replay and digest-drift negatives are testable | complete |

## Gate Verdict

`PASS`. DEC-UIR-010 is resolved 4/4, packet options are finite and present,
and the live authority digest matches. No further human choice is required.

## Mutation Boundary

- `contracts/relationship-owner-decision.schema.yml`
- `evidence/relationship-owner-decision.mjs`
- `evidence/build-relationship-decision-generation.mjs`
- `fixtures/contracts/relationship-owner-decision-*`
- `evidence/results/relationship-decision/generation-001/`
- `tests/relationship-owner-decision.test.mjs`
- SWU-UIR-014 run evidence and synchronized work-pack evidence

Relationship packet generation 001, DS-D8, DS-D1, and all canonical authority
artifacts are immutable inputs.
