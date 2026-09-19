# Runtime Handoff Pack

## Identity

- Task/SWU: `invoke-refresh-fpr01-004-ratification-sync`
- Source task/work-pack: `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-004/TASK-SESSION-RESULT.md`
- Session/run id: `2026-07-17-fpr01-004-ratification-sync`
- Session evidence path: `projects/domainspec-v2/development/first-production-release/foundation-execution/refreshes/2026-07-17-fpr01-004-ratification-sync/`
- Runtime handoff: `runtime`
- Repository revision: `fdd8279dab37726a3187a19b68a1fdef6f09104f`
- Evidence date: `2026-07-17`

## Obligation Coverage

| Obligation | Status | Selected Evidence | Resolution |
| --- | --- | --- | --- |
| `R1` consume only verified ratification evidence | `covered` | Task Session human/machine results; ratification JSON | PASS, 19/19 bindings, exact receipt digest. |
| `R2` close FPR-01 task, W1, FPR01-004, and PLAN-B2 | `covered` | Work-Pack; task; W1; Task Session result | All named exit evidence exists. |
| `R3` expose FPR-02 as available but do not select it | `covered` | Work-Pack; Execution Pack; ratification boundary | Dependency is satisfied; decision work remains unexecuted. |
| `R4` synchronize execution and layering records | `covered` | Execution Pack; Layering | Remove stale active-unit claims and point to the next decision boundary. |
| `R5` synchronize Craft authority and indexes | `covered` | scoped ledger; Task Session result | Update context gate/next move, artifact rows, indexes, links, and recomposition. |
| `R6` synchronize the Craft human view | `covered` | `CRAFT.md`; scoped ledger | Replace stale blocked FPR01-003/FPR01-004 text from ledger evidence. |
| `R7` synchronize canonical roadmap state | `covered` | `ROADMAP.md`; expected manifest | FPR-01 becomes closed-ratified; FPR-02 becomes ready-decision-gate. |
| `R8` preserve roadmap presentation contract | `covered` | roadmap copy; builder | Add labels for both new state tokens before regeneration. |
| `R9` regenerate deterministic roadmap projections | `covered` | builder; manifest; Craft ledger | Builder owns `roadmap-data.json` and `roadmap.html`. |
| `R10` preserve authority and release boundaries | `covered` | ratification JSON; Task Session machine result | No authority-source mutation, successor selection, or production authorization. |
| `R11` emit applied refresh evidence | `covered` | Invoke refresh contract; current state sources | Write human and machine reports mapped to typed signals. |
| `R12` validate all synchronized records | `covered` | builder/tests; Task Session validation surface | Parse, pointer, stale-text, generation, unit, full-suite, guard, and diff checks. |
| `R13` record route discipline and next owner | `covered` | Work-Pack technique trace; Invoke contract | Local bounded refresh; no full dispatch or Distill run needed. |

Strict coverage: `pass`

## Selected Sources

- `foundation-execution/runs/SWU-FPR01-004/TASK-SESSION-RESULT.md`
  - Selectors: result, selection/context, validation, authority boundary, next handoff
  - Obligations: `R1 R2 R3 R5 R10 R12`
  - Evidence excerpt: FPR01-004 passed and routes to a separate synchronization refresh.
- `foundation-execution/runs/SWU-FPR01-004/task-session-result.json`
  - Selectors: `result`, `deliverable`, `validation`, `authority_boundary`, `next_owner`
  - Obligations: `R1 R2 R3 R10 R12`
  - Evidence excerpt: Machine PASS receipt preserves all later authorization flags as false.
- `evidence/authority-baseline-ratification.json`
  - Selectors: `ratification_status`, `bindings`, `validation`, `authority_boundary`
  - Obligations: `R1 R2 R3 R10`
  - Evidence excerpt: Ratifies the exact baseline digest with 19 verified bindings.
- `foundation-execution/WORK-PACK.md`
  - Selectors: controls, task board, SWU table, blockers, gates
  - Obligations: `R2 R3 R11 R13`
  - Evidence excerpt: Still projects FPR01-004 as selected and PLAN-B2 as partially resolved.
- `foundation-execution/EXECUTION-PACK.md`
  - Selectors: planning controls, wave schedule, current execution state
  - Obligations: `R3 R4`
  - Evidence excerpt: Still projects W1 ratification as active.
- `foundation-execution/IMPLEMENTATION-LAYERING.md`
  - Selectors: nested L1 boundary, recommended next layer
  - Obligations: `R4`
  - Evidence excerpt: Still names FPR01-004 as the next L1 unit.
- `work-pack/tasks/TASK-FPR-01-AUTHORITY-BASELINE.md`
  - Selectors: frontmatter; FPR01-004; synchronization; current route
  - Obligations: `R2`
  - Evidence excerpt: Contract says close only from FPR01-004 then synchronize separately.
- `work-pack/waves/W1-AUTHORITY-BASELINE.md`
  - Selectors: frontmatter; order; current replay; promotion gate
  - Obligations: `R2`
  - Evidence excerpt: Ratification was the final unexecuted W1 item.
- `projects/domainspec-v2/.craft/ledger.yml`
  - Selectors: indexes; FPR context; artifacts; FPR recomposition
  - Obligations: `R5 R6 R9 R13`
  - Evidence excerpt: Craft is continuation authority and still points to FPR01-004.
