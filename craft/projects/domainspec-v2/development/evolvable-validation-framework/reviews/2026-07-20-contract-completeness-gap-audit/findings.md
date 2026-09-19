# Contract-completeness gap audit — revised candidate findings

Status: **final-auditor REJECT; loop ceiling reached**
Dispatch: `2026-07-20-evf-contract-completeness-gap-audit`
Authority: review evidence only; later Invoke must reread every authoritative machine source.

## Final auditor verdict

`REJECT` — the round-2 loop ceiling is reached. No third correction loop is
authorized.

Exact failures:

1. Frozen evidence drifted after `gap-matrix.json` was written:
   - `COMPILER`: recorded `7e0deaf9…6405`, live `842b86f7…e6a`;
   - `T_COMPILER`: recorded `2448566a…441b`, live `3400ec96…04c8`.
   The compiler now imports `validateMintedNodeFormation` and removes its local
   evaluator, directly affecting `GAP-009`. New adapter/test changes followed at
   `18:02:33`. Therefore `49/49` live digests and “no substantive delta” are
   false.
2. At audit time, `attacks.md` lacked the stated post-correction Capucci/Rittel
   final and convergence `PASS` transcripts. It contained Capucci initial
   `PASS`, Rittel initial `FAIL`, and confrontation agreement only. The exact
   post-correction transcripts are now preserved there as closeout evidence;
   this does not cure the frozen-evidence drift or change the rejection.

Passed checks:

- no premature approval remained in the then-current findings or matrix;
- all 24 ordered evidence arrays matched exactly;
- `GAP-002` was exactly `["PROFILE","LANES","BTE_PLAN"]`, with the correct
  contextual/non-authoritative label and selector;
- normative 13/16/16 remained distinct from diagnostic 21/29;
- matrix geometry remained 53×12 = 636 cells;
- all deferred/not-applicable metadata was present;
- current experimental v1 remained **KEEP**; and
- successor completeness remained **BLOCK**.

Required next route: stabilize the implementation; rebuild the complete frozen
catalog including the new adapter/test; substantively re-evaluate `GAP-009` and
all affected compiler cells; preserve the final/convergence verifier
transcripts; then start a newly confirmed audit. Do not update stale evidence
digests in this rejected review.

## Claim boundary

The normative live denominator is exactly:

- `D_kind = 13` backend kinds;
- `D_form = 16` formation criteria;
- `D_rel_family = 16` owner-selected backend relationship families.

The registry deterministically expands the 16 families into 21 typed endpoint pairs and 29 endpoint-plus-scope variants. Those counts are exact **derived-unselected diagnostics**, not current obligations. An owner must choose family-, pair-, or scoped-level relationship completeness before 21 or 29 can become normative.

The review excludes UI, business satisfiability, application behavior, universal code/spec equivalence, production readiness, and public release. Markdown may explain evidence but cannot satisfy a missing machine-source cell.

## Verifier disposition

| Disposition | Finding IDs | Required revision |
|---|---|---|
| Accepted | `GAP-001`, `GAP-002`, `GAP-005`–`GAP-009`, `GAP-012`, `GAP-014`, `GAP-016`, `GAP-018`–`GAP-020`, `GAP-022`, `GAP-023`, `GAP-025`, `GAP-027` | Retained at cited successor/current scope. |
| Narrowed or demoted | `GAP-004`, `GAP-011`, `GAP-013`, `GAP-017`, `GAP-021`, `GAP-024`, `GAP-026` | Applied below; `GAP-026` is MAJOR. |
| Refuted and dropped | `GAP-003`, `GAP-010`, `GAP-015` | Not surviving findings. Their original claims and refutations remain only in `attacks.md`. |
| KEEP accepted | `KEEP-V1-001`–`KEEP-V1-004` | Historical v1 remains valid narrow evidence. |

Capucci and Rittel both returned convergence `PASS` after agreeing this correction set.

### Exact machine traceability

The following evidence-ID arrays are normative for review traceability and must exactly equal `gap-matrix.json::$.surviving_findings.<id>.evidence_ids`. `BTE_PLAN` in `GAP-002` is contextual, non-authoritative planning evidence; `PROFILE` and `LANES` are its machine-authority evidence.

