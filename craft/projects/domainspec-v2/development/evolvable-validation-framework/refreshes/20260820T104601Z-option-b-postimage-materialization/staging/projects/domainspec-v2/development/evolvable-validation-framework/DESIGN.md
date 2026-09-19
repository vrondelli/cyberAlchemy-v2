---
artifact: invoke-design
status: selected-applied-blocked-on-audit
updatedAt: 2026-08-20
docType: architecture-bundle
sourceDefine: DEFINE.md
---

# Design: Graph Composability Evidence Spine

## Design Intent

Separate authored facts, derived claims, executable tests, and evidence so a
graph can be composed and re-tested without hiding a step inside a runner. The
design is deliberately profile-aware: the first profile is the key-and-door
`enforces` example, while later profiles can add node kinds and evaluator
families through admission contracts.

## 1. Context View

```mermaid
flowchart LR
  Source[Authored source graph and relationship registry]
  Normalizer[Normalizer and profile admission]
  Deriver[Obligation derivation]
  Binder[Binding and fixture adapter]
  Runner[Test harness]
  Evaluator[Local or graph evaluator]
  Receipt[Typed receipt]
  Inventory[Generated Inventory read model]
  Source --> Normalizer --> Deriver --> Binder --> Runner --> Evaluator --> Receipt
  Receipt --> Inventory
```

The source files and relationship registry are authoritative. Normalized graphs,
obligations, generated tests, evaluator outputs, receipts, and Inventory views
are derived artifacts.

## 2. High-Level Structure View

| Plane | Components | Responsibility | Must not do |
| --- | --- | --- | --- |
| Source plane | `NodeSource`, `EdgeSource`, `RelationshipSignature` | preserve authored intent and admissible links | infer runtime truth |
| Derivation plane | `Graph`, structural validator, obligation rules, test emitter | make deterministic consequences explicit | conceal missing formal predicates |
| Execution plane | `Binding`, harness adapter, `TestCase` runner | connect a logical claim to a runtime | rewrite source authority |
| Evidence plane | `Evaluator`, `Receipt`, Inventory projection | judge and preserve evidence | promote a receipt to release authority |

The selected EVF-local machine capsule sits at the source/derivation boundary.
The exact predicate JSON authors the narrow S1 semantics after owner selection
and canonical apply. The expected-free fixture, validation-owned O_spec,
schemas, generated artifacts, runtime results, and receipts remain evidence.
v1 aspect Markdown is explanatory pattern evidence only.

## 3. Low-Level Components And Contracts

Candidate JSON-like shapes (field names are contract targets, not implementation
instructions):

```ts
type NodeSource = {
  node_id: string; kind: string; source_anchor: string; content_digest: string
}
type EdgeSource = {
  edge_id: string; signature: string; from: string; to: string;
  source_anchor: string; content_digest: string
}
type Graph = {
  graph_id: string; nodes: NodeSource[]; edges: EdgeSource[];
  source_digest: string; normalization_version: string
}
type Obligation = {
  obligation_id: string; rule_type: string; source_anchor: string;
  source_edge_id: string; canonical_params: object; rule_set_version: string
}
type TestCase = {
  test_id: string; obligation_id: string; fixture_ref: string;
  expected_predicate: object | null; status: "runnable" | "needs_formal"
}
type Binding = {
  binding_id: string; test_id: string; adapter: string;
  runtime_target: string; fixture_digest: string; graph_digest: string
}
type Evaluator = {
  evaluator_id: string; scope: "local" | "graph" | "temporal" | "semantic";
  input_contract: string; verdicts: string[]
}
type Receipt = {
  receipt_id: string; inputs: string[]; verdict: string;
  structural: object; execution: object | null; evaluator: object;
  residue: string[]; content_digests: string[]
}
```

`Graph` is a normalized container; it is not a replacement for the authored
node and edge records. `Evaluator` is intentionally an interface family, not a
promise that every formal engine already exists.

## 4. Workflow Process View

```mermaid
sequenceDiagram
  participant S as Source
  participant N as Normalize/validate
  participant D as Derive
  participant B as Bind
  participant T as Test runner
  participant E as Evaluator
  participant R as Receipt
  S->>N: graph + profile + relationship signature
  N-->>S: normalized graph digest or typed rejection
  N->>D: admitted graph
  D-->>D: deterministic obligation key
  D->>B: obligation + fixture request
  B->>T: executable test case
  T->>E: execution result
  E->>R: bounded verdict + evidence
```

Every transition is a handoff boundary. A missing endpoint, unsupported
signature, stale digest, missing binding, or missing formal predicate yields a
typed residue rather than an invented pass.

## 5. Decision Flow View

```mermaid
flowchart TD
  A[Claim arrives] --> B{What kind of claim?}
  B -->|node/edge shape| C[Structural evaluator]
  B -->|single obligation/test| D[Local evaluator]
  B -->|reachability/cycle/closure| E[Graph evaluator]
  B -->|ordering/transition| F[Temporal evaluator]
  B -->|formal business predicate| G[Semantic evaluator]
  C --> H{Evidence complete?}
  D --> H
  E --> H
  F --> H
  G --> H
  H -->|yes| I[Receipt with verdict]
  H -->|no| J[Typed gap or blocked receipt]
```

The first proof uses structural and local evaluation only. Graph, temporal, and
semantic branches are explicit future extension points.

## 6. Dependency And Interface View

