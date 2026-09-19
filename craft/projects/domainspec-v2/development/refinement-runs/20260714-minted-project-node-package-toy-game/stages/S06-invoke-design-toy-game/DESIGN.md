# Invoke Design — Project-Local Node Package and Toy Tournament

Status: `pass at L0 with scope limits`  
Profile: run-local DomainSpec architecture companion  
Upstream define: `stages/S02-invoke-define/DEFINE.md`

## 1. Context View

The design tests a project-mint boundary, not a DomainSpec repository feature-home decision.

```text
DomainSpec language installation
  kinds registry + relationship registry + compiler/validator behavior
                         |
                         | language version/digests
                         v
Minted consumer project --- authors ---> project manifest + feature node/edge sources
                         |
                         | deterministic compile
                         v
      graph.json + source-manifest.json + build-receipt.json + SPEC.md
             |                                      |
             v                                      v
      implementer-agent                         human learner
```

The consumer owns the project manifest and domain declarations. The compiler outputs are disposable, reproducible views. The toy compiler in this run is evidence machinery, not proposed production code.

## 2. High-Level Structure View

| Component | Responsibility | Authority posture |
| --- | --- | --- |
| `project.json` | binds project ID, language digests, and feature manifest paths | consumer-project source |
| feature manifest | selects one authoring layout and enumerates its machine sources | consumer-project source |
| node/edge/aspect sources | own concrete domain meaning and exactly one declaration per node/edge | consumer-project source |
| layout reader | converts A/B/C storage shape to common candidate records | disposable experiment code |
| validator/normalizer | checks required fields, containment, uniqueness, kind/edge registries, endpoints, and deterministic order | DomainSpec-behavior candidate exercised by run code |
| `graph.json` | layout-neutral first-class nodes and edges for traversal | generated semantic view |
| `source-manifest.json` | maps graph IDs to canonical project-local sources and hashes | generated provenance view |
| `SPEC.md` | human-readable projection of graph semantics | generated human view |
| `build-receipt.json` | binds source-set, language, graph, manifest, and view digests | generated verification evidence |

## 3. Low-Level Components View

### Common source contract

- Node required fields: `schema_version`, `node_id`, `feature_id`, `kind`, `intent`, `body`.
- Edge required fields after layout reading: `edge_id`, `type`, `from`, `to`.
- Layout A derives `from` from the node that owns the embedded outgoing connection.
- Layout B reads one edge record per file.
- Layout C reads arrays from aspect bundles and a connections bundle.
- All IDs must be unique and all paths must resolve under the candidate project root.

### Normalized graph contract

`graph.json` is intentionally layout-neutral so all valid candidates must be byte-identical. It contains semantic nodes and edges plus effective language digests, but no source paths. `source-manifest.json` owns the layout-specific mapping needed to open a node source. This separation avoids contaminating semantic equivalence with storage location while preserving implementer navigation.

### Build binding

`build-receipt.json` binds:

- source-set digest over every canonical input file;
- effective kind and relationship registry digests;
- graph digest;
- source-manifest digest;
- Markdown digest.

Verification fails when graph, source manifest, or Markdown bytes no longer match the receipt.

## 4. Workflow Process View

1. Resolve `project.json` and each feature source path under the consumer root.
2. Verify the live registry digests equal the project-declared language digests.
3. Read the selected layout into common node and edge candidates.
4. Validate required machine fields and unique node/edge identities.
5. Resolve every endpoint and enforce the active relationship signature's exact source/target kinds.
6. Canonically sort semantic nodes and edges.
7. Emit byte-stable `graph.json`.
8. Emit layout-specific `source-manifest.json` mapping IDs to source files and hashes.
9. Generate `SPEC.md` only from normalized graph semantics.
10. Emit the digest-bound build receipt.
11. Repeat compilation and compare bytes.
12. Run eight mutants and require their named failure classes.

## 5. Decision Flow View

```text
path escapes project root? -------------------- yes --> source-path-escape
        no
registry digest mismatch? --------------------- yes --> language-digest-mismatch
        no
required machine field missing? --------------- yes --> missing-machine-field
        no
duplicate node or edge identity? -------------- yes --> duplicate-identity
        no
target missing? ------------------------------- yes --> dangling-target
        no
relationship unknown/inactive? ---------------- yes --> unknown-relationship
        no
endpoint kinds violate signature? ------------- yes --> endpoint-invalid
        no
normalize -> generate -> bind receipt -> verify drift
```

Candidate selection occurs only after all valid layouts compile to one semantic graph and every mutation fails with its expected class. Pareto criteria are authority clarity, traversal completeness, determinism, edit locality, and source-file cost.

## 6. Dependency Interface View

