# Context Pack — FormalClaim Lean/EVF Integration @3

Status: strict deep session evidence; runnable for bounded Design authoring only

## Identity and boundary

- Task: author a combined FOL + Lean/DTT + category-model + EVF theorem-provider
  successor before exact owner/verifier admission.
- Candidate: `dsv2-formalclaim-multiformalism-lean-extension@3`.
- Mode: Context Builder deep, strict, persisted under this run.
- Budget: 22 files, 408 selector excerpt lines; maximum 24 files and 520 lines.
- Write scope: only this fresh Invoke Design run root.
- Non-goals: canonical ontology changes, proof execution, provider admission,
  implementation, Plan/Work Pack, migration, discharge, Git, publication.

## Obligation matrix

| ID | Obligation | Evidence selectors | Status |
| --- | --- | --- | --- |
| O01 | Preserve unaccepted @2 FOL/source/assessment/projection design and exact relation direction. | @2 report lines 5-34; @2 SPEC `Canonical ontology chain` and contracts 1-4; @2 architecture views 1-3 | covered |
| O02 | Make FormalClaim multi-formalism and separate Lean source proposition from theorem declaration/proof evidence. | @2 SPEC `Outcome`; `AgentPermissionKernel.lean` 89-166; parent Balancer constraint recorded in @3 design intent | resolved by source/proof split |
| O03 | Support native Lean and translated non-native-to-Lean paths with exact accepted semantic mapping. | @2 projection contract; `SchemaInstance.lean` 57-103; planned binding contract | resolved by two path kinds |
| O04 | Require stable environment-bound proposition/declaration identities, not paths or pretty text. | `lean-toolchain`; `lakefile.toml` 1-32; EVF digest chain README 44-77; provider manifest | covered |
| O05 | Admit category theory only per complete local model; forbid global-category inflation. | `SchemaInstance.lean` 57-103; `SchemaTaxonomy.lean` 6-38; morphism research 34-47, 85-105 | covered |
| O06 | Distinguish Lean dependent type theory from DomainSpec graph endpoint typing. | `SchemaInstance.lean` 60-77; `DomainSpecEdgeSignature.lean` 187-235 | covered |
| O07 | Define Lean provider manifest/request/receipt and total outcomes. | EVF README 71-96; graph receipt provider/result enums; `PermGuard.lean` 16-80, 347-456 | covered |
| O08 | Fail closed on `sorry`, unexpected axioms, unsafe declarations, stale identities, and failed builds. | Lean `#print axioms` selectors; EVF claim ceiling; provider receipt failure normalization | resolved as planned validator contract |
| O09 | Preserve theorem evidence versus parser/runtime/deployment conformance. | EVF README 89-96; `PermGuard.lean` 16-80; `AgentPermissionKernel.lean` 9-42 | covered |
| O10 | Keep Lean as a distinct EVF lane; do not reuse graph receipt meanings. | graph receipt `provider.kind` and `native_result`; provider runtime manifest | covered |
| O11 | Treat research as candidate input and include collapse tests for category language. | research README 30-41; morphism research 34-47; `ScopedContextReindexing.lean` 8-25; `ContextAugmentationSafety.lean` 9-26; refinement fibre 10-39 | covered |
| O12 | Plan all required positive/negative witnesses without execution claims. | @2 planned witnesses; @3 requested witness list | resolved in `PLANNED-WITNESSES.json` |
| O13 | Bind exact @3 candidate hashes and route once to Rondelli/Victor admission after parent Balancer. | @2 parent join next route; @2 material/target inventories | covered |
| O14 | Preserve every source/protected byte and unrelated dirty work. | pre-write Git/status and raw SHA-256 baseline | covered |

Coverage: 14/14 covered or explicitly resolved; blockers: 0.

## Selected evidence

