---
dispatch_id: 2026-07-12-r3c-second-corpus-selection
artifact_role: verbatim-explorer-transcript
status: collected
created: 2026-07-12
---

# SWU-R3C-004 Second-Corpus Selection — Explorer Returns

## Agent 1 — Shannon, Claude

Read-only corpus inventory complete; no validators were executed.

| Rank | Candidate / exact path | Direct evidence | Inference / conversion cost | Disqualifiers | Verdict |
|---|---|---|---|---|---|
| 1 | `projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/agent-execution-orchestrator/` | Repo-owned draft feature with 36 registered concepts, six aspect docs, stories, capabilities, and a substantial work-pack. `SPEC.md:142-157` contains 12 graph rows. Nine already conform structurally to current DS-D8 and exercise five signatures absent from the current financial-settlement pack: `orchestrates`, `contains`, `applies`, `exposes`, `produces`. The ontology package explicitly names AEO as the richer fallback (`research/spec-ontology-unification/DEFINE.md:145-149`). | Moderate conversion: its existing aspect files provide semantics, so a v2 pack can be derived without inventing a domain. Copying it wholesale would be unsafe. | Three graph rows are invalid under current DS-D8: two misuse `enforces` and `RunArtifactMapping --maps--> TelemetryEnvelope` targets a Value Object although `maps` admits Entity/Interface. Several cross-feature links point to absent fixture siblings. Status is `draft`; current-validator compatibility is unverified. | **SELECT**, with bounded normalization. |
| 2 | `projects/domainspec-v2/development/comprehension-novice-test/task.md`, supported by `stall-dataset.md`, `task-coverage-audit.md`, and `projects/domainspec-v2/research/target-state/examples/campusread-settled-loan.md` | Strongest owned business brief: CampusRead supplies Patron/Copy/Loan/Title/Branch semantics, workflows, rules, policies, events, and target-state evidence. The witness directly exposed missing Entity→Entity relations; current DS-D8 now uses this domain’s examples for `owns` and `belongs-to` (`definitions/relationships/relationships.yml:244-273`). | High conversion: likely best later corpus for exercising the newly added Entity→Entity signatures, but it requires authoring the actual feature pack and graph from source evidence. | No saved DomainSpec aspect/SPEC pack exists. The frozen task/audit includes historical Saga assumptions explicitly superseded on 2026-07-11; a new version must use scoped Workflow rather than replaying the old instrument. | **DEFER**, not first selection. |
| 3 | `projects/domainspec-v2/research/spec-ontology-unification/toy/` | Complete extraction/mapping evidence: 23 owned nodes, 25 edges, 10 edge types (`toy/graph.md:19-74`). | Near-zero analytical conversion. | It is explicitly another extraction of `financial-settlement` (`toy/graph.md:7,12`), so it cannot satisfy “second corpus.” | **REJECT** as second corpus. |
| 4 | `projects/domainspec-v2/impl/spec/features/sample/SPEC.md` | Existing valid fixture. | No conversion. | Explicitly minimal and has no relation declarations (`SPEC.md:106-113`); provides zero DS-D8 breadth or business evidence. | **REJECT**. |
| — | `projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md` | Governing evidence says ≥2 real feature packs are required and names second-corpus breadth as still open (`:31-41`, `:47-53`, `:117-121`). | Control source, not corpus. | Contains no independent domain pack. | **Not a candidate**. |

Recommendation: **select Agent Execution Orchestrator**, but treat it as a source corpus rather than a ready-to-copy valid pack. Preserve its nine currently admissible graph rows, normalize or omit the three legacy-invalid rows using existing authored semantics, and use one invalid row as the required negative fixture. This yields five additional DS-D8 signatures at materially lower cost than authoring CampusRead.

If AEO’s current-schema conversion proves larger than this inspection suggests, stop with an exact incompatibility finding and promote CampusRead to a dedicated pack-authoring SWU; do not silently invent bridging semantics.

## Agent 2 — Noether, Emmy

### Recommendation

**SELECT `development/comprehension-novice-test/task.md` as the source corpus for a new minimal CampusRead pack.** It is repo-owned, distinct from financial-settlement, and directly supplies Entity→Entity business semantics. Reject the other installed candidates.

Legend: **D** = direct repository evidence; **I** = inference needed to construct the pack.

### SWU-R3C-004 obligation matrix

