---
artifact_id: UIP-ARCH-v1
status: approved-design
authority: development-only
updated: 2026-07-17
---

# Required UI Profile Architecture

## Design Intent

DomainSpec requires a UI vocabulary because a system-building language must be
able to describe UI systems. Concept availability is therefore a product-design
decision. Evidence tests a concept's placement, boundaries, and implementation;
it does not grant the concept permission to exist.

All eleven UI concepts remain available. Their proposed representation may be a
node, role, edge, projection, alias, or split. Synthetic evidence is sufficient
for mechanical admission into this development profile. Real-corpus evidence is
append-only confidence evidence and cannot block profile implementation.

This package is the `FPR-02U` development lane. It does not activate DS-D1
candidates, rewrite DS-D8, admit a release profile, or depend on the `FPR-02B`
backend lane. It produces executable development artifacts and an exact owner
packet for those later decisions.

## 1. Context View

```text
required UI vocabulary
        |
        v
development UI profile ---> DomainSpec compiler/traversal ---> graph + views
        |                                |
        +--> synthetic calibration ------+
        |
        +--> authority packet ---> DS-D1 / DS-D8 / profile owners
        |
        +--> real corpora ---> confidence ledger (non-blocking)
```

The UI profile consumes the existing DomainSpec node model, relationship
registry, minted-project compiler, and generated graph/view contracts. It does
not create a second graph engine.

## 2. High-Level Structure View

```text
UI-PROFILE-DESIGN.json
        |
        +--> profile registry and representation normalizer
        +--> nine node-formation schemas
        +--> Adapter alias + State Indicator split contracts
        +--> synthetic Create Player specimen package
        +--> existing compiler/minter/views with explicit dev-profile input
        +--> authority reconciliation packet
```

One registry separates three independent dimensions:

- `availability`: whether the UI concept must be expressible;
- `representation`: how the concept enters the governed graph;
- `confidence`: how broadly its current contract has been exercised.

## 3. Low-Level Component View

| Component | Input | Output | Failure behavior |
| --- | --- | --- | --- |
| Profile registry | eleven required concepts and proposed placements | parseable concept/representation index | missing concept or unknown placement blocks |
| Formation adapter | nine accepted candidate twins plus nonempty repair contract | implementation-owned UI schemas | empty/whitespace/unknown rule blocks |
| Representation normalizer | profile concept instance | canonical node, role, alias, projection, split branch, or residue | no silent node coercion |
| Synthetic corpus | preregistered Create Player case | positive, neighbor, malformed, erasure, and changed-consequence fixtures | synthetic origin remains explicit |
| Profile compiler adapter | explicit profile-registry handle plus node files | existing DomainSpec graph and generated views | canonical default cannot be overridden implicitly |
| Confidence ledger | real-corpus/reviewer receipts | per-concept confidence state | missing evidence remains `unmeasured` |
| Authority packet builder | registry, schemas, graph receipts, residue | DS-D1/DS-D8/profile decision packet | no direct authority mutation |

## 4. Workflow Process View

1. Freeze all eleven concepts as `required-by-design` in the development
   registry.
2. Assign a proposed representation without deleting or hiding any concept.
3. Port the nine schema-ready node contracts and the tested nonempty rule into
   the implementation validator surface.
4. Encode Adapter as a Mapping specialization and State Indicator as two
   explicit profile branches.
5. Generate the synthetic Create Player node package and all counterexamples.
6. Compile the package through the existing DomainSpec compiler using an
   explicit development profile handle.
7. Traverse the resulting graph and compare machine and Markdown views.
8. Assemble exact DS-D1, DS-D8, and supported-profile deltas for owner review.
9. Audit the development result. Append later empirical receipts without
   changing admission state automatically.

## 5. Decision Flow View

```text
concept required? --no--> out of this profile
        |
       yes
        v
representation closes mechanically?
   | no                 | yes
   v                    v
typed residue      development profile entry
                           |
                    synthetic suite passes?
                       | no      | yes
                       v         v
                     repair   owner-ready packet
                                  |
                         canonical owner decision
```

Real-corpus confidence may strengthen, narrow, split, or challenge a contract.
It does not automatically add, remove, activate, or demote a concept.

## 6. Dependency And Interface View

| Boundary | Interface | Rule |
| --- | --- | --- |
| Historical UIF evidence | candidate cards, repair receipts, verdict matrix | read-only source; no history rewrite |
| UI development profile | `impl/spec/ui-profile/` plus UI formation schemas | implementation owner until authority decision |
| DomainSpec engine | explicit development-profile registry input | reuse compiler/minter/views; no parallel engine |
| DS-D1 | exact proposed node/alias/split dispositions | definitions-governance owns activation |
| DS-D8 | endpoint reconciliation for `shapes` and `reflects`, plus other UI signatures | relationship owner decides changes |
| Supported profiles | requested profile entry and digest effects | profile owner decides release admission |
| Empirical evidence | append-only confidence records | never a hidden implementation gate |

## Representation Decisions

- Page, Layout, Component, View Model, Hook, Form, Action, Guard, and durable
  Binding are proposed development-profile nodes.
- Edge-only binding remains a relationship, never a forced Binding node.
- Adapter is required vocabulary represented as a UI-boundary specialization of
  existing `DS-D1.13 Mapping`; it does not require a second node kind.
- State Indicator is required vocabulary split into a domain-state projection
  and an async-request Component role. The current `reflects` endpoint remains
  owner residue until DS-D8 reconciliation.
- `required-by-design` is not synonymous with `active`, `canonical`,
  `release-admitted`, or `empirically universal`.

## Risks And Controls

| Risk | Control |
| --- | --- |
| Required vocabulary is mistaken for eleven new node kinds | representation field is mandatory and closed |
| Synthetic fixtures become circular proof | label them calibration-only and run erasure/neighbor/consequence tests |
| Development profile bypasses authority | compiler requires explicit dev registry; canonical default stays unchanged |
| Adapter or State Indicator leave broken DS-D8 endpoints | emit typed owner residue and exact reconciliation packet |
| Real evidence silently changes definitions | append confidence only; owner decision is separate |
