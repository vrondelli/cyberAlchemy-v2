---
task_id: TASK-UIP-GRAPH
feature_code: UIP
layer: L2
status: complete
---

# TASK-UIP-GRAPH: Existing-Engine Compilation And Traversal

## SWU-UIP-004 — Per-Node Create Player Graph Source

- Goal: express the synthetic case as a DomainSpec feature with one source file
  per node and explicit connections, using only admitted canonical relationships
  after representation normalization.
- Dependencies: SWU-UIP-001..003.
- Source anchors: minted-project per-node layout; current DS-D8 UI signatures;
  synthetic manifest; representation normalizer contract.
- Write scope:
  - `projects/domainspec-v2/impl/spec/features/ui-profile-create-player/`
  - focused graph fixtures/tests
  - `runs/SWU-UIP-004/`

### Algorithm

1. Create backend and UI nodes as separate files with stable IDs.
2. Normalize Adapter to Mapping while retaining `ui_concept: Adapter` metadata.
3. Materialize both State Indicator branches without using the unresolved
   `reflects` endpoint as canonical proof.
4. Emit connections only when the active DS-D8 signature admits normalized
   endpoints.
5. Record every omitted or transformed edge in typed residue.
6. Validate positive graph construction and focused invalid endpoint fixtures.

### Failure Modes

- Monolithic source file, missing required concept, invented relationship,
  unresolved endpoint silently accepted, or profile metadata replacing node
  identity: block.

### Done And Validation

- All required concepts are traceable from source nodes/metadata to the graph.
- Active relationships pass and named endpoint mutants fail.

```bash
cd projects/domainspec-v2/impl
npm run validate:content -- --features-root spec/features/ui-profile-create-player
npm run validate:rels -- --features-root spec/features/ui-profile-create-player
```

## SWU-UIP-005 — Compiler, Minter, Views, And Traversal

- Goal: compile the development profile through the existing DomainSpec engine
  and prove deterministic traversability and view agreement.
- Dependencies: SWU-UIP-004.
- Source anchors: `impl/tools/minted-project/{compiler,minter,views}.ts`, current
  contract tests, profile registry and feature source.
- Write scope:
  - required existing minted-project compiler/minter/view modules
  - CLI/profile-selection and focused test fixtures
  - generated output only under the UI profile fixture/run path
  - `runs/SWU-UIP-005/`

### Algorithm

1. Add an explicit development-profile-registry input; preserve canonical
   registry as the default.
2. Fail closed when a development profile is used without the explicit handle.
3. Compile nodes/connections using the existing graph data model.
4. Emit source manifest, graph, build receipt, per-node generated records, and
   Markdown view.
5. Traverse from Page and from each backend endpoint; record reachable nodes,
   edges, normalized representations, and residue.
6. Compile twice and compare semantic digests and human/machine projections.

### Failure Modes

- Parallel compiler, implicit dev-profile activation, nondeterministic digest,
  graph/view disagreement, orphan required concept, or loss of source handles:
  block.

### Done And Validation

- Existing canonical tests remain green.
- Two development-profile runs are byte/semantic stable as declared.
- Traversal covers every required concept representation.

```bash
cd projects/domainspec-v2/impl
npm run tools:test
npm run engine:test
npm run typecheck
```

- Execution owner for both SWUs: sequential local Task Session.
- Context Builder anchors: this task, compiler/minter/view symbols, supported
  profile contract tests, synthetic manifest, and DS-D8 UI signature selectors.
- Expected receipt: source/output manifests, two-run digests, traversal matrix,
  validation results, residue, and next-SWU handoff.