| Finding | Exact evidence_ids |
|---|---|
| `GAP-001` | `["OLD"]` |
| `GAP-002` | `["PROFILE","LANES","BTE_PLAN"]` |
| `GAP-004` | `["REL","BTE_EDGE"]` |
| `GAP-005` | `["SCHEMA_Calculation","SCHEMA_Operation","SCHEMA_Policy","SCHEMA_Query","SCHEMA_Rule","SCHEMA_Workflow","SCHEMA_Event","SCHEMA_Interface","SCHEMA_Mapping","SCHEMA_State Machine","SCHEMA_Entity","SCHEMA_Enum","SCHEMA_Value Object","PROFILE","GRAPH_SCHEMA","BUILD_SCHEMA"]` |
| `GAP-006` | `["SCHEMA_Calculation","SCHEMA_Operation","SCHEMA_Policy","SCHEMA_Query","SCHEMA_Rule","SCHEMA_Workflow","SCHEMA_Event","SCHEMA_Interface","SCHEMA_Mapping","SCHEMA_State Machine","SCHEMA_Entity","SCHEMA_Enum","SCHEMA_Value Object","KERNEL","INST"]` |
| `GAP-007` | `["SCHEMA_Interface","SCHEMA_Mapping","KERNEL"]` |
| `GAP-008` | `["SCHEMA_Value Object","KERNEL"]` |
| `GAP-009` | `["COMPILER","KERNEL"]` |
| `GAP-011` | `["RULE_BODY","GCP_TASK","GCP_DEC"]` |
| `GAP-012` | `["FEATURE_SCHEMA","EDGE_SCHEMA","COMPILER","BTE_EDGE"]` |
| `GAP-013` | `["REL","BTE_EDGE","COMPILER"]` |
| `GAP-014` | `["REL","EDGE_SCHEMA","GRAPH_SCHEMA","COMPILER"]` |
| `GAP-016` | `["DERIVE","RULES","GRAPH_SCHEMA"]` |
| `GAP-017` | `["BTE_OBL","BTE_PLAN"]` |
| `GAP-018` | `["BIND","BTE_PLAN"]` |
| `GAP-019` | `["EMIT","DERIVE","PACKAGE"]` |
| `GAP-020` | `["T_COMPILER","T_VIEWS","VIEWS","BUILD_SCHEMA","BTE_PLAN"]` |
| `GAP-021` | `["KERNEL","BIND","GCP_TASK","GCP_DEC","BTE_EDGE"]` |
| `GAP-022` | `["CONF_RECEIPT","RESIDUE","BUILD_SCHEMA","BTE_PLAN"]` |
| `GAP-023` | `["PACKAGE"]` |
| `GAP-024` | `["BTE_OBL","BTE_EDGE","BTE_PLAN"]` |
| `GAP-025` | `["IOLM_CONTRACT","IOLM_SCHEMA"]` |
| `GAP-026` | `["INTEGRATED"]` |
| `GAP-027` | `["BODYWAR","BODYWAR_FIX","INTEGRATED"]` |

## KEEP — current experimental v1

| ID | Artifact and literal evidence | Verdict/action |
|---|---|---|
| `KEEP-V1-001` | `definitions/minted-project/supported-profiles.yml` machine-admits exactly Entity/Event/Operation/Rule and enforces/performs/produces, with experimental/non-admitting posture. | KEEP unchanged. |
| `KEEP-V1-002` | `impl/tools/minted-project/compiler.ts` rejects cross-feature edges and enforces selected endpoint kinds. | KEEP v1; add successor behavior under a new profile/version. |
| `KEEP-V1-003` | Resolver/compiler/views tests prove containment, digest joins, deterministic read models, and named negative controls. | KEEP at conformance scope. |
| `KEEP-V1-004` | BTE and integrated-consumer artifacts explicitly mark later core/consumer receipts pending or blocked. | KEEP the honest pending state. |

Current v1 verdict: **KEEP**. Empty conformance models and cross-feature rejection are intentional at this scope; they cannot be reused as successor completeness evidence.

## Snapshot and denominator authority

