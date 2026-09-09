# Context Pack: Ontology Candidate-Graph Prototype

Status: bounded
Mode: standard
Date: 2026-07-26
Owner: CyberAlchemy v2 ontology route

## Objective

Define and design the smallest executable slice that can validate and inspect a
finite CyberAlchemy ontology-oriented candidate graph without claiming a
canonical ontology, semantic admission, promotion, publication, or production
readiness.

## Selected Evidence

| Selector | Role | SHA-256 |
| --- | --- | --- |
| `cyberAlchemy-v2/development/research/2026-07-26-ontology-working-prototype-gap/findings.md` | Accepted discovery baseline and minimum finite witness | `7f2685f7ca789ef90f951d31a45045f68f09f6f23fb77b24a68d04139f45c4c8` |
| `cyberAlchemy-v2/development/research/2026-07-26-ontology-working-prototype-gap/VALIDATION.md` | Research closeout and claim ceiling | `51216aaa686c72c1b5800f19d1a6b22d060c7da01f17601b6e0c6bb1b920192d` |
| `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md` | Candidate-package and owner boundary | `c1412e66e0fa2074916d2897aa2b2b52fc96805b5741d38265b7fbd855ed79b1` |
| `cyberAlchemy-v2/ontology/NODE-MODEL.md` | Candidate node requirements and challenge contract | `aca62f215147e1919e2affa91a5625c74e54e0d791c7d4e124f6d00db671a25a` |
| `cyberAlchemy-v2/ontology/RELATION-MODEL.md` | Relation effect and forbidden-collapse rules | `19b5614eed1032711dfa37f76605b87f3421ee707fc7c8b99fd909ddb1cb543f` |
| `cyberAlchemy-v2/ontology/LIFECYCLE-MODEL.md` | Lifecycle and projection-state separation | `00636be3a4919b82ec3904d96de1084c7219d710eb9d29d9acd192e78d59b476` |
| `cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml` | Edge meanings, inverses, typed negatives, acyclic-grounding gap | `f3ed1ed8a6452b5b8c200eadf184b2bf937b919440c26dcfa726fa334752e0d1` |
| `cyberAlchemy-v2/ontology/canonical-kinds/ALLOWED-EDGES.yaml` | Closed four-kind endpoint grammar | `500851b158e5c286a45ce50a99a7010e58ede6d7702cbf148c0f9db24a0224b8` |
| `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md` | `CAV2-D19`, `CAV2-D38`, and `CAV2-D40` vocabulary | `b38cb3cd4cb03f3984091a6721af65da9df7fe4838f6a4a12a824b9763a7475c` |

## Inventory Lookup

Inventory lookup selected
`.arcanum/inventory/entries/ontology-working-prototype-gap-research-result-synthesis.md`
(`af5f482d5f148aa57b08bd7c0945d71f7ea2090b09e910097f573a9606092cbb`)
as the current verified synthesis. Inventory is discovery evidence only; the
source contracts above remain authoritative for this design.

## Obligation Map

| Obligation | Source selector |
| --- | --- |
| Use only `session`, `discovery`, `research`, and `findings` in the first graph | `ALLOWED-EDGES.yaml` and research findings |
| Reject unknown kinds, verbs, endpoint pairs, inverse declarations, and grounding cycles | `EDGES.yaml`, `ALLOWED-EDGES.yaml`, and research findings |
| Preserve provenance, two-axis confidence, owner route, challenge, use, and residue/invalidation fields | `NODE-MODEL.md`, `CAV2-D19`, and `CAV2-D40` |
| Separate policy disposition from semantic admission | `PACKAGE-MODEL.md`, `RELATION-MODEL.md`, and `CAV2-D38` |
| Keep candidate projection read-only and non-canonical | `PACKAGE-MODEL.md` and `LIFECYCLE-MODEL.md` |
| Bind fixtures, policy, evaluator, outputs, and projection in immutable receipts | research findings |
| Prove write isolation with denied capability plus before/after digests | research findings |
| Keep machine evidence and later human acceptance separate | research findings and validation |

## Exclusions

- no authority-object schema enactment;
- no new canonical relation or `specializes` policy;
- no promotion, publication, lifecycle transition, or authority mutation;
- no learned ranking, Ponder adapter, hierarchy induction, facets, or ancestor policy;
- no IOLM repair or browser product work in this package;
- no implementation code, Craft task, SWU, or execution authorization.

## Poker Team Example Extension

The concrete example uses the read-only
`validation/poker-team/docs/features/financial-settlement/` slice:

| Selector | Example role | SHA-256 |
| --- | --- | --- |
| `SPEC.md` | Feature and owner context | `10bcc4df404d4c43e0892153bf7daa8e7a037263d07b60acb1d9785e0423ae8b` |
| `observability.md` | D1: O13 declares two business instruments as Gauges | `7eba11d386d9425a9f57d20c062e33dca5c49256665293cfd21acef1864f4513` |
| `backend/src/infrastructure/telemetry/instruments.ts` | D2: runtime registers both instruments as Histograms | `6e1342c11a7d51f2c52b81f376da04da61166bf40b5cc170ac584a66a4cdba45` |
| `OBSERVABILITY-REPORT.md` | R1: static comparison records the two type mismatches and a `FLAG` | `2b9be4aae087ecc50b1bff451e86c13edd4411678311d8fb3b09c083afe50c39` |
| `PIPELINE-REPORT.md` | F1: pipeline synthesis retains O8/O13 residue and final `FLAG` | `4a1741cf93fa548d12c1d8a117a86170624c4d63df3d071d381ed2d429d418dc` |

Live verification on 2026-07-26 ran the two bounded financial-settlement
use-case test files: 2 files passed, 11 tests passed. This proves those selected
use cases are currently reproducible; it does not resolve the O13 instrument
type mismatch or prove the ontology prototype runtime.

## Sufficiency Decision

The evidence closes the design choices needed for a reversible first slice. No
interview question remains blocking: the user selected Define and Design after
accepting the research result. Owner review is still required before Plan or
implementation.