| Obligation | Exact evidence | Assessment |
|---|---|---|
| Dependency satisfied | **D:** `development/r3-closeout-plan/work-pack/tasks/TASK-R3C-CORPUS.md:21,37`; `task-sessions/2026-07-12-swu-r3c-001/TASK-SESSION-RESULT.md:13-14` | SWU-R3C-001 passed; dynamic endpoint rules consume root DS-D8. |
| Inventory repo-owned candidates first | **D:** `TASK-R3C-CORPUS.md:27,43` | Candidates found: financial-settlement, `sample`, spec-ontology toy, CampusRead. |
| Exercise evidence beyond financial-settlement | **D:** `TASK-R3C-CORPUS.md:9-10`; baseline graph at `impl/spec/features/financial-settlement/SPEC.md:29-37` | Current pack exercises only `enforces`, `calculates`, `produces-for`, `queries`. |
| Prefer additional signatures, especially Entity→Entity/cross-feature | **D:** `TASK-R3C-CORPUS.md:28`; active `owns` and `belongs-to` authority at `definitions/relationships/relationships.yml:244-268` | CampusRead directly supplies ownership/membership facts absent from baseline. |
| Business semantics must be sourced | **D:** `TASK-R3C-CORPUS.md:29-30,43` | CampusRead facts are explicit; derived graph choices must be restricted to those facts. |
| Materialize/select only within allowed scope | **D:** `TASK-R3C-CORPUS.md:38` | New pack belongs under `impl/spec/features/<second-pack>/`; tests only if needed. |
| Positive acceptance | **D:** `TASK-R3C-CORPUS.md:39-41` | New pack must pass `validate:content` and `validate:rels`. |
| Negative acceptance | **D:** `TASK-R3C-CORPUS.md:40` | Seed one invalid endpoint edge and prove rejection. Good discriminating case: `LateFee` (Value Object) `--[belongs-to]--> Title` (Entity), violating the Entity source requirement. |
| Code-tag gate is conditional | **D:** `TASK-R3C-CORPUS.md:41`; `task-sessions/...swu-r3c-003/TASK-SESSION-RESULT.md:52-58` | Run `tags:composability` only if the selected corpus has code tags. CampusRead currently has none, so this is N/A, not a failure. Do not treat aggregate `validate` as composability proof. |
| Preserve unsupported runtime semantics honestly | **D:** SWU-R3C-001 receipt lines 21-26, 52-57; SWU-R3C-002 receipt lines 29-42 | Endpoint-valid edges may still report explicit `CT-COMP-024` gaps; do not inflate endpoint validation into code-call proof. |
| Synchronize gap after landing | **D:** `TASK-R3C-CORPUS.md:45-47` | Update Craft `GAP-DSV2-EXERCISE` if the pack lands; otherwise leave active with exact repair path. |

### Candidate evaluation

| Candidate | Additional coverage / endpoints | Source-backed semantics | Non-duplication | Verdict |
|---|---|---|---|---|
| `impl/spec/features/sample/SPEC.md` | **D:** zero relationships (`:7`) | Explicitly only a minimal fixture (`:1-10`) | Distinct but vacuous | **Reject** |
| `research/spec-ontology-unification/` | **D:** 10 distinct edge types, including `produces`, `orchestrates`, `applies`, `transitions`, `exposes`, `maps` (`toy/graph.md:51-74`) | Source-backed by fixture aspect files | **Fails:** declares its corpus as financial-settlement (`toy/graph.md:7,12-17`); verdict calls it a single corpus (`toy/verdict.md:61-63`). It also owns no Entity in that extraction (`toy/graph.md:78-80`). | **Reject as second corpus**; useful analysis only |
| `development/comprehension-novice-test/` | **D:** Copy belongs to Title (`task.md:22-24`), Copy belongs to Branch (`:34-36`), and Library owns Copies (`:22`): direct Entity→Entity evidence. Borrowing, rule gating, workflow, policy choice, lifecycle, and notifications appear at `:25-40`. | Strong: plain product brief intentionally contains the business facts (`:16-42`). | Distinct library-lending domain | **Select as source corpus** |
| `development/architecture-pattern-enforcement/WORK-PACK.md` | Governance plan, not business graph | No independent domain semantics | Not a corpus | **Reject as corpus** |

### Direct evidence vs construction inference

Safe direct facts for the minimal CampusRead graph:

- `Library --[owns]--> Copy`
- `Copy --[belongs-to]--> Title`
- `Copy --[belongs-to]--> Branch`

These use the brief’s own verbs and current DS-D8 Entity→Entity semantics.

Additional defensible but inferred typings:

- `Patron --[performs]--> BorrowCopy`
- `BorrowLimitRule --[enforces]--> BorrowCopy`
- `ReturnWorkflow --[orchestrates]-->` the stated return steps
- `ReturnRoutingPolicy --[applies]--> RouteReturn`
- return/fee operations `--[produces]-->` BookReturned/FeeAssessed
- BookReturned `--[transitions]-->` LoanLifecycle

Those mappings are supported by `task.md:25-40`, but operation boundaries and names are implementation inference. They should be kept minimal and explicitly traced, not presented as verbatim source declarations. Historical Saga material in the novice-test reports is superseded and should not be imported.

No validators were executed and no files were mutated.
