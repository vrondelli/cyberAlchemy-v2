---
artifact: invoke-design-layering-seed
status: candidate
updatedAt: 2026-07-22
owner: DomainSpec-v2 backend-type-test-engine-completeness
semanticAuthority: none
sourceDesign: DESIGN.md
---

# Design Layering Seed

This is the dependency order that Invoke Plan must turn into implementation
layers, tasks, gates, and validation. It is not a Plan, work pack, wave list, or
authorization to select an SWU.

## Dependency Layers

| Layer | Must establish | Entry gate | Exit evidence shape | Must not depend on |
| ---: | --- | --- | --- | --- |
| 0 | shared artifact-handle, logical-ID/content-digest, diagnostic, authority-class, and exact-set contracts | approved Design | schema/semantic-validator red controls | compiler or consumer pass |
| 1 | formation v2 structural grammar, 13 structure bundles, 16 criteria, JSON-retirement map, compatibility corpus, false-green reason | Layer 0 | exact predecessor-map coverage and formation contract receipts | successor activation |
| 2 | successor project/feature/node/edge/source-set contracts and connections-to-edge migration | Layer 1 contracts frozen | source resolver positives/typed negatives with exact roots/provenance | graph/test engine assumptions |
| 3 | successor compiler route, formation/relationship validation, graph v2, manifest v2, build replay | Layers 1–2; current v1 regression green | deterministic graph/manifest/build evidence | O_spec, generated tests, consumers |
| 4 | independently frozen proof catalogues plus node-pattern and relationship-composition selections | exact candidate profile/contract handles | nonempty catalogues, independent owner/freeze evidence, exact admissions or typed gate residue | BTE derivation algorithm |
| 5 | smallest coherent graph-to-proof unit: O_gen, exact compare, TestCase, exact binding, raw execution, bounded evaluator, fresh mutant, receipt, independent replay | Layers 0, 3, 4 | one complete positive unit plus missing/extra/ambiguous/stale/survivor controls | legacy Markdown equality or first-match behavior |
| 6 | full static and dynamic catalogue breadth plus `verify:bte:core` | Layer 5; exact formation/profile/relationship admissions | six exact successful catalogue ReplayResults and core aggregate | IOLM, Body War, or UI |
| 7A | IOLM handshake, consumer-owned run, BTE-owned replay | exact successful core handle | fresh IOLM ReplayResult | Body War or UI |
| 7B | Body War machine contract, handshake, consumer-owned run, BTE-owned replay | exact successful core handle | fresh Body War ReplayResult | IOLM or UI |
| 8 | `verify:bte:consumers` and terminal `verify:bte` | Layers 7A and 7B | exact consumer and terminal aggregate results | lifecycle promotion authority |

Layers 7A and 7B are parallel consumer lanes. Backend core and UI remain
independent; no UI layer appears in this seed.

## Admission Gates

| Gate | Required before | Failure posture |
| --- | --- | --- |
| formation-contract owner accepts v2 grammar/domains/equality and retirement proof | successor formation activation | candidate/local catalogue evidence only; core nonzero |
| profile owner admits `feature-with-independent-node-and-edge-files@1` exact contracts/source layout | successor source set counts as core | compile experiments remain non-admitting |
| node-pattern owner admits exact 13 selected implementation effects | node-kind causal catalogue passes | typed catalogue admission residue |
| relationship/profile owners admit exact 16 family witnesses/effects | relationship/edge catalogues pass | typed relationship admission residue |
| validation owner freezes each exact `O_spec` | O_gen comparison/test materialization | no TestCase emission |
| consumer owner machine contract and fresh run | consumer aggregate inclusion | core remains intact; consumer/terminal fail |

## Plan Regeneration Constraints

Invoke Plan must replace the pre-audit Plan, implementation layering, and work
pack as one consistent bundle. It must:

- preserve current v1 and completed `SWU-BTE-001`/`SWU-BTE-003` receipts;
- create contract/schema validators and red controls before their consumers;
- keep BuildReceipt, ProofReceipt, ReplayResult, and AggregateResult at separate
  altitudes and owners;
- demonstrate evaluator independence through dependency tests;
- never make relationship implementation or terminal green status precede its
  exact admission;
- keep consumer tasks separate from core tasks and UI outside every dependency;
- end at a Task Session handoff only after Plan validation and user selection.

## Frame Expiry

Regenerate Design before Plan continues if any of these change:

- successor profile ID or accepted source-root topology;
- 13-kind, 16-criterion, 13-structure, or 16-family membership;
- the accepted YAML replacement/current-v1 retirement direction;
- canonical minted graph/manifest ownership;
- independent `O_spec`, evaluator, replay, or consumer trust boundary;
- v1 evaluator scope beyond the four bounded interfaces frozen in Design.
