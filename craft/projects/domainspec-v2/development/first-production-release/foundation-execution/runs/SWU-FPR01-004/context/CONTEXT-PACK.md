# Runtime Handoff Pack

## Identity

- Task/SWU: `SWU-FPR01-004`
- Source task/work-pack: `projects/domainspec-v2/development/first-production-release/foundation-execution/work-pack/tasks/TASK-FPR-01-AUTHORITY-BASELINE.md#SWU-FPR01-004-Ratification-Receipt`
- Session/run id: `SWU-FPR01-004`
- Session evidence path: `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-004/`
- Runtime handoff: `runtime`
- Repository revision: `fdd8279dab37726a3187a19b68a1fdef6f09104f`
- Evidence date: `2026-07-17`

## Obligation Coverage

| Obligation | Status | Selected Evidence | Resolution |
| --- | --- | --- | --- |
| `R1` exact single-unit selection and dependency | `covered` | `WORK-PACK.md:55,65-76,120-126`; task lines 56-64; wave lines 13-31 | `SWU-FPR01-004` is selected after completed `SWU-FPR01-003`. |
| `R2` bind baseline, schema, and validator | `covered` | task lines 58-62; baseline; schema; validator | Receipt must bind each live path and SHA-256. |
| `R3` bind census, dispositions, owner decision, and predecessor | `covered` | baseline `inputs`; census; dispositions; decision; predecessor receipt | Receipt must preserve the complete accepted evidence chain. |
| `R4` bind current guard receipt | `covered` | guard Task Session result lines 68-83,110-118 | Receipt must bind the accepted guard proof without changing it. |
| `R5` bind negative controls and unchanged-input replay | `covered` | FPR01-003 result `Validation`; `replay-result.json` | Canonical repeat, five mutants, aggregate suite, and guard audit are evidence inputs. |
| `R6` name required owner roles | `covered` | task lines 60-63; accepted owner decision | Definitions, validation, layering, and independent-verifier roles must be explicit. |
| `R7` preserve authority boundaries | `covered` | work-pack lines 120-126; refresh lines 73-87; baseline `authority_boundary` | FPR-01 completion, FPR-02 entry, and production remain unsynchronized and unauthorized. |
| `R8` stay inside exact write scope | `covered` | task line 59; work-pack lines 120-126 | Write only the ratification JSON and Task Session evidence under this run. |
| `R9` independently verify every bound path and digest | `covered` | task lines 60-63; baseline `inputs` | Recompute SHA-256 from disk and compare with the receipt. |
| `R10` deliberate baseline mutation invalidates receipt | `covered` | task line 62; schema and validator contracts | Mutate a temporary copy only; prove digest rejection and validator rejection. |
| `R11` preserve context and receipt integrity | `covered` | Context Builder runtime contract; current source digests | Emit parseable machine evidence and verify its references. |
| `R12` hand PASS back to Invoke refresh only | `covered` | work-pack line 126; refresh lines 84-87; task lines 64,66-80 | Task Session cannot synchronize completion or select FPR-02. |

Strict coverage: `pass`

## Selected Sources

- `projects/domainspec-v2/development/first-production-release/foundation-execution/WORK-PACK.md`
  - Selectors: task table lines 53-76; blocker table lines 91-99; gate checks lines 118-126
  - Obligations: `R1 R7 R8 R12`
  - Evidence excerpt: Only `SWU-FPR01-004` is selected; later work remains blocked; ratification evidence cannot synchronize completion.
- `projects/domainspec-v2/development/first-production-release/foundation-execution/work-pack/tasks/TASK-FPR-01-AUTHORITY-BASELINE.md`
  - Selectors: `SWU-FPR01-003` lines 42-54; `SWU-FPR01-004` lines 56-64; synchronization/current route lines 66-80
  - Obligations: `R1 R2 R4 R5 R6 R8 R9 R10 R12`
  - Evidence excerpt: Defines the exact receipt bindings, owners, write scope, independent verification, and mutation check.
- `projects/domainspec-v2/development/first-production-release/foundation-execution/work-pack/waves/W1-AUTHORITY-BASELINE.md`
  - Selectors: order lines 13-20; current replay receipt lines 25-31; promotion gate lines 33-35
  - Obligations: `R1 R5 R6`
  - Evidence excerpt: The predecessor is complete and deterministic; ratification remains selected and unexecuted.
