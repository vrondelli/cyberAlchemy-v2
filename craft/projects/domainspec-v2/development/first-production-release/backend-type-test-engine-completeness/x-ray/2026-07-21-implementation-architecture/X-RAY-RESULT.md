# Backend Test Engine Design X-Ray

## x-ray Result

- Status: `pass`
- Mode: `mixed` (`architecture` + `process`)
- Target boundary: the validated DomainSpec v2 BTE Design, its current compiler
  foundations, its graph-to-proof workflow, and its downstream consumer gates
- User intent: understand concretely how BTE will be implemented and how one
  ordinary DomainSpec change moves from source to replayable evidence
- Reader baseline: `newcomer`
- Output: [`index.html`](index.html)
- Machine lanes: [`lanes.json`](lanes.json)
- Machine process instances: [`instances.json`](instances.json)
- Whisper result: [`WHISPER-RESULT.md`](WHISPER-RESULT.md)
- Copy audit: [`review/2026-07-22-conversational-language-audit/findings.md`](review/2026-07-22-conversational-language-audit/findings.md)
- Layer interaction: `stacked`, `isolate`, `compare`, `trace`
- Renderer level: `L0 static HTML/SVG`

## Status Meaning

The explanation passes the X-Ray structure and evidence-boundary checks. Its
subject has a validated Invoke Design and is ready for Invoke Plan. This does
not mean the successor contracts are implemented or admitted, that BTE is
complete, that either consumer has run, or that a release is approved.

The page keeps four reader-facing lifecycle states separate:

1. **Runs now:** current compiler, formation kernel/adapter, deterministic graph,
   source manifest, and narrow receipt/replay foundations.
2. **Design contract:** the architecture, logical record boundaries, exact
   proof catalogues, failure order, and dependency interfaces now frozen for
   Plan.
3. **Build next:** versioned machine schemas, resolver/compiler breadth,
   graph-to-proof runtime, catalogues, evaluators, mutations, replay, and
   aggregates still to implement.
4. **Owner gate:** profile, formation, node-pattern, relationship, catalogue,
   consumer, and lifecycle admission remains outside BTE self-assertion.

The machine companions preserve separate `lifecycle_state`,
`implementation_state`, `evidence_status`, and `admission_status` axes. Legacy
composite status strings are mapped explicitly; `external` remains topology,
not a fifth lifecycle state.

## Lane Handles

- surface: `surface.summary`
- properties: `properties.catalog`
- components: `components.map`
- internal_dependencies: `dependencies.internal`
- external_dependencies: `dependencies.external`
- flow: `flow.graph`
- lifecycle: `lifecycle.timeline`
- risk_questions: `risk.questions`
- visual_composition: `visual.model`

## Reader On-Ramp

The page states the BTE boundary directly, then anchors the architecture in the
checked-in `UnlockDoor` example. Today the compiler can validate its
`writes_state` formation, preserve its `produces` and `enforces` graph edges,
and join those records to source paths and digests.

That is necessary but incomplete. It does not prove that every independently
required check was derived, uniquely bound, executed, discriminating, and
replayable. The BTE Design supplies that missing proof path.

## Architecture Result

The Design has four non-collapsible responsibilities:

1. **Contracts and admission:** the successor profile
   `feature-with-independent-node-and-edge-files@1`, isolated
   `formation-v2/` contracts, complete JSON retirement/source migration maps,
   independent node/edge sources, causal proof selections, and owner handles.
2. **Source and graph:** explicit profile dispatch, versioned resolver/compiler
   path, complete formation and relationship validation, one canonical
   `MintedGraph`, one `MintedSourceManifest`, and a compiler-owned build receipt.
3. **Proof and evidence:** immutable `ProofContext`, independent `O_spec`,
   graph-derived `O_gen`, exact-set comparison, TestCase materialization, exact
   bindings, four bounded evaluator interfaces, execution, clean child-lineage
   mutations, proof receipts, replay, and `verify:bte:core`.
4. **Consumers and lifecycle:** independent IOLM and Body War runners, BTE-owned
   consumer replay, consumer/terminal aggregates, and external admission or
   release decisions.

The central correction is the `ProofContext` boundary. It is a typed handle
envelope over the one canonical graph, manifest, build receipt, profile,
registries, formation catalogue, and source-set digest. It is not a second
semantic graph. Any materialized proof rows must be lossless, digest-bound, and
bijective with the canonical graph/manifest.

## Exact Proof Catalogues

The page presents six proof questions separately:

| Catalogue | Membership |
| --- | --- |
| `formation-criterion@1` | exact 16 kind-scoped criteria |
| `formation-structure@1` | exact 13 kind/schema structure bundles |
| `node-kind-causality@1` | exact 13 admitted kind witnesses/effects |
| `node-instance-conformance@1` | exact nodes in one graph build |
| `relationship-family-causality@1` | exact 16 admitted families |
| `edge-instance-conformance@1` | exact edges in one graph build |