| Interface | Input | Output | Failure boundary |
| --- | --- | --- | --- |
| language registry adapter | current `meta-types.yml`, `relationships.yml` | admitted kind set and active signature map | digest mismatch, missing admitted kind/signature |
| layout reader A | feature manifest + node files | common nodes/edges + ownership refs | malformed node or embedded connection |
| layout reader B | feature manifest + node and edge files | common nodes/edges + ownership refs | malformed independent edge |
| layout reader C | feature manifest + aspect bundles | common nodes/edges + ownership refs | malformed bundle or concentrated duplicate |
| normalizer | common nodes/edges + registries | semantic graph | ID, target, label, endpoint failure |
| provenance generator | common records + source files | source manifest/source-set digest | missing or escaped source |
| view generator | normalized graph | Markdown | no source-only lookup allowed |
| verifier | outputs + build receipt | pass/failure class | stale graph/manifest/Markdown |

## Source Contracts

- Current kind registry evidence: `projects/domainspec-v2/definitions/meta-types/meta-types.yml` at SHA-256 `a3c37a65ed1bffa5cf2dc4e6b11ccffd4463a24e341a234abf60c916f6ab0f04`.
- Current relationship registry evidence: `projects/domainspec-v2/definitions/relationships/relationships.yml` at SHA-256 `567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41`.
- Candidate source roots: `toy-game/candidates/layout-{a,b,c}/` only.
- Generated run outputs: `toy-game/generated/` only.

## Glossary Consistency

Status: `pass with candidate terms`. Factory, consumer project, canonical node source, normalized graph, source manifest, generated view, and workflow witness retain the S02 meanings. No local term is promoted into the DomainSpec or CyberAlchemy definition authority.

## Design Decisions

| ID | Decision | Rationale | Status |
| --- | --- | --- | --- |
| DD-01 | Separate semantic graph from layout-specific source manifest. | Gives byte-equivalent graph semantics while preserving open-source navigation. | accepted for experiment |
| DD-02 | Bind language registries by digest in the project manifest and receipt. | Reproducibility without copying registry authority into consumer content. | accepted for experiment |
| DD-03 | Treat embedded connections as first-class normalized edges. | Tests per-node authoring without collapsing edge identity. | hypothesis under tournament |
| DD-04 | Reject project-root escapes before reading sources. | Makes factory-to-consumer authority handoff mechanically visible. | accepted for experiment |
| DD-05 | Generate Markdown solely from normalized graph. | Proves human views cannot repair missing machine semantics. | accepted for experiment |

## Risks and Gaps

- A single feature does not prove cross-feature resolution.
- Stable edge IDs preserve an extension seam but do not prove independent edge governance.
- Digest references do not design package distribution or compatibility negotiation.
- The toy compiler validates only the experiment envelope and current exact kind/signature endpoints; it is not the production DomainSpec validator.
- Current kind maturity remains candidate/shape-fixture-backed rather than release admission.

## Implementation Layering Seed

This stage exercises only L0 comparative proof. The run emits no production task, schema, template, or validator change. S09 may plan L1–L3 as a non-executed work-pack after review/repair.

## Dispatch Technique Trace

| Technique | Design effect |
| --- | --- |
| `toy_game` | uses one minimal connected domain to expose source/graph/view boundaries |
| `tournament` | keeps A/B/C alive through identical positive and negative tests |
| `pareto_gate` | compares only explicit evidence criteria, not aesthetic preference |
| `validation_loop` | compiles twice, verifies receipts, and runs named mutants |
| `assessment_failure_reference` | every rejected case must emit its expected failure class |
| `state_namespace_boundary` | candidate project roots and generated output roots are isolated |
| `owner_boundary_check` | factory form, consumer meaning, and generated projections stay separate |

## Distill Design-Unit Check

Status: `pass`. The selected unit is one feature source package plus a disposable comparison harness. All layouts compiled to graph SHA-256 `25a637c3608a3fa7d0969b31baf9ff3bc4c06c6c165972c044bb4e887aa902f2`; all repeat runs were byte-equal; all eight mutants produced their expected failures. Split pressure remains limited to layout readers and no layout-specific semantic rule appeared. S07 still owns the adversarial interpretation.

## Invoke Result

- Mode: design
- Spell: `invoke`
- Phase status: `pass`
- Outputs: `DESIGN.md`, `toy-game/EVIDENCE.json`, `native-receipt.json`
- Design views: all six present
- Template/profile selection: run-local DomainSpec architecture companion; no promotion
- Glossary consistency: pass with candidate terms
- Distill validation: pass; one graph across three layouts and eight named failures
- Implementation layering: S02 seed, L0 only
- Work-pack: n/a
- Next route: `interrogation refine-design-review`

## Tournament Outcome

- Evidence: `toy-game/EVIDENCE.json` at SHA-256 `efd90de9b4d1b713866949a5701cf65de67d5b9d37bc0962f1788be85fc0883e`.
- Semantic graph: byte-identical across A/B/C.
- Generated Markdown: byte-identical across A/B/C.
- Determinism: all three layouts repeated byte-for-byte.
- Negative controls: 8/8 returned the expected failure class.
- Pareto result: layout A is the only non-dominated candidate under the approved five criteria.
- Preserved option: rerun layout B if edges acquire an owner or evidence lifecycle independent of their source nodes.