| ID | Evidence | Severity | Proposed fix |
|---|---|---|---|
| `GAP-001` | The prior 61-path manifest is `pending`, only 56 live digests match, and required denominator sources were omitted. Evidence IDs: `OLD` (`$.entries and live digest comparison`). | CRITICAL | Freeze a new complete manifest after edits stop and fail on missing/drifted paths. |
| `GAP-002` | The only machine profile is historical 4/3; `fpr02-lanes.yml` selects 13 type IDs but does not machine-author the successor relationship/profile contract. Machine-authority evidence IDs: `PROFILE` (`$.profiles[0]`), `LANES` (`$.lanes[?lane_id=FPR-02B]`). Contextual non-authoritative planning evidence: `BTE_PLAN` (`Completeness equation; Delivery boundary`). | CRITICAL | Add a versioned owner-approved successor profile with exact kind, schema-digest, family, and source-root sets. |
| `GAP-004` | The selected 16 families expand to exact diagnostic views of 21 endpoint pairs and 29 scoped variants, but no owner selects variant-level obligations. Evidence IDs: `REL` (`$.signatures`), `BTE_EDGE` (`Positive exercise standard; exact set`). | MAJOR decision/readiness | Record an owner decision: normative 16 families, 21 pairs, or 29 scoped variants. Until then, only 16 families count. |

Artifact verdict: **FIX** for successor readiness.

## Formation schemas and shared evaluation

| ID | Evidence | Severity | Proposed fix |
|---|---|---|---|
| `GAP-005` | The 13 formation schemas lack stable schema/criterion versions; profile/graph/receipt identity does not bind each schema and an aggregate formation digest. Evidence IDs: `SCHEMA_Calculation`, `SCHEMA_Operation`, `SCHEMA_Policy`, `SCHEMA_Query`, `SCHEMA_Rule`, `SCHEMA_Workflow`, `SCHEMA_Event`, `SCHEMA_Interface`, `SCHEMA_Mapping`, `SCHEMA_State Machine`, `SCHEMA_Entity`, `SCHEMA_Enum`, `SCHEMA_Value Object` (selector `required_structure; criterion`), `PROFILE`, `GRAPH_SCHEMA`, `BUILD_SCHEMA`. | CRITICAL | Bind stable criterion IDs and per-schema/aggregate digests through profile, graph, obligations, tests, and receipts. |
| `GAP-006` | Every backend schema declares `required_structure`, but `evaluateCriteria()` receives only criteria and instance validation calls only that function. Evidence IDs: `SCHEMA_Calculation`, `SCHEMA_Operation`, `SCHEMA_Policy`, `SCHEMA_Query`, `SCHEMA_Rule`, `SCHEMA_Workflow`, `SCHEMA_Event`, `SCHEMA_Interface`, `SCHEMA_Mapping`, `SCHEMA_State Machine`, `SCHEMA_Entity`, `SCHEMA_Enum`, `SCHEMA_Value Object` (selector `required_structure; criterion`), `KERNEL` (`META_TYPE_CRITERIA_RULES; evaluateCriteria`), `INST` (`runValidate`). | CRITICAL | Evaluate literal required columns/collections separately and add targeted negatives for all 13 kinds. |
| `GAP-007` | Interface and Mapping definitions name closed discriminator domains, while criteria test mere presence. Evidence IDs: `SCHEMA_Interface`, `SCHEMA_Mapping`, `KERNEL`. | MAJOR | Use closed membership and reject blank, `potato`, and `sideways` controls. |
| `GAP-008` | Value Object equality uses substring containment; text such as “not equal” passes. Evidence IDs: `SCHEMA_Value Object`, `KERNEL`. | MAJOR | Replace lexical containment with a closed structural equality declaration. |
| `GAP-009` | Minted compilation retains only `rule/key/value` and implements a limited evaluator instead of the shared kernel. Evidence IDs: `COMPILER` (`loadAttributeCriteria; validateFormation; CROSS_FEATURE_UNSUPPORTED`), `KERNEL`. | CRITICAL | Normalize minted bodies into the shared kernel and prove all exact 16 criteria. |
| `GAP-011` | `TASK-GCP-ENFORCES.md` says S1 needs an authored predicate and fixture inputs; the current Rule proves only `formal_return_type: boolean`. `DEC-GCP-001` remains pending among evidence-local aspect, Rule-contract extension, and honest blocked receipt. Evidence IDs: `RULE_BODY` (`$.properties.formal_return_type`), `GCP_TASK` (`Current blocker GCP-B-005 / DEC-GCP-001`), `GCP_DEC` (`Options 1, 2, 3 and pending Decision Record`). | BLOCKER for `SWU-GCP-001` only; N/A for BTE formation/unrelated kinds | Select one decision option, then implement it. Do not preselect Rule-schema mutation or `operations.md`. |

