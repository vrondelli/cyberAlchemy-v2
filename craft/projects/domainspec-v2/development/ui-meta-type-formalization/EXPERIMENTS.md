---
module: ui-meta-type-formalization
status: candidate
updatedAt: 2026-07-11
docType: experiment-plan
authority_boundary: experiment evidence only; no promotion
---

# Experiment Plan: UI Meta-Type Formalization

## Purpose

Produce repeatable evidence about whether each UI label has a bounded,
discriminating formation law. The experiments test candidate definitions; they
do not prove semantic meaning or grant DS-D1 authority.

## Registered Hypotheses

| ID | Hypothesis | Failure interpretation |
| --- | --- | --- |
| UIF-H1 | A candidate criterion can be expressed using bounded structural predicates. | `defer-evidence-gap` or explicit semantic exception. |
| UIF-H2 | The criterion accepts valid specimens and rejects malformed specimens deterministically. | Repair criterion or reject candidate. |
| UIF-H3 | The candidate rejects or reroutes its named nearest neighbors using a separating witness. | `merge-candidate`, `relation-not-node`, `split-candidate`, or defer. |
| UIF-H4 | The formation law survives at least two framework styles or a justified framework-neutral corpus. | `framework-vocabulary` or narrow the claim. |
| UIF-H5 | Active DS-D8 signatures remain coherent for accepted specimens without serving as formation authority. | Emit relationship-authority gap; do not widen signatures here. |
| UIF-H6 | A generated candidate instance validates and a targeted mutation rejects. | Repair schema/instance validator agreement. |

## Experiment Families

### E0 - Method smoke test

Run two contrast pairs before broad fan-out:

| Pair | Why selected | Desired method behavior |
| --- | --- | --- |
| Form versus Component | Tests whether a structurally rich UI specialization can survive an umbrella neighbor. | May preserve Form while narrowing or demoting Component. |
| Adapter versus Mapping | Tests a known collapse pressure against an existing backend type. | Must be able to return merge instead of manufacturing novelty. |

E0 passes only if the protocol can produce a reviewable result in both lanes
without changing its rules after seeing the desired result.

### E1 - Constructibility

For each label, draft the smallest criterion using existing rule kinds first.
Record every proposed new rule kind with inputs, outputs, bounded algorithm,
failure mode, and black-box test requirement.

Pass: the criterion is decidable from the authored specimen and public source
contracts. Fail: it requires application execution, semantic inference, or
private derivation behavior.

### E2 - Discrimination and correction

Each type gets:

1. positive specimen;
2. malformed negative;
3. nearest-neighbor specimen;
4. optional cross-type matrix entries where one specimen is intentionally
   presented to multiple candidate validators; and
5. correction route for every rejection.

Pass: all expected accept/reject/reroute outcomes match and repeated runs are
identical. A self-declared type tag flip does not count as a separating witness.

### E3 - Graph coherence

Exercise relevant active DS-D8 relationships against typed specimens. The edge
must resolve through the root relationship authority. Raw `source_of` and
`target_of` set inequality is insufficient.

Pass: candidate instances participate only in allowed signatures and seeded
endpoint violations reject. This is supporting evidence, never formation proof
by itself.

### E4 - Portability

Represent the same candidate contract in two framework styles, for example a
React-like component model and a template/controller or composition-API model.
Framework names may appear in specimen adapters; the candidate criterion must
remain stable.

Pass: both styles normalize to the same candidate structure. If only one style
works, classify the label as framework vocabulary or narrow it explicitly.

### E5 - Instance round trip

Generate one example instance from each surviving candidate schema, validate
it, mutate the field that carries the separating witness, and validate again.

Pass: generated instance accepts; targeted mutation rejects with the expected
correction contract.

### E6 - Adversarial review and replication

