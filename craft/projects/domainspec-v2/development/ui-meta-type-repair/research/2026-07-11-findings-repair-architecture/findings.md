---
artifact_id: UIF-REPAIR-ARCHITECTURE-FINDINGS-v0.1
dispatch_id: 2026-07-11-uif-findings-repair-architecture-research
status: accepted
created: 2026-07-11
writer: Mac Lane, Saunders
final_approver: Vlachopulos, Ioannis
auditor_verdict: ACCEPT
authority_boundary: research findings and Invoke source contract only; no candidate, validator, DS-D1, or DS-D8 mutation
promotion_eligible: false
---

# UIF Findings Repair Architecture

## One-Line Answer

Adopt seven narrowly bounded evidence contracts in dependency order. They
repair UIF-010 evidence production without establishing replication, type
identity, activation, promotion, or relationship authority.

## Verdict Matrix

| Solution | Owner / precedent | Witnessed? | Sound? | Terminal verdict |
| --- | --- | --- | --- | --- |
| S1 nonempty predicate | Validator contract owner; existing table-walk and instance paths | Yes: `attribute-present` checks existence and accepts blanks. | Yes only as candidate-selected `attribute-nonempty/v1`; uniqueness remains gated. | **ACCEPT-NARROW:** build-from-owned pattern/new rule contract |
| S2 mutation ledger | Repair evidence harness owner; existing round-trip runner | Partly: 52 deletions reported, only 9 persisted; blank defect reproduced. | Yes as immutable base generation; 165 cases are mandatory but incomplete. | **ACCEPT-NARROW:** new evidence composition |
| S3 reroute receipt | Local validator owner plus named external destination owner | Partly: source rejection exists; destination results are incomplete. | Yes only as two-sided source/destination shape evaluation. | **ACCEPT-NARROW:** external outcomes remain pending |
| S4 formation-evidence dossier | DS-D1 formation owner | Yes as a finite conjunctive adjudication pattern, not candidate identity proof. | Yes when evidence planes remain independent and no weighted score is used. | **ACCEPT-NARROW:** formation-evidence adjudication dossier |
| S5 corpus receipt | Empirical-review owner | Yes for bounded Body War/Savvy observations and immutable provenance fields. | Yes if source facts remain separate from reviewer projections. | **KEEP:** novel-attempt corpus receipt |
| S6 relationship-owner packet | DS-D8 or other declared relationship owner | Yes as a finite handoff shape; no owner adjudication is complete. | Yes only as an owner handoff with prohibited inferences. | **ACCEPT-NARROW:** owner handoff only |
| S7 orchestration index | UIF repair evidence owner | Yes as append-only generation and replay coordination. | Yes as an index over separately owned receipts, not a new authority engine. | **ACCEPT-NARROW:** novel orchestration index |

No component is killed. The current boundary remains zero survivors: all nine
candidates are deferred, including Form and Action; none is replicated,
narrowed, demoted, active, authoritative, or promotion-ready.
`EVIDENCE-COMPLETE` may open another experimental or owner route only.

Evidence: `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:138-143`
and `projects/domainspec-v2/development/ui-meta-type-formalization/replication/REPLICATION-MATRIX.md:27-32`.

## Architecture And Dependency Order

1. **Contract kernel:** proposed serialization, digest, case-ID, outcome,
   code-version, and manifest contracts.
2. **Rule adapter:** preserve `attribute-present`; add candidate-selected
   `attribute-nonempty/v1`; update Markdown validation, generated-instance
   validation, generation, and total rule classification together.
3. **Evidence producers:** mutation ledger, two-sided reroute receipt, corpus
   receipt, and relationship-owner packet. These remain separately addressable.
4. **Formation adjudication:** consume producer receipts through a conjunctive
   dossier without merging their authority planes.
5. **Orchestration index:** index immutable generations, predecessor lineage,
   invalidation reasons, receipt handles, and replay status without overwriting
   prior UIF evidence.

```text
contract-kernel
  -> rule-adapter
  -> mutation-ledger ---------\
  -> reroute-receipt ----------\
  -> corpus-receipt ------------> formation-dossier -> orchestration-index
  -> relationship-owner-packet-/
```

The mutation base and corpus receipt can proceed independently.
Duplicate/conflict extensions depend on a separate owner/design decision. The
dossier cannot close while a required external destination, formation witness,
corpus bound, or owner decision remains pending.

## Chosen Contracts

### Shared Contract Kernel

- `canonical-json-v1` is a proposed canonical semantic serialization contract;
  its exact rules require design validation and owner ratification.
- `sha256-v1` is the proposed digest algorithm identifier. Every digest carries
  its algorithm version.
- `content_digest` covers canonical semantic content only. Timestamps,
  predecessor links, invalidation reasons, and chronology are excluded.
- Lineage is separate: `generation_id`, `predecessor_generation_id`, input
  receipt handles, and `invalidation_reason`.