| Source | Selector | Why selected | Obligations |
| --- | --- | --- | --- |
| `.../@2/REFRESH-REPORT.md` | What changed; evidence boundaries; authority and next route | terminal @2 status and ceiling | O01, O13 |
| `.../@2/successor/define/SPEC.md` | Outcome; canonical chain; contracts 1-4; theorem lane | predecessor semantic contract | O01-O03 |
| `.../@2/successor/design/ARCHITECTURE.md` | views 1-3; theorem/provider components; result ceilings | predecessor design unit | O01, O07, O10 |
| `evolvable-validation-framework/README.md` | Why EVF exists; formal obligations; What EVF is not | EVF evidence semantics | O04, O07, O09 |
| `evolvable-validation-framework/DESIGN.md` | six views and typed receipt interfaces | current EVF design boundary | O07, O10 |
| `contracts/provider-runtime-manifest.v1.json` | complete document | exact provider/runtime admission precedent | O04, O07 |
| `contracts/graph-law-provider-receipt.v1.schema.json` | provider enum; execution/native/normalized results | proof that graph meanings are closed and non-Lean | O07, O10 |
| `AgentPermissionKernel.lean` | 9-42, 89-166, 209-213 | proposition/executable theorem and honest ceiling | O02, O08, O09 |
| `PermGuard.lean` | 16-80, 347-456 | parser/runtime trust border separated from proof | O07, O09 |
| `AgentPermissionKernelRefinementFibre.lean` | 10-39, 55-135 | bounded category framing plus non-security ceiling | O05, O11 |
| `ScopedContextReindexing.lean` | 8-25, 54-132 | explicit category collapse-test | O05, O11 |
| `ContextAugmentationSafety.lean` | 9-26, 33-104 | functional factorization, explicitly not Kan | O05, O11 |
| `lean-engineer/lakefile.toml` | 1-32, 50-81 | project/dependency/import target context | O04, O08 |
| `lean-engineer/lean-toolchain` | full line | exact Lean toolchain source | O04 |
| `SchemaInstance.lean` | 6-38, 57-103, 124-162 | genuine category/DTT model and laws | O03, O05, O06 |
| `SchemaTaxonomy.lean` | 6-38, 58-99 | prevents three `Schema` meanings colliding | O05, O06 |
| `DomainSpecEdgeSignature.lean` | 6-30, 187-235, 341-390 | graph endpoint typing and adequacy ceiling | O05, O06 |
| `research-domainspec/README.md` | 10-41 | research non-authority rule | O11 |
| `morphisms-and-relations/research-initial-definitions.md` | 34-47, 85-105 | no arrows-to-category inflation | O05, O11 |
| `representation-adequacy-viability/research-initial-definitions.md` | 17-53 | small testable core, theory only when justified | O05, O11 |
| `.arcanum/inventory/index.json` | validation and four selected entry records | machine lookup and nearby candidate evidence | O05, O11 |
| `.arcanum/inventory/index.md` | rows 35, 88, 135, 444 | human orientation and exclusions | O05, O11 |

## Exact source digests

The structured index binds all 22 source paths to raw SHA-256 values. The most
material bindings are:

- @2 report: `97cd440262519d2665d01a11f799cc6162172d5509f20e0381d21006ca440d5f`;
- @2 SPEC: `29a8f7475f0135673a2d5b79d65ef878e36fa042c1068bfc1f2e5fcc7fb84042`;
- @2 architecture: `ba71bc43e2f56366842ee0dc67c0b8a9cbf247f217e189517857761757c8e896`;
- EVF README: `b46d659da853a0bf7d136fbedb4d05040eea961bc7461a5f7aa538d904f2554a`;
- `SchemaInstance.lean`: `1c5f22ec3568bce86a14afff02d3e7036a7274aba71003c6a239ba79309fa9a5`;
- `DomainSpecEdgeSignature.lean`: `ea693acb184cbe958d8c615b3d3a88338eb7726a81da54feef12c64bfe0cfaed`.

## Constraints and resolutions

- Repository-local Lean authority requires `claim <= proof`, no unsupported
  novelty posture, and collapse-tests for keystone category language. This pack
  therefore calls the work build-from-owned Design and cites bounded models.
- Existing EVF and Inventory dirty bytes belong to other work and are read-only.
- The exact algorithm for stable Lean proposition normalization is not invented
  in Design; its required environment inputs and path-only prohibition are
  specified for later Plan/implementation discrimination.
- Context fallback is restricted to an exact referenced schema or validator
  needed mechanically. No fallback expansion was required.

## Handoff

This pack authorizes only Design authoring and local validation within the run
root. It does not authorize proof execution, product mutation, owner acceptance,
or any external effect.
