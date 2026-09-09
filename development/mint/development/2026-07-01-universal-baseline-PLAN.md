---
node_type: plan
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped; non-executed plan
created: 2026-07-01
authored_by: invoke (mode=plan)
output_mode: single-file
complexity: medium
target_artifact: Mint universal-governance-baseline addition
next_owner: sigil-development --update -> task-session
consumes: 2026-07-01-universal-baseline-DESIGN.md + research/2026-07-01-universal-baseline-partition/findings.md
note: Paths repo-root-relative from domainspec-core/.
---

# Universal Governance Baseline — PLAN (execution pack)

## Implementation layering
| Layer | Scope | Value | Promotion evidence to next |
|---|---|---|---|
| **L1 (MVP core)** | the 3 baseline templates (constitution, primitives, project-space-roles) + EMIT Steps 13–14 + §7 checks #11–#13 | the net-new value — every mint carries the universal baseline | a smoke emit (fresh domain) passes #11–#13; strip-bindings verified |
| **L2** | the propose→owner-ratify gate on the baseline set (reuse #11 ratify-CLOSE) | the baseline becomes *live*, not asserted | a ratify record gives the baseline set a terminal verdict; no baseline governs pre-ratify |
| **L3 (deferred)** | D42 fold-or-seed decision; any format that "earns its own surface" | closes the last SPLIT | a build decision record |

**Boundary heuristics:** L1/L2 split = emitting the baseline vs the *signed governance act* that ratifies it
(same seam as the core mint's L1/L2). L2 reuses existing #11 machinery, so it is cheap once L1 lands.

## Shared SWU manifest
| SWU | layer | one parent task | write scope | acceptance evidence | verify |
|---|---|---|---|---|---|
| **SWU-B1** baseline-constitution | L1 | build `templates/baseline-constitution.md` (9 rule-baselines) | `cyberAlchemy-v2/development/mint/templates/` | emits `<DOMAIN>-BASELINE-CONSTITUTION.md`; every rule references its cav2 D-ID; D21 four-facet rule present | emit on tide-tables fixture; grep each D-ID + the four facets |
| **SWU-B2** baseline-primitives | L1 | build `templates/baseline-primitives.md` (18 primitive refs) | `templates/` | emits `BASELINE-PRIMITIVES.md`; all 18 referenced; **strip-bindings applied** (D11 no cav2 spaces, D31 domain scope not `CAV2`, D40 no NODE-MODEL consumers) | emit; grep `CAV2` in the emitted primitives → only as provenance D-ID, never as `authority_scope` |
| **SWU-B3** project-space-roles | L1 | build `templates/project-space-roles.md` (D15) | `templates/` | emits `PROJECT-SPACE-ROLES.md` as an empty role-declaration format; zero cav2 folder names | diff vs cav2's folder list → none copied |
| **SWU-B4** emit-wiring + self-checks | L1 | add EMIT-PROCEDURE Steps 13–14 + §7 checks #11–#13 | `templates/EMIT-PROCEDURE.md` | steps compose the 3 templates; checks #11 (four-facet), #12 (baseline-present), #13 (baseline-no-leak) defined | run the checks on the SWU-B1..B3 emit |
| **SWU-B5** ratify gate (baseline set) | L2 | extend `decision-mint-ratify.md` (#11) so the baseline set gets a `ratify`/`defer` verdict | `templates/decision-mint-ratify.md` | the ratify record lists the baseline set; no baseline row reads `PROPOSED` post-ratify | emit + grep PROPOSED over ratified baseline |

**Out (next routes):** D42 fold-or-seed (L3, build decision); the frozen partition's owner-ratification of the
27 as candidate→canonical (owner act, not a build task).

## Implementation-detail (medium-complexity execution notes)
- **SWU-B1 rule shape** — reuse the constitution template's rule format (`### <DOMAIN>-B<n>. <rule> / Validation
  mode: / <rule text> / Provenance: CAV2-D<k>`). Rule text is the *form* (e.g. B1 = "every governed action
  binds classification/schema/human-view/machine-view or records typed residue" ← D21), no cav2 object content.
- **SWU-B2 primitive shape** — `### <primitive> (CAV2-D<k>) / <one-line form> / Domain specializes:` — a reference
  card, not a full re-definition; integrates into `DEFINITIONS-INDEX` as baseline rows.
- **SWU-B4 self-check #11 (four-facet)** — deterministic-ish: for each emitted action-governing artifact
  (decisions, ratify, promotion records), assert a facet block or a typed-residue line; else block.
- **Edge/failure** — a domain with no actions yet: #11 is vacuously satisfied (no governed action to check) —
  the baseline still seeds; the check fires on the first real action.

## Validation strategy (per delivery slice)
- **L1:** the `mint-smoke-02` regime — emit the baseline for a fresh domain (reuse the tide-tables fixture),
  run §7 checks #11–#13 + the strip-binding greps; PASS gates L1.
- **L2:** a ratify record exists giving the baseline set a terminal verdict; no baseline governs pre-ratify.
- Golden reconciliation: the baseline emitted for tide-tables must contain exactly the 27+2 (no localized D#).

## Distill validation
**flag** — the unit (baseline addition) is small enough to build (3 templates + 2 emit steps + 3 checks,
mirroring the prior additions) and recomposes into the frozen partition + the DESIGN; but two gaps are named
with owner + repair path:
1. **D42 fold-or-seed** — owner: sigil-development at build; repair: decide fold-into-B3 vs thin checklist.
2. **candidate→ratified partition** — owner: the cav2/domain authority owner; repair: ratify the 27 as the
   canonical baseline set (L2 gate) before a real mint relies on it.
Neither blocks L1 (they gate L2/public reliance). No overbuild: the 27 collapse into 3 templates, not 27 files.

## Dispatch technique trace
`sequence` (L1→L2→L3) · `artifact_contract_bridge` (SWUs bind partition D-IDs to templates) ·
`authority_split_gate` (propose vs ratify, SWU-B5) · `validation_loop` (smoke regime gates L1) ·
`residue_ledger` (D42 + ratification) · `concrete_path_evidence` (strip-bindings cite DEFINITIONS.md:1986).
No full dispatch JSON — single-capability authoring; delegation is the named sigil-development handoff.

## Build status (2026-07-01 — sigil-development --update)
- **L1 BUILT (SWU-B1..B4):** `templates/baseline-constitution.md` (9 rule-baselines), `baseline-primitives.md`
  (18 primitive refs, strip-bindings), `project-space-roles.md` (D15); EMIT-PROCEDURE Steps 13–14 + §7
  checks #11–#13.
- **Smoke-validated (mint-smoke-02, tide-tables):** PASS — 9 rules + 18 primitives present; `authority_scope
  = tide-tables` (not CAV2); 0 non-provenance CAV2 leaks; D11/D40 no space/NODE-MODEL leak; #11 vacuous-pass
  (baseline-only emit). Run report: `.claude/skills/mint/development/runs/`.
- **L2 pending (SWU-B5):** wire the baseline set into the ratify-CLOSE (#11) so it moves PROPOSED→ratified.
- **L3 pending:** D42 fold-or-seed decision. Frozen partition still owner-unratified (candidate).

## Handoff
→ **sigil-development --update** (build SWU-B1..B4 first = L1 MVP; SWU-B5 = L2), then **experiment-harness**
(`mint-smoke-02`). Everything remains uncommitted parent-repo working state; no submodule writes.