- `projects/domainspec-v2/development/first-production-release/foundation-execution/refreshes/2026-07-17-fpr01-003-pass-sync/REFRESH-REPORT.md`
  - Selectors: result lines 10-19; validation lines 57-71; authority/next route lines 73-87
  - Obligations: `R1 R5 R7 R12`
  - Evidence excerpt: The applied refresh selected but did not execute ratification and preserved all later authority boundaries.
- `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-003/TASK-SESSION-RESULT.md`
  - Selectors: result, validation, authority boundary, next handoff
  - Obligations: `R1 R5 R7`
  - Evidence excerpt: Human PASS receipt for deterministic baseline replay and negative controls.
- `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-003/replay-result.json`
  - Selectors: `status`, `result`, `inputs`, `canonical_validation`, `mutant_validation`, `aggregate_validation`, `guard_validation`, `authority_boundary`
  - Obligations: `R2 R4 R5 R7 R9`
  - Evidence excerpt: Machine PASS evidence binds canonical, mutant, aggregate, and guard results while authority flags remain false.
- `projects/domainspec-v2/development/first-production-release/authority-baseline.yml`
  - Selectors: `schema_version`, `status`, `inputs`, owner-bearing disagreements, `authority_boundary`
  - Obligations: `R2 R3 R6 R7 R9 R10`
  - Evidence excerpt: Validation-candidate baseline binds predecessor/census/dispositions/decision and names every disagreement owner.
- `projects/domainspec-v2/development/first-production-release/schemas/authority-baseline.schema.json`
  - Selectors: root closed shape, required properties, status/boundary constraints
  - Obligations: `R2 R10`
  - Evidence excerpt: Machine contract for the baseline and its fail-closed boundary fields.
- `projects/domainspec-v2/development/first-production-release/tools/validate-authority-baseline.cjs`
  - Selectors: CLI entry, path/digest checks, derived-count checks, direction/status checks, normalized report
  - Obligations: `R2 R5 R9 R10`
  - Evidence excerpt: Deterministic validator derives live facts and returns typed failures.
- `projects/domainspec-v2/development/first-production-release/evidence/authority-census.json`
  - Selectors: provenance, sources, disagreements, content digests
  - Obligations: `R3 R9`
  - Evidence excerpt: Deterministic source census used by the accepted baseline.
- `projects/domainspec-v2/development/first-production-release/evidence/authority-source-dispositions.json`
  - Selectors: decision reference, disagreement dispositions, owners, unresolved summary
  - Obligations: `R3 R6 R9`
  - Evidence excerpt: Every census disagreement has one accepted owner disposition.
- `projects/domainspec-v2/development/first-production-release/evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md`
  - Selectors: frontmatter; scope lines 11-17; selected dispositions; downstream boundaries
  - Obligations: `R3 R6 R7`
  - Evidence excerpt: All five owner queues are resolved; it grants neither completion nor production authority.
- `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01003-GUARD-001/TASK-SESSION-RESULT.md`
  - Selectors: validation lines 68-83; authority boundary lines 110-118
  - Obligations: `R4 R5 R7 R9`
  - Evidence excerpt: Current guard audit and focused negative controls pass with zero violations.
- `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-002/TASK-SESSION-RESULT.md`
  - Selectors: result, bound inputs, validation, next handoff
  - Obligations: `R3 R6 R9`
  - Evidence excerpt: Verified predecessor receipt binds the accepted disposition packet.

## Architecture Guidance

Ratification is an evidence-layer receipt, not a mutation of the authority baseline. Keep source authority, execution evidence, and lifecycle synchronization separate: this Task Session may prove the exact baseline package; a later approved Invoke refresh owns continuation-state changes.

## Related Feature Context

`SWU-FPR01-003` already produced the baseline package and deterministic PASS replay. This unit does not repair or redesign that package; it binds the unchanged artifacts and independently checks their integrity.

## Constraints And Non-Goals

