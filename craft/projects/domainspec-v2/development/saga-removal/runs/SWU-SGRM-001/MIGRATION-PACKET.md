---
swu: SWU-SGRM-001
status: frozen-for-execution
decision: DEC-DSD1-SAGA-FORK
source_revision: 7561e08279b4ea3dde6844845f1174d44098f371
mutation_authority: false
---

# Saga Collapse Migration Packet

## Contract

This packet satisfies the planning obligation selected for `SWU-DSD1-009` and
freezes the contract consumed by `SWU-SGRM-002` through `SWU-SGRM-008`. It does
not authorize or perform live authority, implementation, projection, or
historical-evidence mutation.

The accepted owner decision is:

```text
Saga -> Workflow + scope metadata
```

The decision is registry-relative. It retires the current unsupported
first-class distinction; it does not claim that a future evidence package can
never reopen the question.

## Frozen Target

### DS-D1

1. Remove active member `DS-D1.10` and record that identifier as retired.
2. Do not renumber `DS-D1.11` or any later stable identifier.
3. Keep Workflow at `DS-D1.9` as the only orchestration meta-type.
4. Change Workflow's criterion to:

```yaml
criterion:
  scope:
    rule: attribute-one-of
    key: scope
    values: [intra-feature, cross-feature]
```

5. Treat `attribute-one-of` as attestation-reading, not as a structural
   non-collapse witness.
6. Update registry totals by removing one registered backend member while
   preserving all remaining identities.

### DS-D8

Replace the two active `orchestrates` rows with exactly one row:

```yaml
id: orchestrates
source_type: Workflow
target_type: Operation
direction: canonical
multiplicity: one_to_many_ordered
feature_scope: [same-feature, cross-feature]
inverse:
  kind: none
status: active
```

The surviving row must preserve ordered-operation behavior and the existing
`orchestrates` verb. Its semantics and validation obligations must reject
non-Workflow sources and non-Operation targets. It must not retain unsupported
Saga-only participant, compensation, or transaction-safety claims.

### Scope Vocabulary

This migration does not rename the two scope vocabularies:

| DS-D1 attribute | DS-D8 edge scope | Meaning |
|---|---|---|
| `intra-feature` | `same-feature` | Orchestration stays within one feature boundary. |
| `cross-feature` | `cross-feature` | Orchestration crosses feature boundaries. |

## Compatibility Policy

The compatibility mode is **direct internal migration with no permanent Saga
alias**.

Evidence checked for this packet:

| Check | Result |
|---|---|
| Package publication surface | `impl/package.json` is private and versioned `0.0.0`. |
| Release or migration notes | Only a fixture-local feature changelog exists; it does not promise Saga compatibility. |
| Active feature instances | No authored feature instance uses Saga. |
| Generated instances | One internal generated Saga example exists and is assigned to regeneration/removal. |
| Consumer-language scan | Matches were research statements or this removal plan; no accepted external/persisted consumer contract was found. |

This is absence of repository evidence, not proof that no consumer exists. Any
external API, serialized format, persisted record, released package, or
deployed consumer that depends on the Saga token triggers the stop condition
below before authority mutation.

## Active Deletion Table

| Surface | Planned treatment | Owner SWU | Preconditions | Proof |
|---|---|---|---|---|
| DS-D1 member `DS-D1.10` | Remove active member; retain retired-ID receipt. | SGRM-002 | SGRM-001 receipt | Registry diff, stable-ID review, YAML parse. |
| `impl/spec/meta-types/behavioral/saga.md` | Delete active authoring card. | SGRM-004 | SGRM-002 and SGRM-003 | File census and doc validation. |
| `impl/spec/meta-types/behavioral/saga.schema.yml` | Delete active schema. | SGRM-004 | SGRM-002 and SGRM-003 | Content validation and schema census. |
| `impl/spec/__fixtures__/mt/saga-ok.md` | Delete positive fixture after Workflow replacement exists. | SGRM-004 | Cross-feature Workflow positive passes | Fixture census and focused tests. |
| `impl/spec/__fixtures__/mt/saga-bad.md` | Delete negative fixture after Workflow invalid-scope coverage exists. | SGRM-004 | Workflow negative proves missing/unknown rejection | Fixture census and focused tests. |
| `impl/spec/__generated__/instances/saga.example.instance.yml` | Remove by deterministic regeneration after registry change. | SGRM-004 | Generator supports `attribute-one-of` | Clean regeneration diff and instance validation. |

