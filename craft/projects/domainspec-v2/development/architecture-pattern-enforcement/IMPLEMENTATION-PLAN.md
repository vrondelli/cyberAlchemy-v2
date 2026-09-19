---
module: architecture-pattern-enforcement
feature_code: APE
status: candidate-plan-ready
updatedAt: 2026-08-04
docType: implementation-plan
---

# Implementation Plan

## Strategy

Execute one ontology-guided meta-type realization cycle. Close Enum semantics,
properties, profiles, provenance, causal scenario contracts, and composition
graph before writing a source adapter. Use TypeScript to test and freeze the common observation
contract. Only then open Python and Rust independently. Close parity and replay
before generating the next-type recommendation.

## Preconditions

- current DS-D1.3 definition and criterion source digests are readable;
- ontology/profile artifacts are treated as candidate `authority_effect: none`;
- current untracked/modified ontology and BTE files receive exact baseline
  bindings at Task Session admission;
- no BTE L0B work is selected or represented as ready;
- no language package home or tool version is assumed before its owning SWU;
- the operator explicitly selects exactly one SWU after Context Builder emits a
  strict runtime pack.

## Waves

| Wave | Layer | Units | Parallelism | Entry gate | Exit evidence |
| --- | --- | --- | --- | --- | --- |
| W0 ontology closure | L0 | APE-ONT-001..006 | sequential | ONT-001..006 receipts complete | Enum realization/profile/scenario/composition contracts validated |
| W1 TypeScript trust | L1 | APE-ENUM-TS-001, 001A, 001B, 002..004 | sequential | current ONT-001..006 receipts; select TS-001 owner decision | provider-bound profile, frozen shared observation digest, and one replayable TS proof |
| W2 language expansion | L2 | APE-ENUM-PY-001 and APE-ENUM-RS-001 | parallel only after exact user confirmation | TypeScript trust receipt | joined independent Python and Rust receipts |
| W3 parity closeout | L2 | APE-ENUM-PARITY-001 and APE-ENUM-CLOSE-001 | sequential | language lanes joined and closed | bounded Enum completion receipt |
| W4 repeatable expansion | L3 | APE-SCALE-001..004 | sequential | Enum closeout | exact coverage, next-type recommendation, and bounded CI aggregation |

## Algorithms and contracts

### Coverage projection

```text
active = registry.members where status=active and id in backend maturity set
reject DS-D1.10 and every UI candidate/deferred member
realized = ontology realization types with exact canonical_ref.id + digest
for every active id:
  emit exactly one covered or missing row
reject duplicate realization bindings and unknown canonical ids
sort by canonical stable id; normalize; digest
```

The initial expected state is thirteen active backend members and eight missing
realization types. After Enum ontology closure it becomes seven missing. Counts
are diagnostics derived from IDs, never acceptance substitutes.

### Profile resolution

```text
resolve portable ancestors before language child
collect constraints by stable constraint id
if two applicable ancestors assign incompatible values: block conflict
evaluate applicability predicates; preserve owner decision handles
never let document order, filename, or missing data choose a winner
```

### Observation and unsupported algebra

Each required observation yields exactly one of:

- `observed(value, raw_evidence_ref)`;
- `derived(value, derivation_rule, input_refs)`;
- `owner_resolved(value, decision_ref)`;
- `unsupported(reason, construct_ref, owner_route)`.

Missing output is a contract error. Required `unsupported` blocks. N/A is
legal only when an explicit applicability rule and accountable rationale are
bound to the selected profile.

### Enum evaluation

The evaluator needs `required`, `equals`, `one_of`, `matches`, `set_equals`,
`unique`, `non_empty`, and cardinality operators. It validates:

1. the portable closed named-value set;
2. uniqueness and non-emptiness;
3. exact binding to one canonical Enum concept;
4. absence of typed fields, identity, and transitions where the profile exposes
   those observations;
5. language-form constraints only under their language profile.

An operator unsupported by the evaluator blocks before a conformance verdict.

### Enum composition graph

```text
leaf representation unit:
  emit one observed implemented-members fact with exact source selector

composite representation unit or Enum root:
  resolve named component bindings through the selected provider
  reject unresolved component, duplicate edge, cycle, or repeated diamond contribution
  derive the normalized member set from exact component fact IDs
  reject duplicate member key or value
  preserve component order only in raw evidence; compare Enum meaning as a set
```

The observation projection carries typed subjects and provenance-bearing
relations. `architecture.composed_from` is acyclic and has
`authority_effect: none`. Representation units are implementation evidence,
not canonical Enum identities.

### Causal scenario and BTE bridge

Every scenario binds stable operation, base and mutant handles, immutable
pre/post expectation handles, mutation lineage, recomposition partitions and
scopes, a total frozen-case/result join, and expected diagnostic/delta. BTE may
consume this contract only through its own refreshed provider route. APE never
patches result values from case IDs or prose.

### Parity

```text
required = portable obligations applicable to Enum
for each language receipt:
  require same design/profile/observation digests
  require exact required obligation id set
  reject missing, extra, duplicate, unsupported-required, or stale evidence
compare normalized semantic outcomes and applicability
retain raw native differences
```

## Validation strategy

1. canonical coverage and tombstone/UI exclusion checks;
2. ontology schema, inheritance, source-ref, applicability, conflict, and
   authority-effect checks;
3. Enum positive, negative, non-collapse, and unsupported fixtures;
4. scenario lineage, recomposition, expectation, and result-join tests;
5. TypeScript AST/module/native type evidence and exact-cause mutants;
6. Python AST/import/native type evidence after toolchain pinning;
7. Rust module/native compiler evidence after toolchain pinning;
8. exact obligation parity and deterministic normalized replay;
9. current APE/ontology/BTE regression commands within their original claim
   ceilings;
10. scoped whitespace, JSON/YAML parse, links, and dirty-worktree review.

## Stop conditions

Stop for canonical semantic drift, missing profile owner, ontology authority
inflation, duplicate/unknown realization binding, profile conflict, missing
provenance, unsupported required evidence, BTE provider mismatch, unfrozen or
changed shared contract, unjoined language lane, raw evidence loss,
non-deterministic output, dirty overlap without exact adoption, or public/private
boundary crossing.

## Migration and compatibility

The old APE continuation order is superseded but preserved. Completed evidence
is indexed in `HISTORICAL-EVIDENCE-MAP.md`. No historical receipt is rewritten.
BTE L0A remains a candidate provider primitive; BTE L0B and future tasks remain
owned by the BTE work pack until a provider-contract refresh is admitted.

## Performance posture

No budget is accepted until package homes, tools, fixtures, corpus sizes, and
warm/cold protocols are pinned. Each adapter records wall time, file count,
cache state, tool versions, and unsupported count. Performance residue cannot
weaken semantic or evidence requirements.
