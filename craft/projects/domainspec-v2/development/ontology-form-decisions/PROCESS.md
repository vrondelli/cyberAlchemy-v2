# Process — Decide All Ontology Forms Before Implementation

## Outcome

The process closes architecture questions in batches, validates the resulting
decision cards, and emits an implementation queue containing only forms that no
longer need semantic or profile choices.

It separates three decisions that must not collapse:

```text
canonical DomainSpec meta-type
  -> portable architecture type and invariants
  -> language-profile realization
  -> proof and negative-control contract
  -> implementation queue
```

One portable form may have different TypeScript, Python, and Rust realizations.
A native language construct is an implementation choice, not canonical meaning.

## Inputs and authority

| Input | Supplies | Must not supply |
| --- | --- | --- |
| `meta-types.yml` | stable identity, maturity, criterion route | architecture shape |
| candidate architecture ontology | proposed types, properties, relations, operators | canonical meaning or promotion |
| language profiles | admissible source/native forms and observation rules | cross-language semantics |
| mapping decision | owner-attributed canonical-to-architecture join | implementation proof |
| proof requirements | executable obligations and hostile controls | owner decision or authority |

Exact references prove local byte identity and provenance. They do not
cryptographically authenticate an owner.

## Campaign algorithm

The campaign root binds one accepted W0 kernel through exact references to the
option request, Decision Gate receipt, decision record, canonical prefilter,
and request/receipt schemas. The validator replays the prefilter and requires
the retained receipt to match exactly. Decision Gate request digests use its
sorted compact JSON algorithm; canonical meta-type record digests use the
separately accepted RFC 8785 policy. These digests must not be conflated.

### 1. Inventory every stable ID

Join the canonical catalogue and current projection by `meta_type_id`. Every ID
must appear exactly once. Assign one outcome:

- `implement` only when definition maturity is active;
- `wait-for-definition` for candidate definitions;
- `deferred` for explicitly deferred definitions;
- `superseded` for retired IDs.

This makes “do not implement” a complete decision rather than an omission.

### 2. Decide the portable architecture form

For each active type, record:

- proposed or existing architecture type ID;
- portable invariants independent of language syntax;
- required typed properties and their observation stages;
- allowed relation types, endpoints, direction, and cycle policy;
- missing property/relation decisions;
- forbidden inferences.

If the ontology lacks a type, property, or relation, keep it in the missing
decision list. Never manufacture a passing observation from naming similarity.

### 3. Decide language realizations

For each active type, enumerate viable forms independently for TypeScript,
Python, and Rust. Each profile decision ends as one of:

- `selected`: exact owner decision and one selected candidate form;
- `proposed`: alternatives exist but no owner decision exists;
- `blocked`: a decision is required but unavailable;
- `unsupported`: the selected portable form cannot be observed safely in that
  language/profile;
- `not-applicable`: the meta-type is not eligible for implementation.

Unsupported is not failure: it is a closed profile outcome. Missing or stale
decision/profile/provider digests reopen the card before implementation.

### 4. Tension the complete card

Before an owner decision, compare at least:

- simplest native representation;
- most explicit provider-owned representation;
- composition-friendly representation;
- migration and interop consequences;
- proofability and negative-control discrimination;
- unsupported or indeterminate source shapes.

Reject forms that hide required properties, depend on naming conventions for
meaning, cannot be observed without inference, or widen the claim ceiling.

### 5. Issue decisions, not summaries

An owner-selected card must bind exact decision bytes for:

- canonical record to architecture type/profile mapping;
- selected language realization in each supported language;
- descriptor/mode/provider requirements;
- proof and claim ceiling.

The campaign may prepare proposals. It cannot issue or authenticate those owner
decisions itself.

Advancing a state also appends that state to `state_history`. The final history
entry must equal the current state and every step must be a declared state-machine
transition. Material digest drift moves the card to `stale`; it cannot remain
ready merely because an earlier receipt passed.

### 6. Complete the descriptor

After owner decisions, generate the successor contract chain designed by the
ontology-admission Refine run:

```text
CanonicalMetaTypeRecordRef/v1
  -> ArchitectureMappingDecision/v1
  -> MetaTypeRealizationDescriptor/v1
  -> FactoryKitPackage/v2
```

Structural inspection and readiness remain separate. All mapping states may be
structurally inspected; only an allowed active mapping with complete selected
forms and available providers can become ready.

### 7. Validate and queue

Run `validate-form-decisions.mjs`. A card enters `ready` only when:

1. canonical and profile digests are current;
2. definition maturity is active;
3. architecture mapping is owner-decided;
4. all required properties and relations resolve;
5. TypeScript, Python, and Rust each have one selected realization with an
   exact profile decision; an unsupported language keeps the three-language
   campaign card blocked until the campaign scope is explicitly revised;
6. proof obligations and hostile controls are non-empty;
7. selected record digest and decision refs exist;
8. blocker list is empty;
9. descriptor and claim ceiling are complete;
10. a pre-queue readiness receipt binds the completed decision, descriptor,
    proof contract, and kit without depending on the queue;
11. the campaign validator passes and binds the resulting queue.

Implementation consumes `IMPLEMENTATION-QUEUE.json`; it does not reinterpret
the decision matrix.

The two receipts are intentionally distinct to prevent a digest cycle. A ready
queue entry references the pre-queue readiness receipt. The generated
`receipts/current-validation.json` then binds the matrix, queue, schemas,
validator, pinned runtime, canonical inputs, criteria, profiles, selected
decisions, and providers in its `input_inventory`. A ready entry must never
reference that queue-binding campaign receipt.

## Decision bundle protocol

Work one family wave at a time. For each wave:

1. refresh exact input digests;
2. present one compact table of portable and language alternatives;
3. identify contradictions and recommended selections;
4. collect one exact owner response for the whole wave or named exceptions;
5. write decision refs and advance only accepted cards;
6. rerun validation and publish the generated receipt;
7. continue to the next wave only when all unresolved choices are explicit.

The campaign may decide every form before implementation by completing all
active waves and leaving the implementation queue untouched until the final
decision bundle passes. This is the preferred mode for the requested workflow.

## Drift and reopening

Reopen a card when canonical, ontology, profile, provider, criterion, or owner
decision digests change; a new language appears; a selected form becomes
unobservable; or implementation proof contradicts a portable invariant. Drift
first marks the card `stale`, records the transition, removes it from the ready
queue, and then reopens it at the earliest affected decision state through an
explicit declared transition.

## Stop conditions

Stop and request an owner decision when alternatives change business meaning,
profile authority, mapping identity, portability, or claim ceiling. Stop for
ontology/profile promotion, external effects, credentials, publication,
release, or deployment. Validation failure blocks the queue but never rewrites
canonical sources automatically.
