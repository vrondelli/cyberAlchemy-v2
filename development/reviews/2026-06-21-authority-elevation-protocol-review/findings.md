# Authority Elevation Protocol Review - Findings

Dispatch: `2026-06-21-authority-elevation-protocol-review`
Status: `KEEP-with-fixes`
Authority effect: design direction only; no canonical definition, constitution rule, schema, source row, or implementation mutation is promoted by this review.

## Reviewed Inputs

- `cyberAlchemy-v2/development/refinement-runs/20260621T030752Z-definition-promotion-governance/RESULT.md`
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`
- `cyberAlchemy-v2/authority/promotion-policy.md`
- `cyberAlchemy-v2/authority/definitions/DEFINITION-TOWERS.md`
- `cyberAlchemy-v2/authority/definitions/source-clusters/arcanum.md`
- `cyberAlchemy-v2/development/reviews/2026-06-21-authority-elevation-protocol-review/attacks.md`

## Consensus

A promotion gate is the owner route or event that decides whether a candidate may become local authority. Elevation is a governed source-to-target movement relation that remains non-canonical until a promotion gate passes.

The broader umbrella should be `authority movement protocol`. `Definition elevation protocol` is not the umbrella; it is the definition-specific profile of that broader protocol.

Evidence basis:

- `RESULT.md:10-20` names the earlier mechanism as definition elevation by typed adaptation and requires source pointer, tower need, semantic delta, owner gate, origin back-reference, and drift state.
- `DEFINITIONS.md:184-192` defines a promotion gate as the owner route that lets evidence, candidate meaning, practices, or structural rules become local authority, implementation work, or standalone repository material.
- `source-clusters/arcanum.md:13-19` says Arcanum definitions may be represented locally, but not redefined or promoted into v2 canon except through explicit v2 adaptation and definitions-governance.

## Decision

Use the generic protocol scope for authority-bearing artifacts, but mark it as design-scope until artifact-kind lifecycle rules exist.

Covered design scope:

- definitions
- schemas and specs
- constitutions
- axioms
- disciplines
- methods
- governance artifacts
- inventory
- ontology

Boundary:

- inventory and ontology may represent, condense, route, or request promotion;
- inventory and ontology do not promote authority by themselves;
- definitions, constitutions, runtime contracts, and public claims remain gated by their owner routes.

Evidence basis:

- `DEFINITIONS.md:190-192` says claims crossing from inventory, ontology, research, observability, or memory into definitions, constitutions, specs, capabilities, implementation, or public-facing material need a promotion gate.
- `DEFINITIONS.md:922-940` says ontology condenses candidate knowledge and promotion requests without becoming automatic authority.
- `DEFINITION-TOWERS.md:307-312` says inventory and ontology reduce search and condense candidate meaning but do not promote authority.

## Generic Protocol Shape

The next design primitive should be an `authority_relation_record` plus an `authority_relation_registry`.

Minimum record fields:

```yaml
artifact_kind: definition | schema | spec | constitution | axiom | discipline | method | governance | inventory | ontology
artifact_name: string
sources:
  - context: string
    ref: path-or-id
    revision_or_snapshot: string
    role: source-authority | evidence | example | conflicting-source
target_context: string
target_ref: path-or-id
target_scope: string
applicability_basis: string
relation_mode: adopts_without_delta | adapts_with_delta | specializes_for_context | inherits_under_source_authority | elevates_to_higher_context | rejects_for_context | defers_pending_evidence
movement_kind: adoption | adaptation | specialization | inheritance | elevation | rejection | deferral
gate_verdict: candidate | promoted | rejected | deferred | local_only
use_mode: source-authority | local-representation | adaptation-candidate | promotion-evidence | local-canon | read-model | structural-rule-candidate
semantic_delta: string
structural_delta: string
enforcement_delta: string
evidence_confidence: direct | synthesized | inferred | contested | unknown
commitment_confidence: experimental | provisional | stable | constitutional
conflict_status: none | reconciled | partial | unresolved
boundary_review_ref: string
decision_owner: string
drift_trigger: source_revision_change | target_policy_change | date | manual_review
drift_owner: string
```

The registry must define each relation name, aliases, endpoint types, ownership effect, required gate, inheritance permissions, boundary requirements, and drift owner.

## Definition Profile

Definition elevation is the first artifact-kind profile:

```text
source definition
  -> local representation / source-cluster row
  -> tower-scoped adaptation candidate
  -> owner promotion gate
  -> local canonical definition
  -> origin back-reference and drift state
```

Required definition-profile conditions:

- preserve source authority;
- name the tower-level need;
- state the local semantic delta;
- preserve an origin constraint before promotion;
- pass definitions-governance before canonical wording is written;
- record origin back-reference and drift state after promotion;
- never overwrite or silently absorb the source definition.

For the concrete `schema` example, Arcanum `DEF-ARC-SCHEMA` remains Arcanum authority unless CyberAlchemy v2 defines and promotes a distinct local adaptation such as `authority schema` or `tower schema`.

## Blocks

The review keeps these blocked or design-only:

- canonical promotion of the protocol terms;
- constitution-level enforcement;
- task-session mutation;
- relation-record or promotion-record schema implementation;
- source-cluster mutation;
- public derivatives;
- any claim that inventory or ontology can promote authority;
- any promotion with unknown source authority.

Unknown source authority may still allow representation, search, or inventory staging with flags. It blocks promotion.

Required unblockers:

- relation schema;
- relation-name registry;
- boundary-review checklist covering content, obligations, examples, naming, and source path class;
- decision-gate contract for owner conflict, public/private conflict, scope, naming, and promotion disputes;
- artifact-kind lifecycle matrix with allowed states, transitions, owner gates, evidence, mutation scope, block conditions, and drift owners.

## Next Routes

1. Run `definitions-governance` for vocabulary/design only:
   - `authority context`
   - `authority movement`
   - `elevation`
   - `promotion`
   - `adaptation`
   - `inheritance`
   - `origin constraint`
   - `origin back-reference`
   - `authority_relation_record`
2. Run `constitution-governance` to decide lifecycle and gate rules for artifact kinds.
3. Only after those owner routes pass, run `task-session` to implement record schemas, promotion schemas, or source-cluster origin rows.

## Final Review Verdict

Keep the writer synthesis as a non-executed design direction with the verifier fixes above.

Do not say "promote now." Say: recommend a definitions-governance route for vocabulary and design. Promotion remains an owner-gated future action.