For each catalogue, equality means the same `coverage_key` across independently
expected obligation, generated obligation, TestCase, executed result, and
killed primary mutant. The records keep different artifact IDs; counts alone
never prove equality.

## Concrete Process Instances

The HTML contains four process instances:

1. **Live compiler:** checked-in `UnlockDoor`, its governing criterion, graph
   row, source-manifest join, build receipt, and observed invalid-value
   diagnostic.
2. **Design proof chain:** the same node continued through `ProofContext`,
   `O_spec`, `O_gen`, exact comparison, pre-run `TestCase`, exact `Binding`,
   bounded `Evaluator`, post-run `ExecutionResult`, fresh-lineage
   `MutationResult`, `ProofReceipt`, and `ReplayResult`. Record values remain
   illustrative until their machine schemas are built.
3. **Relationship causality:** the real
   `HasKeyRule --enforces--> UnlockDoor` edge plus the Design-required causal
   selection/removal proof, still blocked from core eligibility until exact
   relationship admission.
4. **DomainSpec workday:** one requested change moves through current compiler
   work, the Design contract, Build next proof and consumer work, and an Owner
   gate.

The live graph also contains
`UnlockDoor --produces--> DoorUnlocked`. This proves structural preservation of
that typed relation and its provenance. It does not prove runtime door behavior
or universal application semantics.

## Dependency Order

The X-Ray mirrors [DESIGN-LAYERING-SEED.md](../../DESIGN-LAYERING-SEED.md):

1. common handles, IDs/digests, diagnostics, authority classes, exact sets;
2. formation v2, retirement map, compatibility corpus, false-green control;
3. successor node/edge source schemas and connection migration;
4. successor compiler, canonical graph/manifest, build replay;
5. independent catalogues and admitted causal selections;
6. one complete obligation proof unit;
7. complete six-catalogue core proof;
8. parallel IOLM and Body War handshakes;
9. consumer and terminal aggregates.

This is a Design dependency seed. Invoke Plan still chooses concrete tasks,
files, waves, owners, and validation commands.

## Evidence Boundary

### Source-backed

- current machine registries, schemas, compiler/resolver/kernel/adapter behavior;
- Key and Door source, graph, manifest, receipt, and negative diagnostic;
- the accepted formation/FPR decisions;
- `DEFINE.md`, `REQUIREMENTS.md`, and the validated `DESIGN.md` as lifecycle
  contracts, while remaining non-semantic Markdown;
- current legacy engine first-match, skip/todo, and tolerant-comparator limits.

### Explanatory inference

- the page layout, four-state visual treatment, record-card wording, and
  concrete candidate values for machine contracts not implemented yet;
- suggested internal code homes, which Plan may refine while preserving Design
  dependency interfaces;
- the local `exact-proof-chain` visual pattern.

## Visual Library

Canonical components:

- `shape.node`, `shape.boundary`, `shape.layer-panel`, `shape.risk-marker`;
- `connector.arrow`, `connector.branch`, `connector.feedback-loop`;
- `chart.timeline-strip`, `chart.risk-matrix`.

Canonical patterns:

- `pattern.process-branch`;
- `pattern.dependency-boundary`;
- `pattern.lifecycle-stack`;
- `pattern.evidence-inference-split`.

Custom-pattern nudge: `exact-proof-chain` remains a local explanatory pattern.
Promote it only after repeated examples prove the same visual contract.

## Remaining Gates

- Plan must repair the missing explicit requirement trace while regenerating
  the stale execution package. The exact FPR-02 decision identifier remains in
  the X-Ray provenance note for maintainers.
- Formation/profile, node-pattern, relationship, and independent catalogue
  handles still require their owning admission/freeze actions.
- All successor machine contracts, proof runtime, replay, aggregates, and
  consumer handshakes remain implementation work.
- UI stays in its independent lane.
- Only lifecycle owners may promote FPR, release, or production state.

## Validation

- canonical lane schema and X-Ray validator: pass;
- all nine lane handles, reader contract, reader terms, outcomes, and
  readability dynamics: present;
- four process instances: present;
- explicit Runs now / Design contract / Build next / Owner gate mapping:
  present in HTML and machine companions;
- lifecycle, implementation, evidence, and admission axes: separately present;
- accepted C1-C8 and E1-E4 copy-audit corrections: applied;
- local JSON, HTML structure, JavaScript syntax, and links: pass;
- remote scripts, stylesheets, images, and links: absent;
- DomainSpec v2 tool tests: `147/147`;
- test-derivation engine tests: `107/107`;
- TypeScript typecheck: pass.

## Next Route

Invoke Plan against the validated Design and layering seed. The X-Ray is an
explanation surface, not a Plan, machine schema, proof receipt, admission, or
release decision.