Workflow steps, State Machine records, Mapping field records, and Event payload strengthening remain non-counting definitions-owner questions. They are not verified completeness gaps until machine authority selects them.

Artifact verdict: **FIX** for literal required structure, closed criteria, successor parity, and S1 after its decision; v1 Rule formation itself remains valid.

## Successor edge contracts and causal family proof

| ID | Evidence | Severity | Proposed fix |
|---|---|---|---|
| `GAP-012` | v1 embeds edges in source nodes and rejects cross-feature connections; no versioned independent-edge successor route exists. Evidence IDs: `FEATURE_SCHEMA`, `EDGE_SCHEMA`, `COMPILER`, `BTE_EDGE`. | CRITICAL successor readiness | Add successor edge schema and feature/project roots with stable identity, ownership, scope, direction, lifecycle, digest, and provenance. |
| `GAP-013` | The registry owns relationship properties, while successor-selected endpoint/root/scope/direction/lifecycle and promised composition/removal proof are not implemented. Evidence IDs: `REL`, `BTE_EDGE`, `COMPILER`. | CRITICAL, narrowed | Enforce only the successor-selected properties and explicit composition/removal obligations. Multiplicity/inverse require separate selection. |
| `GAP-014` | `orchestrates` is machine-declared ordered, but source/graph edges have no ordinal and compilation sorts by `edge_id`. Evidence IDs: `REL`, `EDGE_SCHEMA`, `GRAPH_SCHEMA`, `COMPILER`. | MAJOR | Add and deterministically preserve a conditional ordinal. |

Artifact verdict: **FIX** for successor; historical v1 remains KEEP.

## Derivation, binding, evaluation, and execution

| ID | Evidence | Severity | Proposed fix |
|---|---|---|---|
| `GAP-016` | Engine entrypoint parses Markdown feature directories; minted graph edges never enter derivation. Evidence IDs: `DERIVE` (`deriveFeature`), `RULES` (`derive`), `GRAPH_SCHEMA`. | CRITICAL | Add one digest-bound minted graph/source-manifest adapter and canonical obligation IDs. |
| `GAP-017` | No independently owned exact 16-item machine `O_formation` catalogue exists. Evidence IDs: `BTE_OBL` (`Objective; SWU-BTE-005`), `BTE_PLAN`. | CRITICAL, narrowed | Author/freeze exactly the selected 16 formation obligations. Other families require separate owner selection. |
| `GAP-018` | Bindings lack exact role-typed graph/obligation/test/fixture digests and use first-match selection. Evidence IDs: `BIND` (`bindingFor`), `BTE_PLAN`. | CRITICAL | Require exactly one digest-bound binding per selected obligation. |
| `GAP-019` | Emission can produce todo/skip and zero-obligation paths can exit successfully without release execution reconciliation. Evidence IDs: `EMIT` (`emitTests; emitHybridTests`), `DERIVE`, `PACKAGE`. | CRITICAL successor scope | Add a separate completeness route that fails on zero/todo/skip/orphan/unrunnable/unexecuted IDs. |
| `GAP-020` | Empty v1 conformance projects legitimately pass; no successor completeness mode binds nonempty exact expected ID sets. Evidence IDs: `T_COMPILER`, `T_VIEWS`, `VIEWS`, `BUILD_SCHEMA`, `BTE_PLAN`. | CRITICAL successor scope | Preserve v1 behavior and make the successor completeness route reject empty/mismatched denominators. |
| `GAP-021` | Evaluator bindings are absent for the selected proof families. Evidence IDs: `KERNEL`, `BIND`, `GCP_TASK`, `GCP_DEC`, `BTE_EDGE`. | CRITICAL, narrowed | Require evaluators only for the 16 formation criteria, the S1 predicate after `DEC-GCP-001`, and explicitly selected relationship composition/removal obligations. No universal `code_pattern` runtime effects. |

Artifact verdict: **FIX**.

## Receipts, mutations, and aggregates