- Same content plus the same predecessor is the same successor or a no-op.
- Parity means equal normalized outcomes and stable violation codes across
  Markdown and generated-instance paths, not identical implementations.
- The violation-code namespace and vocabulary remain a design gate.

### S1 - Rule Contract

- Preserve global `attribute-present` semantics.
- Add `attribute-nonempty/v1` for a present value containing at least one
  non-whitespace character.
- No candidate selects the rule before generation, both validators, and total
  rule classification support it.
- `attributes-unique`, duplicate-key behavior, precedence, and duplicate
  mutation count remain gated.
- Raw-input duplicate detection must be considered because parsing can discard
  duplicate evidence.

Evidence: `projects/domainspec-v2/impl/tools/validate-content.ts:119-130,205-242`
and `projects/domainspec-v2/impl/tools/instances.ts:115-143,246-269`.

### S2 - Mutation Ledger

The mandatory base is exactly 165 infrastructure cases:

```text
52 deletion
52 empty
52 whitespace-only
 9 wrong-fixed-value
---
165 mandatory base cases
```

This is not complete evidence. Applicable conflicts, duplicate orders, label
erasure, criterion erasure, and neighbor reconstruction are typed extensions
requiring finite enumeration. Each result records stable case ID, semantic
input digest, fixture digest, expected and observed outcome/code, validator
contract version, and receipt handles.

Evidence: `projects/domainspec-v2/development/ui-meta-type-formalization/candidate-meta-types/ui/round-trip-candidates.ts:37-70`
and `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:54-60`.

### S3 - Two-Sided Reroute Evaluation

The same normalized specimen is evaluated under two independently invoked
contracts:

- source: `rejected | accepted | invalid`;
- destination: `shape-accepted | rejected | pending-owner | not-testable`;
- record: `complete | invalid`;
- destination handle, authority digest, evaluator, and contract versions.

Source rejection alone is not rerouting. Local shape completion requires source
rejection plus independent destination shape acceptance. `pending-owner` closes
only the handoff record, never destination proof or semantic identity.

Evidence: `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:62-70`.

### S4 - Formation-Evidence Adjudication Dossier

The dossier is conjunctive and requires:

- independent positive;
- stable contrast;
- label and criterion erasure;
- changed downstream consequence;
- closed typed negatives;
- corpus-bound portability evidence;
- owner firewall.

Missing or disputed evidence yields `DEFER`. A finite source-backed zeroing fact
may mark only the present dossier `DOSSIER-ZEROED`. Only the DS-D1 owner may
later decide type KILL, merge, formation, or promotion. Shared hygiene such as
uniqueness is not a separating witness.

Evidence: `projects/domainspec-v2/research/2026-07-02-first-class-category-boundary/findings.md:22-41`
and `projects/domainspec-v2/development/ds-d1-improvement-plan/research/2026-07-11-saga-existing-evidence-adjudication/findings.md:35-47`.

### S5 - Corpus Receipt

Pin revision, repository-relative path, file digest, selector, excerpt digest,
extractor/version, corpus, implementation style, literal observations,
omissions, prohibited inferences, and reviewer projections as separate fields.
Use `not-observed` until a bounded absence rule is approved;
`observed-absent` is unavailable. Source facts never absorb reviewer projection
or invented DomainSpec metadata.

### S6 - Relationship-Owner Handoff

Name authority state, exact question, affected signatures, finite candidate
options, positive and negative instances, required changed consequence, owner,
closure evidence, and prohibited inference. The packet resolves nothing and
does not delimit the owner's full option space.

Evidence: `projects/domainspec-v2/development/ui-meta-type-formalization/replication/findings.md:80-86`
and `projects/domainspec-v2/definitions/relationships/relationships.yml:404-433,500-518`.

### S7 - Orchestration Index

Append immutable generation entries and receipt handles. The index references,
but does not copy or own, mutation, corpus, reroute, dossier, and handoff
records. Mechanical replay compares canonical semantic fields and input digests
while excluding volatile timestamps. Human correspondence and dossier decisions
are versioned and traceable, not required to reproduce byte-identically.

## Rejected Typed Negatives

| ID | Rejected claim |
| --- | --- |
| TN-01 | Strengthen global `attribute-present` to reject blanks. |
| TN-02 | Add candidate-only sidecar semantics or a nested criterion DSL. |
| TN-03 | Treat the 165-case base as complete. |
| TN-04 | Resolve duplicate behavior before a raw-input owner/design decision. |
| TN-05 | Treat source rejection, destination labels, or owner acknowledgement as destination acceptance. |
| TN-06 | Treat the nine-candidate matrix as a closed destination universe. |
| TN-07 | Treat validation, mutation, reroute, or corpus completeness as semantic identity. |
| TN-08 | Treat DS-D8 endpoint participation as DS-D1 formation authority. |
| TN-09 | Use labels, filenames, framework symbols, authored criteria, or normalization defaults as independent witnesses. |
| TN-10 | Use weighted scoring to compensate for a missing dossier gate. |
| TN-11 | Convert `not-observed` into absence without a bounded-search rule. |
| TN-12 | Combine semantic content and lineage into one digest or use timestamps as identity. |
| TN-13 | Overwrite prior receipts or latest-generation evidence in place. |
| TN-14 | Treat `EVIDENCE-COMPLETE` as replication, activation, authority, promotion, or execution approval. |