Run a second-corpus replication and an adversarial review focused on vacuity,
definition collapse, counterexamples, framework bias, and DS-D8 authority
leakage. A result survives only if the original evidence and replication agree
or the disagreement is explicitly adjudicated.

## Per-Type Tension Matrix

| Label | Nearest neighbors / pressure | Required experiment focus |
| --- | --- | --- |
| Page | Component, Layout | terminal route, primary-content ownership, layout and render contract |
| Layout | Page, Component | named slots, shell/chrome ownership, reuse without domain content |
| Component | all UI visual constructs | determine whether it is a fallback umbrella or a narrow non-routable unit |
| View Model | Value Object, Query projection, Adapter output | source refs, display-only shaping, non-domain authority |
| Hook | Binding, Action, local state utility | framework-neutral reactive contract and stable return/effect surface |
| Form | Component, Interface | fields, validation, submission, target interface, error mapping |
| Action | event handler, Operation, Binding | user intent, trigger, target kind, effect boundary, observable outcome |
| Guard | Rule, Component wrapper | protected surface, source rule/permission, fallback, non-authority |
| Binding | Hook, DS-D8 relation | durable node record versus pure connection; query/operation endpoint mode |
| Adapter | Mapping | source/target schemas, field transform, UI boundary, lossiness/formatting |
| State Indicator | Component, Enum, State Machine | domain-state versus async-state split and coverage of source values |

## Corpus Contract

The corpus manifest records:

- specimen ID and source;
- real, adapted, or synthetic provenance;
- framework style;
- candidate labels under test;
- source license or local ownership note;
- normalization performed;
- expected result frozen before execution; and
- exclusions and reasons.

Promotion-ready evidence requires at least one real or owner-supplied specimen
for each surviving type. Synthetic fixtures are necessary for controlled
negatives but insufficient as the sole positive evidence.

## Result Contract

```yaml
experiment_id: UIF-E-<stable-id>
protocol_version: ui-formalization.v0.1
candidate: <label>
hypothesis_refs: [UIF-H1]
corpus_refs: []
criterion_ref: <path>
runs:
  positive: {expected: accept, observed: accept|reject|error}
  malformed_negative: {expected: reject, observed: accept|reject|error}
  neighbor_negative: {expected: reject-or-reroute, observed: accept|reject|reroute|error}
  graph_coherence: {expected: pass, observed: pass|fail|not-applicable}
  portability: {expected: pass, observed: pass|fail|incomplete}
  round_trip: {expected: pass, observed: pass|fail|not-run}
repeatability: deterministic|non-deterministic|not-run
provisional_outcome: candidate-schema-ready|merge-candidate|relation-not-node|framework-vocabulary|split-candidate|defer-evidence-gap
evidence: []
residue: []
```

## Acceptance Thresholds

- Positive acceptance: 100 percent for registered valid fixtures.
- Malformed rejection: 100 percent for registered malformed fixtures.
- Named-neighbor separation: 100 percent reject or explicit reroute for each
  registered separating pair.
- Repeatability: identical result and reason class across repeated runs.
- Portability: two styles pass, or the label is explicitly narrowed/classified.
- Graph coherence: all exercised edges pass active DS-D8 signatures; all seeded
  endpoint violations reject.
- Round trip: every surviving candidate generates a valid instance and rejects
  the targeted mutation.

These thresholds govern the registered fixture set, not universal semantic
correctness.

## Stop Conditions

- Stop a type lane when its criterion crosses the public/private boundary.
- Stop broad fan-out if E0 cannot produce stable accept/reject/collapse results.
- Stop candidate schema authoring when nearest-neighbor evidence is missing.
- Stop promotion handoff if real-corpus evidence or portability is incomplete.
- Route DS-D8 changes to relationship authority rather than mutating them here.

## Reporting

Every run emits a machine result and a human summary. The synthesis must include
all 11 labels, rejected hypotheses, disagreements, corpus limitations, and an
explicit statement that experimental evidence does not itself promote DS-D1.