- `projects/domainspec-v2/CRAFT.md`
  - Selectors: quick links; contexts; pending by node; artifacts
  - Obligations: `R6`
  - Evidence excerpt: Human view is stale and still reports closed FPR01-003 blockers.
- `development/first-production-release/ROADMAP.md`
  - Selectors: ordered route; first execution frontier
  - Obligations: `R7`
  - Evidence excerpt: Canonical operational roadmap still marks FPR-01 blocked/open.
- `craft/expected-node-edge-manifest.yml`
  - Selectors: FPR-01 and FPR-02 nodes
  - Obligations: `R7 R9`
  - Evidence excerpt: Machine graph still reports blocked-open then blocked.
- `visibility/roadmap-copy.json`
  - Selectors: status-label fields
  - Obligations: `R8 R9`
  - Evidence excerpt: Every manifest state requires an authored presentation label.
- `visibility/tools/build-roadmap.py`
  - Selectors: `_visual_group`, copy-field validation, generation/check CLI
  - Obligations: `R8 R9 R12`
  - Evidence excerpt: Closed-prefixed states render closed; all other new states need explicit copy.

## Architecture Guidance

Craft remains continuation authority. The expected manifest and `ROADMAP.md` are synchronized operational projections; `roadmap-data.json` and `roadmap.html` remain disposable builder outputs. The baseline stays a `validation-candidate` artifact while the separate receipt ratifies its exact digest.

## Related Feature Context

The repository inventory lookup returned older FPR syntheses but no current FPR01-004 record. Inventory is a partial non-authority read model, so direct receipt and workflow sources govern this refresh; no Inventory mutation is required for lifecycle closure.

## Constraints And Non-Goals

- Do not mutate the baseline, ratification receipt, Task Session evidence, schemas, validator, or fixtures.
- Do not select or execute `SWU-FPR02-001`.
- Do not resolve FPR-02 product/profile decisions.
- Do not close the full foundation work-pack or first-production-release Craft context.
- Do not alter production authorization.
- Do not mutate unrelated Craft contexts, blockers, gaps, or decisions.

## Write Scope

- `foundation-execution/WORK-PACK.md`
- `foundation-execution/EXECUTION-PACK.md`
- `foundation-execution/IMPLEMENTATION-LAYERING.md`
- `work-pack/tasks/TASK-FPR-01-AUTHORITY-BASELINE.md`
- `work-pack/waves/W1-AUTHORITY-BASELINE.md`
- `projects/domainspec-v2/.craft/ledger.yml`
- `projects/domainspec-v2/CRAFT.md`
- `development/first-production-release/ROADMAP.md`
- `craft/expected-node-edge-manifest.yml`
- `visibility/roadmap-copy.json`
- `visibility/tests/test_build_roadmap.py` (focused copy-coverage count only)
- `visibility/tests/fixtures/roadmap-copy/valid.presentation-copy.json` (focused valid status target only)
- builder-owned `visibility/roadmap-data.json` and `visibility/roadmap.html`
- this refresh directory's context and human/machine reports

## Validation Surface

- Verify all source preimage digests before mutation.
- Parse Craft YAML through the roadmap builder and verify exact new by-id/path/artifact pointers.
- Parse `roadmap-copy.json` and the machine refresh report.
- Generate roadmap projections and pass builder `--check`.
- Run all visibility unit tests.
- Run canonical baseline validator twice, five-mutant suite, full implementation validation, and current guard audit.
- Prove FPR-01 closed across Work-Pack/task/wave/Craft/roadmap/manifest.
- Prove no SWU is selected and FPR-02 is available but unexecuted.
- Audit stale FPR01-004 selection text and scoped diff hygiene.

## Gaps And Blockers

- None for synchronization. FPR-02 decisions remain future work, not a blocker to FPR-01 closure.

## Authority Precedence

1. Verified FPR01-004 ratification and Task Session receipts
2. Scoped Craft ledger continuation authority
3. Invoke-authored Work-Pack/task/wave/execution/layering records
4. Canonical operational roadmap and expected machine manifest
5. Generated visibility projections and human Craft view
6. Inventory lookup as non-authority orientation only

## Fallback Exploration Rule

Broad repository exploration is allowed only for obligations listed in `Gaps And Blockers` or for a gap explicitly named before exploring. Extra sources must be reported in the runtime result.

## Provenance

- Builder mode: `standard`, strict, runtime handoff, both outputs, max 14 files.
- Selection: 14 sources, 13 obligations, 13 covered, 0 blocked, 0 deferred.
- Source SHA-256 values are recorded in the machine context index.
- Mutation mode: `apply-approved` from the user's explicit synchronization and closure request.
- Dispatch techniques: `execution_receipt_handoff`, `state_namespace_boundary`, `owner_boundary_check`, `artifact_contract_bridge`, `validation_loop`, `concrete_path_evidence`, `residue_ledger`, `authority_split_gate`, `observability_grouping`.
- Full dispatch: skipped; one local capability, no delegation, no reusable cross-capability route.
- Distill: skipped; this is a finite status/projection synchronization with an exact receipt and target inventory.

## Output Paths

- Markdown: `projects/domainspec-v2/development/first-production-release/foundation-execution/refreshes/2026-07-17-fpr01-004-ratification-sync/context/CONTEXT-PACK.md`
- JSON/index: `projects/domainspec-v2/development/first-production-release/foundation-execution/refreshes/2026-07-17-fpr01-004-ratification-sync/context/context-pack.json`
