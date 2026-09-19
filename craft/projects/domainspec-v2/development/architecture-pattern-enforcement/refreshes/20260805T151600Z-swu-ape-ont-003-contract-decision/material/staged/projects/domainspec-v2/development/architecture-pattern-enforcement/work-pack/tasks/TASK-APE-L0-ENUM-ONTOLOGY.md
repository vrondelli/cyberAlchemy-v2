# TASK-APE-L0-ENUM-ONTOLOGY — Close the Enum architecture contract

Layer: L0. Wave: W0. Status: nearest task; no SWU selected.

## Objective

Represent active `DS-D1.3 Enum` in the candidate architecture-property model,
including portable properties/operators, language-profile applicability,
provenance/conflict rules, and a causal scenario contract that BTE can later
adopt without inventing semantics.

## Inputs

- current `definitions/meta-types/meta-types.yml` and Enum criterion schema;
- current ontology, profiles, projection, examples, and validator;
- `PROPERTY-EVALUATION-MODEL.md`, `RUNTIME-PROFILE.md`, and
  `TRACEABILITY-AND-DRIFT.md`;
- BTE independent-owner blocker receipt;
- APE Design and this task contract.

## Algorithm

1. Bind exact canonical Enum ID, source selector, criterion path, versions, and
   digests.
2. Add a candidate `architecture.EnumImplementation` extending
   `architecture.DomainConceptImplementation`; declare `authority_effect: none`
   and non-collapse against Value Object and State Machine.
3. Add typed properties for closed named values, unique/nonempty cardinality,
   representation class, and forbidden structure observations.
4. Add generic set/cardinality operators rather than Enum-specific evaluator
   branches.
5. Add portable constraints separately from TypeScript/Python/Rust form
   constraints; every conditional form has applicability and owner route.
6. Separate observed, derived, owner-resolved, and unsupported facts; block
   incompatible profile parents.
7. Define a language-neutral scenario schema with stable identities, immutable
   expectations, mutation lineage, recomposition scope, and total case/result
   joins.

## Smallest Working Units

### SWU-APE-ONT-001 — Enum realization identity

- Primary behavior: add exactly one canonical-bound candidate
  `EnumImplementation` realization type.
- Dependencies: none beyond current source preflight.
- Write scope: `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json` and `domain-meta-types.projection.json`.
- Done: DS-D1.3 resolves reciprocally; DS-D1.10/UI candidates are excluded;
  authority stays none; no other type coverage changes.
- Split analysis: snapshot-only and type-only children would leave neither a
  meaningful reciprocal binding; the ID plus current canonical handle is one
  atomic ontology identity.
- Acceptance evidence: focused positive projection plus unknown/duplicate/
  tombstone negative diagnostics.
- Verification: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`.
- Owner: local-fallback through Task Session after exact baseline adoption.

### SWU-APE-ONT-002 — Enum properties and generic operators

- Primary behavior: express portable Enum property obligations using generic
  typed operators.
- Dependencies: SWU-APE-ONT-001 receipt.
- Write scope: ontology `ontology.json`, `profiles/base-domain.profile.json`,
  validator, and Enum-only ontology examples.
- Done: `set_equals`, `unique`, `non_empty`, and cardinality behavior is generic;
  Enum positives and missing/extra/duplicate/empty/non-collapse negatives are
  discriminating.
- Split analysis: property definitions without their operators are not
  evaluable; operators without one consuming property are vacuous. The paired
  slice is the smallest end-to-end evaluator extension.
- Acceptance evidence: exact expected findings for every mutant.
- Verification: ontology validator plus focused repeated deterministic run.
- Owner: Task Session.

### SWU-APE-ONT-003 — Enum architecture profiles

- Primary behavior: resolve portable and TypeScript/Python/Rust Enum profile
  applicability without treating representation form as canonical meaning.
- Dependencies: SWU-APE-ONT-002 receipt and the current
  `PROFILE-MECHANISM-FIRST` architecture-profile owner decision. Concrete
  language representation decisions remain with their later language lanes.
- Write scope: the four `ontology-experiment/profiles/*.profile.json` files and
  Enum profile fixtures only.
- Done: portable obligations are inherited once; language child profiles carry
  explicit owner-unselected representation policy; applicability is
  deterministic; conflicting parents block; unsupported and unselected states
  are typed; and no concrete language form is admitted by W0.
- Split analysis: the four files implement one inheritance/reconciliation
  behavior and are accepted through one cross-profile conflict matrix; no
  language adapter code is included.
- Acceptance evidence: profile inheritance, conflict, applicability,
  owner-unselected, and typed-unsupported fixtures.
- Verification: ontology validator and exact profile-resolution fixture check.
- Owner: resolved architecture-profile decision receipt followed by Task
  Session mutation.

### SWU-APE-ONT-004 — Provenance and conflict carriers

- Primary behavior: make every observation and effective constraint state how
  it was obtained and how conflicts block.
- Dependencies: SWU-APE-ONT-003 receipt.
- Write scope: `ontology-experiment/contracts/observation-projection.schema.json`,
  validator, and provenance/conflict fixtures.
- Done: observed/derived/owner-resolved/unsupported are exclusive typed
  carriers; raw refs and owner routes are mandatory; conflict is deterministic.
- Split analysis: provenance kind and required fields are one schema invariant;
  separating them permits incomplete evidence to validate.
- Acceptance evidence: four positive carrier fixtures and missing/mixed/conflict
  negatives.
- Verification: schema fixture runner chosen and pinned by the SWU preflight.
- Owner: Task Session.

### SWU-APE-ONT-005 — Causal scenario contract

- Primary behavior: publish one language-neutral scenario/lineage/join schema
  that can represent the three current BTE blocker diagnostics.
- Dependencies: SWU-APE-ONT-004 receipt.
- Write scope: `ontology-experiment/contracts/evaluation-scenario.schema.json`,
  scenario fixtures, and validator only. BTE paths are forbidden.
- Done: overlap, expectation rewrite, and frozen-case/result joins are causally
  representable; partial joins, mutable expectations, and overlapping scopes
  fail.
- Split analysis: identity, lineage, recomposition, and joins form one causal
  scenario invariant; any omitted part recreates the ceremonial-freeze failure.
- Acceptance evidence: one positive plus exact negatives for each missing BTE
  diagnostic class.
- Verification: scenario schema fixture runner and deterministic normalized
  output comparison.
- Owner: Task Session; later BTE adoption requires a separate BTE owner refresh.

## Failure modes

Canonical reinterpretation, unowned language representation, Enum-specific
hard-coded evaluator logic, missing source digests, file-order conflict
resolution, unsupported-as-absence, ontology task-state fields, or BTE writes
block the task.

## Closeout

Every mutation-capable SWU consumes
[`CLOSEOUT-CONTRACT.md`](../shared/CLOSEOUT-CONTRACT.md) and its exact manifest
row. The task cannot mark L0 complete until all five receipts are current.
