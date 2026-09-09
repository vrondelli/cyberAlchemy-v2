---
node_type: plan
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped; non-executed plan
created: 2026-07-01
authored_by: invoke (mode=plan)
output_mode: single-file
complexity: medium
target_artifact: cav2 artifact-governance import pack (Tier-1)
next_owner: constitution-governance (2 constitutions) + task-session (validator port + hook)
note: Paths repo-root-relative from domainspec-core/.
---

# cav2 Artifact-Governance Import Pack (Tier-1) — PLAN

## Implementation layering
| Layer | Scope | Value | Promotion evidence |
|---|---|---|---|
| **L0 stage** | record the 3 Tier-1 pieces in `authority/imports/` (done in the 2026-07-01 re-scan) | CAV2-C11 import-before-promotion satisfied | manifest re-scan present |
| **L1 constitutions** | extract + promote SCHEMA-FORMAT + ARTIFACT-RETENTION constitutions (strip Arcanum bindings) | cav2 owns the two form rules | constitution-governance promotes each with scope/owner/examples/validation-mode |
| **L2 validator port** | port the validator + 2 helpers to `cyberAlchemy-v2/tools/`, re-rooted | a runnable deterministic form-checker | `--self-test` passes on cav2 fixtures; runs green on the current cav2 tree |
| **L3 hook wiring** | wire the validator to run on artifact author/change (PreToolUse / pre-commit) | "**enforce always**" (for FORM) becomes real | a write that violates a form rule is blocked |

## Shared SWU manifest
| SWU | layer | one parent task | write scope | acceptance evidence | verify |
|---|---|---|---|---|---|
| **SWU-I1** SCHEMA-FORMAT constitution | L1 | extract Arcanum SCHEMA-CONSTITUTION → cav2, strip example paths | `authority/constitutions/SCHEMA-FORMAT-CONSTITUTION.md` | scope/owner/examples/non-examples/validation-mode present; cites import provenance | constitution-governance review |
| **SWU-I2** ARTIFACT-RETENTION constitution | L1 | extract retention taxonomy + gitignore coupling; **drop** the owned promotion-rule | `authority/constitutions/ARTIFACT-RETENTION-CONSTITUTION.md` | 4 classes + gitignore rule; NO promotion-boundary rule (owned by C11/C3) | review; grep no promotion-rule dup |
| **SWU-I3** validator port | L2 | port the 3 tool files, re-root all path predicates to cav2 | `cyberAlchemy-v2/tools/` | `--self-test` green; runs clean on cav2 tree; zero `.arcanum/`/`benchmark/` predicates remain | run `--self-test`; grep for stray Arcanum roots |
| **SWU-I4** hook wiring | L3 | wire validator on write under `cyberAlchemy-v2/**` | hook/settings config | a form-violating write is blocked; a clean write passes | author a bad `.schema.yml`; confirm block |

**Out (next routes):** Tier-2 (ARTIFACT-METADATA) gated by the frontmatter decision-gate; the edge-vocab → ontology.

## Validation strategy
- L1: each constitution passes constitution-governance (form + provenance).
- L2: ported validator `--self-test` green + a real run over `cyberAlchemy-v2/**` reports only genuine findings.
- L3: adversarial — a deliberately malformed artifact write is blocked by the hook.
- Reconciliation: the ported validator's checks = {retention-visibility, .schema.yml, schema/md boundary, chart \n, link-resolution} — the FORM set, no authority-rule claims.

## Distill validation
**flag** — bounded (2 constitutions + 1 port + 1 hook), recomposes into the frozen findings; 2 named gaps:
(1) validator port is code → task-session, not a constitution promotion; (2) "enforce always" depends on
L3 hook wiring — without it the validator is manual. Neither blocks L1. No overbuild (import, don't rebuild).

## Dispatch technique trace
`sequence` (L0→L3) · `artifact_contract_bridge` (SWU↔landing) · `authority_split_gate` (stage vs promote) ·
`validation_loop` (self-test + adversarial write) · `residue_ledger` (code-port + hook). No full dispatch JSON.

## Handoff
→ **constitution-governance** (SWU-I1/I2) then **task-session** (SWU-I3/I4). Uncommitted parent-repo state; no submodule writes.
