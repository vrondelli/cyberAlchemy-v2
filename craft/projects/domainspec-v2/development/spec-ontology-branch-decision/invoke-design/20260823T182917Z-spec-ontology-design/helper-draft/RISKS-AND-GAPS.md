# Specification-Ontology Design Risks and Gaps

## Risk register

| ID | Risk / trigger | Consequence | Design containment | Closure owner/evidence | Status |
| --- | --- | --- | --- | --- | --- |
| `R-01` | `formalizes` or `derived_from` is assumed active vocabulary | unowned semantic edges enter canonical graphs | keep labels candidate-local; require DS-D2/DS-D8 exact admission and non-collapse review | definitions/relationship owner receipt over exact bytes | open-owner-gate |
| `R-02` | formal-claims role is treated as a new authority kind | authority model expands without ratification | explicit per-claim assignment under primary-source authority | authority-model and primary-source owner acceptance | open-owner-gate |
| `R-03` | specification composition edits or supersedes claim meaning | composition owner absorbs semantic authority | immutable exact claim refs and new specification versions for membership changes | formal-claims and composition owner negative witness | planned-witness |
| `R-04` | business fidelity key is treated as formal proof or formal key as business authority | two owners collapse | disjoint receipt scopes over identical bytes and independent currentness | two exact owner receipts plus relation validator | open-owner-gate |
| `R-05` | provenance detail is incomplete, mutable, or stale | obligations cannot be reproduced or challenged safely | hybrid exact edge plus immutable content-addressed context; any change creates new version | validation-governance schema and negative witnesses N06/N07 | open-owner-gate |
| `R-06` | generated integrated graph becomes convenient source of truth | projection launders authority | one-way dependencies, exact manifest, visible `authority_effect: none`, reject projection input | projection-owner contract and witnesses P04/N08/N09 | planned-witness |
| `R-07` | central aggregate reinterprets or masks an owner result | local semantic failure becomes false success | sealed typed receipts, ordered stop, first non-pass propagation | aggregate owner contract and N12 | planned-witness |
| `R-08` | passing evaluator receipt is treated as discharge | evidence self-promotes | distinct evidence and lifecycle records; explicit forbidden transition | proof/evidence lifecycle owner and N10 | open-owner-gate |
| `R-09` | CAV2-local syntax acceptance is treated as DomainSpec adoption | TOP-03 is claimed without second owner | bind exact candidate version/digest and block until independent DomainSpec decision | DomainSpec syntax adoption receipt | blocked |
| `R-10` | current `business.FormalClause` is relabeled in place | prototype history and owner identities are corrupted | migration-only posture, frozen pre/postimage and new immutable target versions | affected source, formal, relationship, and migration owners | blocked |
| `R-11` | owner catalog contains duplicated propositions | canonical responsibility fragments | narrowest-owner assertion rule and generated equivalents only | catalog owner validation against D27 | open-owner-gate |
| `R-12` | private source content enters a generated/public view | public/private boundary breach | classification, audience, filter, publishing principal, source-owner authorization bound to manifest | privacy/source/publication owner receipts | blocked-for-publication |
| `R-13` | placeholder IDs or claim ceilings from the illustrative scenario are mistaken for real records | design fiction gains apparent evidence | explicit placeholder labels; exact materialization required before acceptance | parent package review | contained-candidate |
| `R-14` | Design completeness is treated as implementation readiness | planning/execution bypasses owner gates | transport requires exact owner admission and fresh authorization | parent Invoke result and continuation gate | blocked |

## Protected gaps

### `G-OWNER-ADMISSION`

No named semantic, protocol, relationship, lifecycle, projection, validation,
promotion, or publication owner has accepted the exact candidate contracts.
This blocks canonical application but does not block completion of the Proposer
draft.

Closure requires machine schema bytes, one exact package inventory and digest,
non-collapsing owner requests, current receipts from every affected owner, and
fresh validation after any changed byte.

### `G-MIGRATION`

The current prototype preimage, target postimage, identity mapping, compatibility
rules, and rollback behavior are not frozen. Migration is not authorized.

Closure requires an exact affected-byte inventory, pre/postimage digests,
separately accepted semantic mappings, negative controls, and a reversible
owner-approved migration contract.

### `G-EXECUTION`

The validators, aggregate, projection compiler, positive fixtures, and twelve
negative fixtures are planned only. No executed receipt exists.

Closure requires a separately authorized Plan and implementation, deterministic
execution over exact staged-equivalent bytes, preserved command failures, and
owner-reviewed receipts. Execution evidence still would not itself discharge,
promote, or publish.

## Survivable Design residue

- exact physical storage paths and package boundaries;
- concrete schema serialization choice beyond the required field contracts;
- runtime/language for validators and projection compiler;
- query and human-view presentation details;
- optional generated inverse labels.

These can remain open through Design because they do not change the selected
identity, authority, provenance, or validation architecture. They must be
resolved before their corresponding Plan or owner admission.

## Fatal-to-continuation residue

- an unresolved accepting authority route for any candidate semantic contract;
- any proposal to use a projection as canonical input;
- any attempt to centralize owner semantic interpretation;
- missing two-key equality or missing derivation context;
- a migration without exact pre/postimages;
- public output without classification, audience, channel, publishing
  principal, and exact source-owner authorization.

Encountering any item above must fail closed.