No historical research, decision, refresh, receipt, or telemetry file appears
in this deletion table.

## Rewrite Table

| Surface group | Required rewrite | Owner SWU | Acceptance |
|---|---|---|---|
| Canonical DS-D1 Markdown/YAML and indexes | Remove active Saga member and references; widen Workflow; preserve retired ID and all later IDs. | SGRM-002 | `DS-D1.10` absent actively; `DS-D1.11+` unchanged. |
| Canonical DS-D8 Markdown/YAML | Replace two `orchestrates` rows with one widened Workflow row. | SGRM-002 | Exactly one row; both scopes; ordered multiplicity unchanged. |
| Root README and discovery projections | Present Workflow as the sole scoped orchestration type. | SGRM-002 | No active root claim keeps Saga. |
| Content criterion engine | Add finite `attribute-one-of` parsing, validation, and diagnostics. | SGRM-003 | Both allowed values pass; missing, empty, and unknown values fail. |
| Instance generator | Choose the first allowed value deterministically. | SGRM-003 | Round trip is stable across repeated generation. |
| Non-collapse classifier | Classify `attribute-one-of` as attestation. | SGRM-003 | Focused classification test passes. |
| Workflow schema/card/fixtures | Accept intra-feature and cross-feature; remove Saga distinguisher; add positive and negative scope cases. | SGRM-004 | Content validation and instance round trip pass. |
| Relationship fixtures and validator tests | Cross-feature Workflow passes; Saga source fails; generic non-collapse rules remain. | SGRM-005 | Relationship, tool, type, and full validation pass. |
| Current plans and explanatory projections | Remove active claims, cancel/supersede hardening routes, preserve historical records. | SGRM-006 | Classified current-plan scan and link validation pass. |
| Reference audit and read models | Enforce zero active references with explicit historical/evidence allowances. | SGRM-007..008 | Positive audit and seeded active-failure test pass. |

## Historical Preservation Table

| Class | Treatment | Reason |
|---|---|---|
| `historical-research` | Preserve byte-for-byte unless a separate provenance correction is approved. | Earlier experiments, analyses, and reports remain evidence of what was investigated. |
| `superseded-decision` | Preserve and link supersession; never rewrite as if the earlier choice did not occur. | Decision history must explain why the active direction changed. |
| `telemetry-or-receipt` | Preserve as run evidence. | Receipts and refresh outputs establish prior state and execution history. |
| Governing collapse decision | Preserve as current decision evidence. | It owns the selected route and bounds the claim. |
| Removal plan and run package | Preserve after closeout under an explicit execution-evidence allowance. | The plan necessarily names the concept it removes. |

The per-path classification and preservation reason are authoritative in
`ACTIVE-REFERENCE-MANIFEST.json`.

## Validation Table

| Stage | Required checks | Promotion condition |
|---|---|---|
| SGRM-002 authority | YAML parse, `validate:rels`, `validate:docs`, stable-ID review | One DS-D8 row, no active DS-D1 member, no renumbering. |
| SGRM-003 rule support | Focused tool tests, instances generate/validate, typecheck | Finite scope behavior and deterministic generation proven. |
| SGRM-004 authoring migration | `validate:content`, instance round trip, docs | No active Saga file; Workflow fixture matrix complete. |
| SGRM-005 validators | `validate:rels`, tool tests, typecheck, full `validate` | Workflow cross-feature passes and Saga source fails. |
| SGRM-006 synchronization | Docs validation, current-plan scan, diff check | Current plans agree; history unchanged. |
| SGRM-007 audit | Reference audit plus seeded forbidden reference | Every remaining match classified; injected active match fails. |
| SGRM-008 closeout | Full validate, generation, instance validation, typecheck, reference audit, read-model parse | All receipts and read models agree without inflating authority. |