| Interface | Input authority | Output | Consumer | Boundary |
| --- | --- | --- | --- | --- |
| profile admission | supported-profile source | admitted node/edge kinds | normalizer | no automatic profile expansion |
| relationship admission | relationship registry | accepted/rejected edge | normalizer | endpoint signature remains authoritative |
| derivation `δ` | normalized graph + rule set | ordered obligations | test emitter | generator does not define `O_spec` |
| test emission | obligation + formal AST/fixture | test case or `needs_formal` | binding | no invented expected value |
| binding | test case + adapter registry | runnable invocation | harness | stale digest is a failure |
| evaluator | result + evaluator contract | verdict + evidence | receipt | verdict scope is explicit |
| receipt | all prior digests and residues | append-only evidence | reviewer/Inventory | not release authority |

## Two-Proof IOLM Consumer Boundary

Accepted [DEC-GCP-002](decisions/2026-07-20-iolm-proof-role.md) keeps two
independently closable proofs:

1. `SWU-GCP-001` proves the executable core from authored graph through
   obligation, TestCase, binding, evaluator, execution result, mutation, and
   receipt.
2. The private Interactive Ontology Learning Map consumes the exact successful
   core handles and independently proves unchanged IDs, relation direction,
   provenance, semantic bytes, view hashes, deterministic rebuild, and
   graph/hierarchy/table parity.

The IOLM adapter accepts exact handles; it does not author the formal predicate,
define `O_spec`, re-derive the core verdict, admit a profile, or change FPR,
release, production, or publication state. A missing or failed IOLM receipt
blocks only the combined “executable proof used by a real application” claim.
It cannot downgrade or upgrade the independently evaluated core receipt.

The same versioned consumer boundary is rerun later against the green BTE core
receipt. That breadth run is fresh evidence with its own run identity and cannot
be substituted by the narrow core receipt, a schema, or a fixture.

## v1 Aspect Adapter Boundary

`operations.md` and `interfaces.md` remain explanatory examples of formal and
observable boundaries. They may guide review vocabulary, but they cannot author
the S1 predicate, expected values, or runtime behavior. State/event/query/
mapping aspects remain optional extensions, not L0 inputs.

## Selected S1 Decision-Bound Capsule

The selected machine contract is `DEC-GCP-001-R1:option-a`:

- predicate: `evf.key-door.has-key.v1`, exact equality `has_key == true`;
- fixture: two ordered expected-free locked-door inputs, true then false;
- runtime candidate: pure harness-only `attemptUnlock`, with exact output-shape
  and transition guards and no I/O, clock, randomness, filesystem, or network;
- expectation: direct typed-predicate evaluation, never runtime output;
- denominator: exactly one validation-owned O_spec obligation equal to O_gen;
- execution: one generated test ID, two ordered runtime observations, one
  aggregate equality assertion, and one joined child-result envelope;
- evidence ceiling: replayable non-admitting receipts only.

### Seven ordered seams

| Seam | Responsibility | Fail-closed exit |
| --- | --- | --- |
| ICR-S1-001 | validate exact source, input, and runtime contracts | unadmitted or stale input exits before derivation |
| ICR-S1-002 | validate raw lineage and prove O_gen equals O_spec | any set or source mismatch blocks |
| ICR-S1-003 | validate/evaluate the closed Boolean equality AST | unsupported node/operator/type blocks before runtime |
| ICR-S1-004 | resolve exactly one fresh digest-bound binding | missing, duplicate, ambiguous, or stale binding blocks |
| ICR-S1-005 | emit strict test, run two calls, join one child result | skip/todo/gap/output-transition failure blocks |
| ICR-S1-006 | replay bytes, kill sixteen mutants, validate receipts | survivor, omission, or tamper forbids positive receipt |
| ICR-S1-007 | run terminal verifier and exact acceptance vector | first nonzero is preserved; no later cleanup masks it |

All seams are checkpoints inside one `SWU-GCP-001`; none is separately
closable. Closeout is `E -> P -> O -> T`, followed by a cursor with
`successor_executed:false`.

### Lifecycle topology

`EVF-PKG-TOPOLOGY-001 / EVF-PKG-B-EVIDENCE-ONLY` fixes the non-recursive
package topology. Owner selection is distinct from exact-byte apply. Invoke may apply only the
reviewed 34-target corpus (23 planning plus 11 owner-material) after explicit
authorization. A fresh reviewer then audits that non-self-referential corpus
and creates target 35, `CURRENT-PLAN-AUDIT.json`. Implementation Readiness may
classify the unchanged entry only after that audit; Task Session separately
admits current runtime/material baselines and the exact write/effect boundary.

## Design Decisions

1. Keep graph composition separate from test execution so a structural receipt
   can exist even when no runtime adapter is available.
2. Use content digests at every handoff; this makes stale bindings and mutated
   source visible.
3. Make evaluator scope explicit instead of exposing one universal `check()`.
4. Treat `needs_formal`, `it.skip`, and `it.todo` as residue that blocks a
   completeness claim, while preserving the useful structural evidence.
5. Preserve the existing backend completeness package as the broad execution
   owner; this package supplies its composability contract and first proof.

## Risks And Deferred Decisions

- Closed TypeScript unions may prevent profile evolution until admission is
  generalized.
- Relationship signatures not mapped by the current checker need adapters or
  an explicit unsupported status.
- Cross-graph laws need a bounded query language and an independent oracle.
- Receipt schemas may need separate structural, execution, and semantic
  envelopes once formal evaluators are implemented.

No source code, canonical definitions, release state, or Inventory authority is
changed by this design artifact.
