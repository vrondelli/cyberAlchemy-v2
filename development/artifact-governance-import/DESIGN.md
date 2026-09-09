---
node_type: design
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped
created: 2026-07-01
authored_by: invoke (mode=design)
target_artifact: cav2 artifact-governance import pack (Tier-1)
note: Paths repo-root-relative from domainspec-core/.
---

# cav2 Artifact-Governance Import Pack (Tier-1) — DESIGN

## Where each piece lands
| Imported piece | cav2 landing | Kind |
|---|---|---|
| validator (`validate-artifact-constitution.sh` + `validate-artifact-metadata.py` + `check_markdown_links.sh`) | `cyberAlchemy-v2/tools/` (new) | Runtime contract / script (AUTHORITY-MODEL "Runtime contract" kind) |
| SCHEMA-CONSTITUTION (.schema.yml format) | `cyberAlchemy-v2/authority/constitutions/SCHEMA-FORMAT-CONSTITUTION.md` | Constitution |
| ARTIFACT retention-class taxonomy + GITIGNORE | `cyberAlchemy-v2/authority/constitutions/ARTIFACT-RETENTION-CONSTITUTION.md` | Constitution |
| staging record | `authority/imports/constitutions/` (already re-scanned 2026-07-01) | Import evidence |

## The strip (port, don't copy)
Every Arcanum-root predicate → cav2 roots:
- `is_local_runtime_path` / `is_generated_path`: `.arcanum/*`,`tmp/*`,`benchmark/*` → `cyberAlchemy-v2/**/development/runs/**`, `.craft/**`, repo runtime paths.
- required-file pins: `framework/ARTIFACT-CONSTITUTION.md` → the cav2 constitution paths above.
- source-selector list: `arcana/**`,`spells/**`,`.codex/**`,`tools/**` → `cyberAlchemy-v2/**` (authority/definitions/constitutions/specs/…).
- **Drop** the metadata `--advisory` call for now (Tier-2); the Tier-1 validator runs the path-heuristic + schema + link checks only.

## "Enforce always" = the hook (the load-bearing design point)
"Always on author/change" comes from **wiring**, not the constitution prose: a PreToolUse/pre-commit hook
runs the ported validator after any write under `cyberAlchemy-v2/**`. Without the hook it is a manual
command; with it, every artifact author/change is gated. The hook is the deliverable that makes "enforce
always" true (for file-FORM).

## Honest scope reconciliation
The validator gates FORM (retention visibility, `.schema.yml`, link resolution). cav2's substantive
authority rules stay review-mode; OQ-1's kind-scan is untouched. This is recorded as the pack's ceiling, not
hidden — "cav2's first deterministic file-form gate", not "validator-enforced authority".

## Owner-gate
Two constitutions → `constitution-governance` promotes each (scope/owner/examples/non-examples/validation-mode).
The validator (a script/runtime-contract) → `task-session` after the constitution owner-gates. Contested
duplication was already resolved (SKIP the owned promotion-rule/hygiene); no re-litigation.

## Dispatch technique trace
`artifact_contract_bridge` (each imported piece → a cav2 landing+kind) · `owner_boundary_check` (invoke
authors; constitution-governance + task-session own the build) · `concrete_path_evidence` (strip targets
cited) · `residue_ledger` (validator port is code; hook wiring is the "always" gap) · `authority_split_gate`
(import-before-promotion staging vs promotion). No full dispatch JSON — single import pack.

## Next
→ [PLAN.md](./PLAN.md).