## Ownership And Approval Table

| Concern | Execution owner | Approval boundary |
|---|---|---|
| Frozen packet and manifest | local fallback through SGRM-001 | Accepted collapse decision plus this bounded Task Session; no live mutation authority. |
| DS-D1 registry and projections | definitions/DS-D1 owner through SGRM-002 | Focused authority diff and stable-ID evidence required before promotion. |
| DS-D8 relationship authority | relationships/DS-D8 owner through SGRM-002 | One-row transformation and relationship validation required before promotion. |
| Criterion engine and generator | local fallback through SGRM-003 | Focused test receipt required before authoring-file deletion. |
| Schema, fixture, and validator migration | local fallback through SGRM-004..005 | Dependency receipts and full package validation required. |
| Current-plan synchronization | plan owners through SGRM-006 | Mutation receipts must exist first. |
| Audit and closeout | local fallback through SGRM-007..008 | Seeded failure, full suite, and read-model reconciliation required. |

## Rollback Table

| Stage | Rollback trigger | Rollback action | Boundary |
|---|---|---|---|
| SGRM-001 | Packet or manifest validation fails | Repair or remove only this run folder. | No live surface changed. |
| SGRM-002 | Parse, relationship, docs, or ID-stability check fails | Revert the focused authority change as one unit and keep later SWUs blocked. | Never restore only one of DS-D1 or DS-D8. |
| SGRM-003 | Criterion behavior or generation is nondeterministic | Revert criterion/generator changes; do not begin file deletion. | Authority may remain staged but cannot promote without implementation support. |
| SGRM-004 | Workflow fixtures cannot replace removed files | Restore deleted active files from the pre-SWU revision and revert Workflow authoring changes together. | Do not leave a partial authoring model. |
| SGRM-005 | Validator migration rejects valid Workflow or accepts Saga | Revert focused validator/fixture changes and reopen SGRM-005. | Keep generic non-collapse coverage intact. |
| SGRM-006 | Historical files changed or plans remain contradictory | Restore historical bytes and revert only current-plan synchronization. | Do not roll back accepted evidence or decisions. |
| SGRM-007 | Audit misses seeded active input or over-rejects history | Remove/revert the audit change and repair its classifier before closeout. | No authority rollback is implied. |
| SGRM-008 | Full recomposition fails | Reopen the owning failed SWU; do not declare completion or rewrite receipts. | Roll back only through recorded focused changes, never by deleting history. |

## Stop Conditions

| Condition | Required response |
|---|---|
| External or persisted Saga consumer evidence appears | Stop before authority mutation and open a compatibility decision gate. |
| Any match cannot be classified | Block SGRM-001/007 until classification and ownership are explicit. |
| A historical/evidence path is proposed for deletion | Block and restore preservation treatment. |
| A change removes the `orchestrates` verb | Block; the contract requires source migration, not edge deletion. |
| A change renumbers identifiers after `DS-D1.10` | Block and restore stable IDs. |
| Owner, validation, or rollback evidence is missing | Do not promote the affected SWU. |
| A permanent alias or compatibility shim becomes necessary | Stop and decision-gate the new compatibility policy. |
| Participant/compensation claims are reintroduced without finite witnesses | Block as authority inflation. |

## Sequence Lock

Execution order is `001 -> 002 + 003 -> 004 -> 005 -> 006 -> 007 -> 008`,
subject to the exact dependencies in `WORK-PACK.md`. Each SWU rebuilds context
from the live repository state and writes only within its declared scope.

## Review Conclusion

The collapse target, compatibility default, deletion and rewrite ownership,
history policy, validation, rollback, and stop behavior are frozen. No open
design choice remains for SGRM-002 to guess. Consequential mutation is still
gated by each mutation SWU's focused review and receipt.