| ID | Evidence | Severity | Proposed fix |
|---|---|---|---|
| `GAP-022` | Current receipts do not join the whole successor source→graph→obligation→binding→evaluator→test→execution→mutation chain. Evidence IDs: `CONF_RECEIPT`, `RESIDUE`, `BUILD_SCHEMA`, `BTE_PLAN`. | CRITICAL | Emit a versioned recomputable receipt with exact IDs, raw digests, commands, tool versions, and results. |
| `GAP-023` | `impl/package.json` has no `verify:bte:core`, `verify:bte:consumers`, or terminal `verify:bte`. Evidence ID: `PACKAGE` (`$.scripts`). | CRITICAL | Add fail-closed core, consumer, and composed terminal commands. |
| `GAP-024` | Exact selected negative/mutation ID sets are not machine-authored or reconciled. Evidence IDs: `BTE_OBL`, `BTE_EDGE`, `BTE_PLAN`. | MAJOR, narrowed | Freeze exact 16 formation mutants and owner-selected family-level relationship negatives. Add 21/29 variants only if promoted. |

Artifact verdict: **FIX**.

## IOLM and Body War consumers

| ID | Evidence | Severity | Proposed fix |
|---|---|---|---|
| `GAP-025` | IOLM has a candidate contract/schema, but generic handles and literal pass/rejected fields lack executable command/result evidence and no runner receipt exists. Evidence IDs: `IOLM_CONTRACT`, `IOLM_SCHEMA`. | CRITICAL terminal target, IOLM-owned | Type exact handle roles/sets, independently recompute digests, bind commands/results/tools, and preserve non-admission. |
| `GAP-026` | Candidate integrated manifest says 13/16 admitted/exercised while every core/consumer receipt is pending. It remains non-production and cannot promote authority. Evidence ID: `INTEGRATED` (`$.profile and $.receipts`). | MAJOR consistency | Replace admitted/exercised with expected/pending until machine profile and receipts exist. |
| `GAP-027` | Body War has Markdown intent and a fixture pointing to Markdown, but no machine contract, receipt schema, runner, validator, or replay route. Evidence IDs: `BODYWAR`, `BODYWAR_FIX`, `INTEGRATED`. | MAJOR terminal readiness | Build the consumer-owned machine path and return a fresh non-authoritative receipt. |

Current pending consumer state is honest; consumer evidence can never substitute for core proof or grant release admission.

## Ordered change requests for the later Invoke pass

### Definitions

1. Stable schema/criterion/profile/family identities and digests.
2. Exact `O_formation` terminology; do not redefine it as a total union.
3. Owner decision for family vs pair vs scoped relationship coverage.
4. Separate definitions-owner review of Workflow/State Machine/Mapping/Event richer structures.

### Requirements

5. Exact normative set equality for 13 kinds, 16 criteria, and selected 16 families.
6. Nonempty successor evidence, no todo/skip/orphan/unrunnable residue, fresh raw digests, replay, and exact selected negatives.
7. Explicit non-admission and business-semantic exclusions.

### Architecture and design

8. Preserve v1 and add a versioned successor profile/source layout.
9. Separate authority, compiler/read model, independent catalogue, derivation, binding/evaluator, execution, receipt, aggregate, and consumers.
10. Keep backend and UI lanes independent.

### Profiles, schemas, and compiler

11. Machine-author the 13-kind/16-family successor with formation digests and independent edge roots.
12. Enforce required structure and all 16 criteria through one shared kernel.
13. Preserve selected scope/order/lifecycle/composition/removal semantics; multiplicity/inverse only after selection.
14. Resolve `DEC-GCP-001` without preselecting an option.

### Derivation, execution, and receipts

15. Build exact 16-item `O_formation`, minted graph derivation, unique bindings, selected evaluators, executable tests, mutations, and replay receipts.
16. Add fail-closed core/consumer/terminal aggregates.

### Consumers and work-pack

17. Harden IOLM execution evidence and create the Body War machine consumer path.
18. Author a replacement complete work-pack from fresh authority reads and these verified change requests; split SWUs by selected proof family.

## Revised candidate verdict

- Current experimental v1: **KEEP**.
- Successor 13-kind/16-formation/16-family structural-causal completeness: **BLOCK**.
- `SWU-GCP-001`: **BLOCK** pending `DEC-GCP-001`; no predicate-source option selected here.
- Terminal IOLM/Body War composition: **BLOCK**, while current pending status remains honest.
