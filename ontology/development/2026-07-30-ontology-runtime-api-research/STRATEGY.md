# Ontology Vault Runtime/API Research Strategy

Status: confirmation-ready, unconfirmed, unregistered, not run

## Direct design hypothesis

The smallest credible runtime is not an ontology database and not a CRUD
service. It is an explicit package registry plus project-owned adapters that
compile immutable, content-addressed snapshots and expose three separated
planes:

```text
explicit runtime profiles
  -> package adapters
  -> immutable snapshots
       -> bounded query plane
       -> profile-gated report-operation plane
       -> owner-routed proposal handoff
```

The runtime owns only snapshot/run mechanics and receipts. CAV2 and each minted
project retain source meaning, schema, validator, lifecycle, and promotion
ownership.

### Candidate v0 API

Read/query:

- `GET /v1/packages`
- `GET /v1/packages/{packageId}`
- `GET /v1/packages/{packageId}/snapshots/{snapshotId}`
- `GET /v1/packages/{packageId}/snapshots/{snapshotId}/records/{recordId}`
- `GET /v1/packages/{packageId}/snapshots/{snapshotId}/relations`
- `GET /v1/packages/{packageId}/snapshots/{snapshotId}/views/{viewId}`
- `GET /v1/packages/{packageId}/snapshots/{snapshotId}/search`
- `GET /v1/packages/{packageId}/snapshots/{snapshotId}/neighborhood/{recordId}`
- `GET /v1/packages/{packageId}/snapshots/{snapshotId}/residue`

Bounded operations:

- `POST /v1/runs` creates an idempotent, create-only run for a mode explicitly
  allowed by the package profile, initially `map`, `validate`, and `diff`.
- `GET /v1/runs/{runId}` returns status, exact inputs, adapter identity,
  output handles, validation receipts, blocked-output attempts, and residue.
- `GET /v1/runs/{runId}/artifacts/{artifactId}` returns a content-addressed
  report or projection.
- A later proposal-handoff route may package a run result for a named owner.
  It may not apply the proposal.

Explicitly absent:

- no filesystem path supplied by a request;
- no crawl-based package discovery;
- no `PUT`, `PATCH`, or `DELETE` over ontology sources;
- no generic node/relation creation endpoint;
- no schema, spec, runtime-contract, owner-decision, or promotion endpoint;
- no endpoint that treats validation, a snapshot, a view, or a report as
  authority.

### Candidate core contract

The generic runtime envelope should carry only:

- package/profile identity and owner route;
- adapter id and version;
- exact source manifest and digests;
- snapshot id, canonical-byte hash, and ETag;
- capability matrix and blocked operations;
- record/relation/view handles without rewriting project-local semantics;
- validation/report/proposal handles;
- authority effect, claim ceiling, receipts, and residue.

Payloads remain adapter-owned. Augmentor's `view_role`, Body War's
`business_kind` and lifecycle policies, and CAV2's Markdown candidate model
must not be flattened into a universal runtime vocabulary.

## P1 trigger decision

Dispatch is warranted by:

- **Synthesis:** the public Ontology Vault contract, CAV2 authority/model law,
  Augmentor, Body War, IOLM, and OEW must be reconciled.
- **Context protection:** their schemas, receipts, API plans, and owner
  boundaries are too large for one parent synthesis without selector loss.
- **Isolation:** API and normalization proposals need discardable adversarial
  checks before they influence implementation.
- **Parallelism:** authority law, runtime behavior, and package
  interoperability can be investigated independently.

Dispatch type is `research`. The evidence contract is `exact-binding` because
the result must name machine-addressable package, selector, endpoint, identity,
and fixture contracts.

## Lanes, groups, and subagents

### Explorers — one parallel wave

Anti-bias axis: composite methodology and source corpus.

- `Spivak, David` — **authority-contract explorer**. Formal analysis of
  Ontology Vault profiles, CAV2 authority movement, package/node/relation/branch
  contracts, allowed effects, and forbidden authority movement.
- `Hewitt, Carl` — **runtime/API explorer**. Computational tracing of IOLM
  immutable queries and OEW admission, adapter, snapshot, gateway, receipt,
  security, isolation, and lifecycle behavior.
- `Simon, Herbert` — **package-interoperability explorer**. Empirical
  comparison of Augmentor and Body War profiles, schemas, validators, views,
  lifecycle policies, tests, receipts, scale, and operator journeys.

The six pairwise tension directions for the two subject groups are stored in
the exact admitted sheet.

### Synthesis

- `Shannon, Claude` reconciles the explorer returns into one exact-bound
  runtime/API contract, package-adapter model, endpoint catalog, and vertical
  witness.

### Reviewers — one parallel wave

Anti-bias axis: attack vector.

- `Lakatos, Imre` attacks false novelty and duplicated owners.
- `Popper, Karl` attacks non-vacuity, operational overhead, and the literal
  three-package witness.