## Resolved And Unresolved Decisions

Resolved by research review:

- preserve `attribute-present`;
- introduce a versioned candidate-selected nonempty rule;
- require outcome/code parity;
- require the incomplete 165-case base;
- use two-sided reroute evaluation;
- separate content digest from lineage;
- preserve independent evidence domains;
- keep all candidates deferred;
- use append-only generations;
- route relationship questions only through owner handoffs.

Still open behind explicit owner/design gates:

- `attributes-unique`, raw duplicate policy, deterministic precedence,
  duplicate mutation set, and finite conflict enumeration;
- generated-fixture durability versus byte-identical regeneration;
- violation-code vocabulary and unknown-rule strictness;
- ratification of canonical serialization and digest normalization;
- neutral-observation vocabulary, bounded absence, corpus/style diversity,
  portability threshold, reviewer count, `not-applicable`, and excerpt storage;
- whether Form/Action evidence is an independent positive or only grounds
  another evidence round;
- Component umbrella, Hook framework vocabulary, framework destination
  namespace, and Binding node/relation questions;
- Action-source, Hook-Binding, Guard-target, Guard alternatives, Binding
  survival/collapse, and finite DS-D8 alternatives;
- whether reviewed correspondence closes destination identity or only supplies
  evidence to a later owner gate.

## Invoke Define/Design/Plan Source Contract

Target: `projects/domainspec-v2/development/ui-meta-type-repair/`.

### Define

Consume this audited finding, UIF-010 findings, the Inventory lookup, and open
owner/design gates. Emit `SPEC.md`, `GLOSSARY.md`, source/evidence contracts,
acceptance criteria, prohibited inferences, strict authority boundary, decision
ledger, and unresolved-gap ledger. Define may seed L0 but cannot produce
mutation-ready work.

### Design

Emit `ARCHITECTURE.md` with six required views:

1. Context.
2. High-level structure.
3. Low-level components.
4. Workflow process.
5. Decision flow.
6. Dependency interfaces.

Also emit glossary consistency, interface contracts, risks, decision log,
dependency map, design transport, and L0-L3 seed. Design creates no work-pack
tasks.

### Plan

Emit `IMPLEMENTATION-LAYERING.md`, split `WORK-PACK.md` plus `work-pack/`, and
`EXECUTION-PACK.md`. Include Dispatch Spec technique trace, validation per
slice, Distill verdict, recomposition proof, blockers, and Task Session handoff.

The ten units are infrastructure and contract SWUs, not candidate count:

| SWU | Layer | Unit | Dependencies |
| --- | --- | --- | --- |
| SWU-UIR-001 | L0 | Serialization, digest, lineage, ID, outcome, and code-version contracts | none |
| SWU-UIR-002 | L0 | `attribute-nonempty/v1`, total rule registration, and outcome-code parity | 001 |
| SWU-UIR-003 | L0 | Owner/design gates for duplicates, conflicts, unknown rules, and codes | 001 |
| SWU-UIR-004 | L1 | Immutable 165-case mutation ledger; gated extensions only | 001, 002; extension waits on 003 |
| SWU-UIR-005 | L1 | Two-sided reroute receipt and external-pending handoff | 001, 002 |
| SWU-UIR-006 | L1 | Corpus receipt and bounded missing-evidence states | 001 |
| SWU-UIR-007 | L1 | Relationship-owner packet without DS-D8 mutation | 001 |
| SWU-UIR-008 | L2 | Formation-evidence dossier and adjudication states | 004, 005, 006, 007 |
| SWU-UIR-009 | L2 | Orchestration index, invalidation, and deterministic replay | 001, 004-008 |
| SWU-UIR-010 | L3 | Integrated parity/replay/negative audit and gated Task Session handoff | 001-009 and acceptance-critical owner gates |

Every SWU requires one parent task, source anchors, dependencies, write scope,
done criteria, acceptance evidence, validation surface, execution owner, and
handoff note. L0 proves representable contracts; L1 proves repeatable evidence
production; L2 proves governed composition and replay; L3 proves package/audit
readiness, not candidate promotion.

## Strict Boundary

This finding authorizes Invoke authoring only. It does not edit candidates,
schemas, validators, generated instances, DS-D1, DS-D8, relationship authority,
canonical definitions, or prior UIF evidence. It settles no owner/design gate.
Mutation may begin only through a later approved Task Session SWU with strict
write scope and acceptance evidence.