- Do not mutate the baseline, schema, validator, census, dispositions, decision record, guard proof, or prior receipts.
- Do not select, execute, or authorize FPR-02.
- Do not synchronize FPR-01 completion or Craft state.
- Do not claim production readiness or authorization.
- Do not add a new policy decision: the accepted owner dispositions are inputs.
- Use a temporary copy outside the project for the deliberate mutation test and remove it afterward.

## Write Scope

- `projects/domainspec-v2/development/first-production-release/evidence/authority-baseline-ratification.json`
- `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-004/` Task Session evidence only

## Validation Surface

- Parse and closed-shape check the ratification JSON.
- Recompute and compare every bound path SHA-256.
- Run the canonical authority validator twice and require byte-identical complete output.
- Run the five named negative fixtures and require all five to fail with their expected typed result.
- Re-run the current guard audit.
- Mutate a temporary baseline copy; require both receipt-digest rejection and validator rejection.
- Verify the context index parses and that strict coverage is 12/12.
- Confirm scoped diff hygiene and unchanged source digests.

## Gaps And Blockers

- None. Decision count is zero: accepted owner evidence and the selected task determine one implementation path.

## Authority Precedence

1. `TASK-FPR-01-AUTHORITY-BASELINE.md` and `WORK-PACK.md` execution/write/authority boundaries
2. Accepted owner decision and machine dispositions
3. Current baseline/schema/validator contract
4. Current replay and guard receipts
5. This session evidence

## Fallback Exploration Rule

Broad repository exploration is allowed only for obligations listed in `Gaps And Blockers` or for a gap explicitly named before exploring. Extra sources must be reported in the runtime result.

## Provenance

- Source refs and SHA-256:
  - `WORK-PACK.md`: `10b0da8736e663d5517c1491cf42c7f63f79d3b42a1f17e696918b4fc7fe60f6`
  - `TASK-FPR-01-AUTHORITY-BASELINE.md`: `ddc42d625b3eaf3dbd37fef431a43097688cad85dcae641607e79becd3942d1b`
  - `W1-AUTHORITY-BASELINE.md`: `1de7a9625aeeafdccbfda4ea4f730539ed4503038c3ee470e42449c3a68ff40f`
  - applied `REFRESH-REPORT.md`: `65c0c4c8e2f8daa6c40f40a744feb13e3127fee97d950be0c5db7dd418b045f7`
  - `SWU-FPR01-003/TASK-SESSION-RESULT.md`: `ad4064f890fb3445de642b8a2096a0de6961f89b011cf45e3d43caeed17d68a3`
  - `SWU-FPR01-003/replay-result.json`: `d83bda420e426a0fda4b9381852e72f9154529a8253dfc387d4019e3e1f5fa8f`
  - `authority-baseline.yml`: `7accea7412228999575e9c6a566c01c4cfa3424ece03451fd8a8721dcdacc63a`
  - `authority-baseline.schema.json`: `159e48f83251b1e2a868a2088c8cdf22eb1c8648173c27125f1163de3adf997b`
  - `validate-authority-baseline.cjs`: `daa8971074bb87dc8c471f316e6234baa995271e6d0b445dc946e655d21a0db6`
  - `authority-census.json`: `35ee6bbd258fa8b0fd16575228d96bf246bf2dbd4ac30a8324ce3bf8d6e6e78f`
  - `authority-source-dispositions.json`: `4b42980eb706d7c43cd81d9eec2b3c37596584a41a115e127b336d3847c75b5a`
  - `FPR01-OWNER-DISPOSITIONS-DECISION.md`: `b1d6b0682aacfdf698ea308cce9434e25498bf874845bb72ce4296f587653459`
  - guard `TASK-SESSION-RESULT.md`: `590a59052aefaed1ace5f9fc0e5bf34786977224aeacdd8f0e0506f5a20ba58f`
  - `SWU-FPR01-002/TASK-SESSION-RESULT.md`: `2d3b994e9c9251953e28eb39653271ad97f3e8d2ab188ea411a82a80bc188537`
- Builder mode: `standard`, strict, runtime handoff, both outputs, max 14 files.
- Selection: 14 files, 12 obligations, 12 covered, 0 blocked, 0 deferred.

## Output Paths

- Markdown: `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-004/context/CONTEXT-PACK.md`
- JSON/index: `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-004/context/context-pack.json`