- `Quine, Willard Van Orman` attacks definitional, local-vocabulary,
  validation, runtime-contract, authority, and promotion collapse.

### Writing and approval

- `van Lamsweerde, Axel` writes only `findings.md` after exact-binding evidence
  closure returns `ready`.
- `Brandenburg, Martin` audits `findings.md`.
- The parent remains the final approver.

## Dependency flow

```text
three explorers
  -> synthesizer
  <-> three reviewers
  -> exact-binding evidence closure
  -> writer
  -> auditor
  -> parent
```

- One synthesizer-to-explorer feedback edge may repair missing source evidence.
- The synthesizer/reviewer zig-zag has a loop cap of two.
- One auditor-to-writer feedback edge may repair presentation when evidence
  already exists.
- Explorer-owned evidence gaps cannot be reassigned to the writer.
- Every spawned agent must be joined and closed.
- The strategist, not the writer, mechanically assembles verbatim explorer
  returns into `research.md`.

## Smallest vertical witness

The first implementation candidate must be killable by one local-fixture route:

1. explicitly register CAV2, Augmentor, and Body War profiles;
2. bind allowlisted sources and compile one immutable snapshot per package;
3. query package metadata, records, relations, views, search, neighborhoods,
   source handles, and residue within declared caps;
4. run only profile-allowed `map`, `validate`, and `diff` operations;
5. retrieve content-addressed reports and validation receipts;
6. reject arbitrary paths, unsupported modes, direct CRUD, schema mutation,
   authority decisions, and promotion;
7. prove all source bytes unchanged;
8. emit one non-authority proposal handoff to a named owner route;
9. stop the runtime and prove owned process/port cleanup.

The slice fails if it only produces schemas, diagrams, endpoint prose, UI
cards, or receipts without an executable request path.

## Inventory preflight

The machine index passed lookup readiness and projection conformance with zero
failures and 115 inherited uncontrolled-tag warnings.

Selected evidence:

- candidate Inventory-to-ontology population and ontology
  operationalization paths;
- candidate CAV2 authority and frozen-referent determinism boundaries;
- verified IOLM read-only projection architecture, while its GET API task
  remains blocked and not started;
- verified OEW runtime-rebuild lessons plus its source-admission,
  loss-aware-adapter, immutable-run, and loopback-gateway architecture;
- verified Augmentor owner-preserving architecture and live ontology profile;
- verified Body War relationship findings and live ontology profile.

Excluded evidence:

- earlier strategy rows superseded by completed verified results;
- the flagged OEW plan/architecture audit where later verified research is
  stronger;
- simple ontology-presentation cards that do not own runtime or API behavior.

Design consequences:

- explicit registration and adapters, not repo crawling;
- immutable snapshots and reports, not a new ontology truth store;
- separate query, operation, and proposal-handoff effects;
- three fixture families, not one normalized project schema;
- exact selectors and digests for every load-bearing API claim;
- IOLM and OEW remain precedents, not proof of a generic runtime.

Gaps:

- Inventory has no current runtime-profile entry and no operational matches
  for final approver, agent pool, predicted disagreement, or confirmation
  readiness, so live owners were read directly.
- CAV2 has no runtime profile witness.
- No shared adapter contract or accepted three-package witness exists.

Inventory is a discovery read model, not proof or dispatch authority.

## Gate and ledger state

- Confirmation readiness: `PASS`
- Live schema: `0.8.0`
- Sheet SHA-256:
  `b11813c157de11e50de4312720f42e79af3502e2288b5dc4ea6bec755371d888`
- Ledger mutation during readiness validation: `none`
- Dispatch Spec: `PASS`
- Tension checker:
  `check-tension:checker:b11813c157de11e50de4312720f42e79af3502e2288b5dc4ea6bec755371d888:tension_checker = PASS`
- Tension reviewer:
  `check-tension:reviewer:b11813c157de11e50de4312720f42e79af3502e2288b5dc4ea6bec755371d888:tension_reviewer = PASS`
- Human confirmation: pending
- Registration: not appended
- Execution: not started
- Closeout expectation: exactly one dispatch row and one close row after a
  confirmed run, with every agent joined and closed

## Post-result Inventory residue

The repository Inventory is currently dirty with unrelated in-progress
entries and index changes. This proposal records the required strategy-result
hook as deferred rather than rewriting another owner's live read model. Before
registration or immediately after closeout, the parent must reconcile that
state and then add the strategy/result entry, human-index link, tags, gate
artifacts, and lifecycle log row.

## Next human action

Reply `confirmed` to authorize the exact sheet whose SHA-256 is
`b11813c157de11e50de4312720f42e79af3502e2288b5dc4ea6bec755371d888`.

Any sheet-byte change after confirmation requires form revalidation, two new
independent tension verdicts, and explicit reconfirmation.
