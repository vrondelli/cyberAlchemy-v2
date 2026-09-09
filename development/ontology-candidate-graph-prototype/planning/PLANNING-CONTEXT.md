# Ontology Candidate Graph Prototype — Planning Context

Status: planning frame complete

## Objective

Turn the approved candidate Design into an executable-but-closed work pack for
the minimum L0–L2 prototype. The plan must keep candidate structure, policy
disposition, projection, evidence, and authority as distinct owners and
artifacts.

## Source Bindings

| Source | SHA-256 | Planning use |
| --- | --- | --- |
| `../define/SPEC.md` | `3cd09a411328d4fc32e7e901ec6cdd2df7505b0546e96a31cd3dd35d378a32cf` | scope, invariants, claim ceiling |
| `../define/operations.md` | `578e1462aa0486d4efd190eca3f552483dd3437b3caa611279b665e50772dc66` | evaluation order and failure behavior |
| `../define/interfaces.md` | `808179f247fa506fe2b0677b930987396764cd0c9854c9eb52afcd63b7444693` | input, output, and writer seams |
| `../design/ARCHITECTURE.md` | `adce9f22f129b3a1c4a4f201e8827e2badc35e9911c7d3c7840ca3bd23293a67` | component and authority boundaries |
| `../design/VALIDATION-CONTRACTS.md` | `6d633cbe2898d60e4c56091a249aa3bd4ea6bb4f0a991b734a631076ff72cc5f` | finite witness suite |
| `../design/IMPLEMENTATION-LAYERING-SEED.md` | `d4b488ac4a919d6ecff0e6211160507ea789637f2de1b24b0af46e57af24c051` | L0–L4 seed |
| `../design/DESIGN-SELECTION-RESULT.json` | `866c3d21d437fbb5464f4c0e3ec6eea504f0c51254bd2219b0633d810a7e16ff` | selected-view pass |
| `../design/EXAMPLE.md` | `11f7ba763a193b2ee137b7bd346e3d2403d67e37d4873ac8050ef3dfc850f5df` | Poker Team O13 witness |

The Design selection binds manifest input digest
`fac8f24096ec46cb718efce0bd280476960ca933f25e43510e71c95a14c4d21a`
and denominator receipt digest
`0868886bdb29e49c230ab7e0ea55bbb1683909b3d1f51c8bcfe98e12d74cc5c2`.

## Context Builder Coverage

| Obligation | Selected evidence | Excluded interpretation |
| --- | --- | --- |
| finite graph carrier | Define domain and interfaces | general ontology language |
| relation grammar | Define operations and Design validation contracts | learned or inferred edge law |
| policy dispositions | Architecture authority view | semantic admission |
| deterministic projection | Architecture quality view | canonical ontology |
| immutable evidence | Architecture persistence view | authority receipt |
| write isolation | validation contract `VC-ISOLATION-001` | sandbox-wide security claim |
| Poker Team example | Design example over O13 conflict | Poker Team repair or product acceptance |
| Plan entry | owner approval plus Design fixed point | implementation authorization |

## Planning Decisions

1. Use Node 22 ESM and built-in modules only. This matches the private
   implementation precedent, makes canonical JSON and `node:test` available,
   and is reversible without introducing a dependency.
2. Reserve the future root
   `cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/`.
3. The active plan covers L0–L2. L3 static HTML and L4 IOLM integration remain
   deferred and have no mutation-capable SWU.
4. The normative Poker Team example stays read-only. Future fixtures copy only
   the minimal synthetic identifiers and facts already captured in
   `../design/EXAMPLE.md`; they do not read or write the submodule at runtime.
5. No SWU is selected by this Plan. The recommended first candidate is
   `SWU-OCGP-001`, subject to an explicit later Task Session selection.

## Capability Honesty

| Axis | State after Plan |
| --- | --- |
| `artifact_authored` | may pass after validation |
| `registry_released` | false |
| `mutation_runtime_ready` | false until one SWU is explicitly selected and preflight receipts pass |
| runtime prototype | absent |
| bounded ontology prototype claim | unavailable |
| semantic admission or promotion | none |

Inventory was used only to locate existing work-pack precedent and the accepted
research synthesis. It is a read model, not a template or ontology authority.
