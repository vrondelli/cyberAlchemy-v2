# TASK-LGP-HOST: Existing-Host Learner Projection

## Objective

After exact learner-view mutation admission, integrate the generated projection
into `architecture-ontology-view.html` through five independently reviewable
behaviors: reader/currentness, static semantic structure, presentation,
focus/view/inspector parity, and keyboard interaction.

## Layer And Waves

- Layer: L1
- W3: SWU-LGP-005 and 006
- W4: SWU-LGP-007, 008, and 009

## Admission Invariant

Before each host SWU, bind current host bytes to the prior owner receipt. The
initial research digest is discovery evidence, not permission to overwrite
drift. Learner-view mutation admission authorizes only the exact host scope; it
cannot close semantic evidence gaps or admit the displayed destination owner.

## SWU-LGP-005: Reader And Currentness

Primary behavior: load one supported current projection into the host;
otherwise expose an exact diagnostic and no derived learner content.

Algorithm: load same-origin generated data; validate schema/contract version
and validity; index stable records/relations without reclassification; expose
read methods; suppress question/suggestion for stale/invalid/unsupported data;
make no external request.

### Exact Write Scope SWU-LGP-005

1. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
2. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection-view.js`
3. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/tests/reader-currentness.test.mjs`

### Validation SWU-LGP-005

```text
node learner-projection/tests/reader-currentness.test.mjs
node --check learner-projection/learner-projection-view.js
```

Done: current data indexes exactly; stale/invalid/unsupported input is
diagnostic-only; no new semantic UI is introduced.

## SWU-LGP-006: Static Semantic Structure

Primary behavior: render the orientation/evidence contract with exact semantic
DOM and no responsive or interaction behavior.

DOM contract: learner-guide heading and authority-none statement; ordered
concept/expectation/observation/finding/session/gap/suggestion layers; focused
evidence stack; `ABSTAIN`; v1 and exact v2 questions; a “Candidate evidence
route — display only” section without an action; stale diagnostic suppression.

### Exact Write Scope SWU-LGP-006

1. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
2. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection-view.js`
3. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/tests/semantic-dom.test.mjs`

### Validation SWU-LGP-006

```text
node learner-projection/tests/semantic-dom.test.mjs
```

Done: exact semantic structure/text exists; killed/authority vocabulary and
action controls are absent.

## SWU-LGP-007: Presentation And Responsive Layout

Primary behavior: present the accepted structure without color dependence,
proof-tier truncation, or wide-viewport assumptions. DOM order is preserved;
digests/selectors wrap; warnings remain associated; the rail cannot cover
existing host controls; no focus or keyboard logic is added.

### Exact Write Scope SWU-LGP-007

1. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
2. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection.css`
3. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/tests/presentation.test.mjs`

### Validation SWU-LGP-007

```text
node learner-projection/tests/presentation.test.mjs
```

Done: narrow/wide and non-color checks pass without interaction changes.

## SWU-LGP-008: Focus, View, And Inspector Parity

Primary behavior: make existing selection drive one presentation-only focus
state with identical stable IDs/classes/proof tiers across Graph, Outline, and
Table plus the inspector and learner rail.

```text
on existing host selection(subjectId):
  read the current record/neighborhood
  set presentation focus only
  render identical ids/classes/tiers in every representation
  update inspector and learner rail from reader data
on view switch: preserve selected stable id and proof data
never persist comprehension/confusion or emit workflow state
```

### Exact Write Scope SWU-LGP-008

1. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
2. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection-view.js`
3. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/tests/view-parity.test.mjs`

### Validation SWU-LGP-008

```text
node learner-projection/tests/view-parity.test.mjs
```

Done: LGP-FIX-009, LGP-FIX-012, and host parity checks pass without keyboard
behavior.

## SWU-LGP-009: Keyboard Interaction

Primary behavior: add the declared search -> focus -> inspect -> guide ->
suggestion keyboard path while preserving the parity state from 008.

Rules: reuse owned tab/roving semantics; expose visible focus; announce the
focused heading; provide no action on the suggestion; never trap focus; never
emit workflow, comprehension, or persistence state.

### Exact Write Scope SWU-LGP-009

1. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
2. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/learner-projection-view.js`
3. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/tests/keyboard-interaction.test.mjs`

### Validation SWU-LGP-009

```text
node learner-projection/tests/keyboard-interaction.test.mjs
```

Done: LGP-FIX-011 and the no-trap/no-side-effect checks pass; view parity does
not regress.

## Shared Failure Modes And Closeout

Host drift, stale derived content, unlabeled relations, action controls,
outbound requests, existing-host regression, or inflated accessibility/
comprehension claims block. Task Session and lifecycle-owner evidence use the
disjoint directories in `CLOSEOUT-CONTRACT.md`; success makes only the next
declared SWU eligible.
