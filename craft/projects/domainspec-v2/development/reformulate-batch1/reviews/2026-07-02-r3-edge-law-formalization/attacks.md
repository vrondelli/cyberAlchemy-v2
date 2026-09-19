---
node_type: review-attacks
is_session: true
status: complete
dispatch_id: 2026-07-02-r3-edge-law-formalization-review
dispatch_type: review
target: R3 edge-law formalization
created: 2026-07-02
---

# R3 Edge-Law Formalization Review - Attacks

## Review Boundary

This dispatch reviewed the existing R3 edge/relationship formalization surface. It did not edit canonical
R3 files. The target was verified change requests for formalizing `RELATIONSHIPS.md`, DS-D2/DS-D8, and
the validation gates.

Artifacts attacked:

- `projects/domainspec-v2/development/reformulate-batch1/{DESIGN.md,WORK-PACK.md}`
- `projects/domainspec-v2/development/meta-type-formalization/{DEFINE.md,DESIGN.md,WORK-PACK.md}`
- `projects/domainspec-v2/development/meta-type-definitions/{DEFINE.md,DESIGN.md,CANDIDATES.md,WORK-PACK.md}`
- `projects/domainspec-v2/definitions/DEFINITIONS.md`
- `projects/domainspec-v2/definitions/meta-types/{meta-types.md,meta-types.yml}`
- `projects/domainspec-v2/.craft/ledger.yml`
- `projects/domainspec-v2/impl/spec/{RELATIONSHIPS.md,TAXONOMY.md,features/sample/SPEC.md}`
- `projects/domainspec-v2/impl/spec/meta-types/**/*.schema.yml`
- `projects/domainspec-v2/impl/tools/{validate-relationships.ts,validate-content.ts}`
- `projects/domainspec-v2/impl/tools/tests/*`
- `projects/domainspec-v2/impl/governance/tags/tools/**`

Command evidence verified by the parent:

| Command | Result |
| --- | --- |
| `cd projects/domainspec-v2/impl && npm run validate:rels -- --features-root spec/features --relationships spec/RELATIONSHIPS.md` | PASS, `1 specs checked`, `canonicalEdges=29` |
| `cd projects/domainspec-v2/impl && npm run validate:content` | PASS, `0 concept(s) checked in 1 file(s); schemas=14` |
| `cd projects/domainspec-v2/impl && npm run tools:test` | PASS, `20/20` |
| `cd projects/domainspec-v2/impl && npm run validate:rels -- --features-root test-derivation-engine/__fixtures__/agent-execution-orchestrator --relationships spec/RELATIONSHIPS.md` | PASS, `1 specs checked`, `canonicalEdges=29` |
| `cd projects/domainspec-v2/impl && npm run tags:validate` | FAIL, `CT-VAL-000` missing `governance/tags/code-tags.json` |

The `tags:validate` failure is not a review failure; it narrows the claim. Code-tag tooling has endpoint
parsing precedent, but it is not currently a live default R3 validation gate.

## Attacker Returns

### Governance/Fidelity Lane

Surviving findings:

- R3 acceptance still hard-codes new edge count `>29`, while the closed edge-law admits collapse/widen/property
  outcomes.
- `RELATIONSHIPS.md` still carries `enforces-cross`, `applies: Policy -> Operation`, and
  `queries: Query -> Entity` despite the accepted rulings to collapse/widen/reconcile these cases.
- MT3b and definition work still speak in places about "29 signatures" even though R3 owns the resolved
  DS-D2/DS-D8 signature set.
- R7/definition routing still has stale `impl/spec/DEFINITIONS.md` references, while DD-D3 already resolved
  Tier 1 to root `definitions/DEFINITIONS.md`.
- DS-D8 versus `domainspec-v2-D9` remains alias-unclear.

Demoted:

- Per-edge approval after R3 is lifecycle guidance and belongs under the definition/promotion finding, not a
  standalone finding.

### Typed-Graph/Closure Lane

Surviving findings:

- `RELATIONSHIPS.md` is human-readable shorthand, not an authoritative finite edge-signature relation.
- Forbidden/unconstructible closure cannot be derived from the current documents or validator path.
- R3 acceptance conflicts with the accepted edge-admissibility rulings.
- DS-D8 is not yet a machine read model.

Demoted:

- Event payload/publisher ambiguity is a real R3-P3 design decision, but it should not block endpoint
  enforcement for already-unambiguous edges such as `enforces`, `contains`, `produces`, `queries`, and
  `applies`.

### Validator/Mechanics Lane

Surviving findings:

- `validate-relationships.ts` checks only canonical edge-label membership.
- `validate-content.ts` checks node criteria, not edge signatures; `validate:content` is not part of the
  aggregate `validate` gate yet.
- The default sample feature has no relation declarations, so R3 endpoint validation is vacuous.
- The AEO fixture contains wrong-endpoint canonical labels that `validate:rels` still accepts:
  `AssemblePipelineRoute` is an `Operation` but uses `enforces` against `StageContract` (`Value Object`);
  `RunStateMachine` is a `State Machine` but uses `enforces` against `ExecutePipelineRoute` (`Operation`).

Demoted:

- "No endpoint parser exists anywhere" was narrowed. Code-tag tooling parses signature tables and checks
  endpoint types, but that precedent is not currently wired as the R3 relationship/content validation gate.

## Verifier Outcomes

| Finding | Verdict | Verifier Notes |
| --- | --- | --- |
| F1 - R3 validation path lacks machine-enforceable endpoint signatures | NARROW / SURVIVE | Default R3 validation is label-only. Narrowed because code-tag tooling has endpoint-parser precedent. |
| F2 - R3 acceptance is stale against edge-admissibility rulings | SURVIVE | Literal conflict between `>29`/add-edge acceptance and closed collapse/widen/reject decisions. |
| F3 - Forbidden/unconstructible closure is not derivable or tested | SURVIVE | AEO fixture confirms wrong endpoints pass `validate:rels` when the label is canonical. |
| F4 - Definition/promotion routing drift at R3 boundary | NARROW / SURVIVE | No two live canonical homes found; root definitions are intended. The issue is stale routing plus DS-D8/D9 alias drift. |

No CRITICAL findings survived verification. All surviving findings are MAJOR review findings: load-bearing
formalization gaps, validator gaps, or routing drift, but not proven record corruption or direct execution
breakage.

## Dropped Or Merged Items

| Item | Disposition | Reason |
| --- | --- | --- |
| Event payload/publisher ambiguity | Demoted to R3-P3 design decision | Real but not blocking endpoint enforcement for already-unambiguous edges. |
| `Operation -> ValueObject` returns | Merged into F2 | Needs R3 reconciliation as edge vs property/signature; not standalone after verification. |
| Individual `queries`, `applies`, `enforces-cross` mismatches | Merged into F2 | Symptoms of stale R3 acceptance against the governing decision. |
| "No real DS-D8 authority exists" | Merged into F1 and F4 | Same root issue: missing signature authority and unclear promotion route. |
| Bulk DS-D2 approval risk | Merged into F4 | Lifecycle consequence of routing/ownership drift. |
