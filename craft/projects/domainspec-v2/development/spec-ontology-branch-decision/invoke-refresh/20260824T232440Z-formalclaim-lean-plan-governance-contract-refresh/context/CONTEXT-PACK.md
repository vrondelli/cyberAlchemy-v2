# Runtime Context Pack — FormalClaim Lean/EVF Plan Governance Refresh

This is run-local proposal evidence. It is not a canonical Plan artifact and grants no mutation, selection, acceptance, implementation, merge, publication, release, or deployment authority.

## Identity

- Task: proposal-only reconciliation of the SWU-FCL-002 readiness gate
- Accepted Plan: `DS-FORMALCLAIM-LEAN-EVF-PLAN@20260824T165704Z`
- Accepted package digest: `e5e4b0727440b5e4d29f3be94a37388a0a4b9f85d9a627cc0d853b4aac24cd4e`
- Mutation mode: `proposal-only`
- Write scope: this Refresh run root only
- Forbidden writes: accepted Plan, SWU evidence, product files, authority, Inventory, Arcanum, Git, telemetry, Craft, and external systems

## Obligations

| ID | Obligation | Status | Evidence |
| --- | --- | --- | --- |
| O1 | Preserve the exact block signal and make no target mutation | covered | block receipt and current readiness report |
| O2 | Represent 14 mutation-capable closeouts with the current typed contract | covered | v2 schema and runner typed-closeout gate |
| O3 | Preserve historical truth: only SWU-FCL-001 completed and joined | covered | SWU-FCL-001 terminal receipt and owner closeout receipt |
| O4 | Preserve the 14-unit Plan semantics, routes, scopes, validators, owners, and C12 boundary | covered | accepted audit config plus canonical semantic comparison |
| O5 | Validate staged bytes with current WPRA without executing configured commands | covered | rebased staged config and current WPRA report |
| O6 | Fail closed on the current joined-closeout selector contradiction | covered | current runner selector guard versus current terminal schema |
| O7 | Keep acceptance and application separate | covered | exact Rondelli acceptance receipt and Refresh proposal-only contract |

## Selected Evidence

1. `.../SWU-FCL-002/.../CONTINUITY-GATE-BLOCK.json` — whole receipt identity only; SHA-256 `fd854f9a72998ae01b5043d119d216f1ab1cec0b93429f43deed041f7bbc76a1` — O1, O2, O6.
2. `.../SWU-FCL-002/.../readiness-audit-output/work-pack-readiness-report-v2.json` — selectors `/terminal_code`, `/blockers`, `/configured_commands_executed`, `/selected_unit`, `/mutation_ready`, `/authority_effect` — O1, O2.
3. `.../SWU-FCL-001/RECEIPT.json` — selectors `/result`, `/task_id`, `/swu_id`, `/closeout_join` — SHA-256 `552682c24a302bab048225379455cb9e1b0ca14d6b7ce6011c8131f69f7e7bdf` — O3.
4. Accepted `work-pack/shared/TASK-SESSION-CLOSEOUT-CONTRACTS.json` — selectors `/common`, `/units` — O2.
5. Accepted `readiness/AUDIT-BINDINGS.json` — selectors `/objective`, `/closeout_contract`, `/continuity`, `/risk_policy`, `/status` — O3, O4.
6. Accepted `readiness/generate_audit_config.py` — selectors `main`, `execution`, `closeouts`, `continuity_projection` — O2, O3, O4.
7. Accepted `readiness/audit-config.json` — selectors `/execution_bindings`, `/closeout_bindings`, `/continuity_projection`, `/execution_policy` — O2, O3, O4.
8. Current `audit-config-v2.schema.json` — selectors `/properties/task_session_closeout_contracts`, `/$defs/taskSessionCloseoutContract` — O2.
9. Current `audit_work_pack.py` — lines 1281-1351 typed closeout gate; lines 1485-1585 completion continuity — O2, O6.
10. Current `governance-terminal-receipt.schema.json` — selectors `/additionalProperties`, `/required`, `/properties/closeout_join` — O3, O6.
11. Current `precloseout-refresh-closeout-receipt.schema.json` — selectors `/properties/schema_version`, `/properties/result` — O2, O3.
12. Inventory entry `invoke-one-shot-workflow-research-findings-synthesis` — selectors `#accepted-architecture`, `#evidence-and-authority` — O4, O5.
13. Accepted `RONDELLI-PLAN-ACCEPTANCE.json` — exact accepted candidate and digest only — O7.
14. Invoke Refresh contract — selectors `Mutation Modes`, `Mode Gates`, `Phase Status`, `Evidence Capability Contract` — O1, O7.

## Resolution

- The 14 legacy flat closeout gaps have one exact governance-only staged repair.
- The SWU-FCL-001 terminal receipt truth is unambiguous and schema-valid. Its exact joined Invoke receipt is a historical `invoke-refresh-closeout-receipt.v1`, not the current precloseout owner-receipt schema, and is preserved as explicit compatibility residue.
- The current WPRA continuity validator cannot consume that truth: it requires a field forbidden and absent from the current terminal schema, rejects the current `closeout_join` selector even when it resolves, and has no declared compatibility rule for the exact historical joined owner receipt.
- Therefore the staged target cannot be applied or reaccepted yet. The next owner is the Work Pack Readiness Audit lifecycle, followed by a fresh proposal-only Invoke Refresh and exact post-apply readiness audit.

## Fallback Rule

If any staged change alters the canonical semantic digest, a unit contract digest, a route, scope, validator, owner, authority ceiling, or the Victor pre-merge boundary, stop and route a semantic decision instead of treating it as governance repair.
