---
artifact: context-builder-selection
status: pass
mode: standard
strict: true
handoff: none
task: refresh-DEC-GCP-002
created: 2026-07-20
authority: refresh-session-evidence
---

# Context Pack: DEC-GCP-002 Refresh

## Expected Output

An exact apply-approved Invoke refresh that propagates the accepted IOLM
two-proof role into EVF, IOLM, BTE consumer, private machine-contract, and
derived x-ray artifacts without starting implementation or execution.

## Obligation Matrix

| ID | Obligation | Status |
|---|---|---|
| O1 | Preserve accepted option 1 and its two distinct claims | covered |
| O2 | Keep EVF core independently closable and atomic | covered |
| O3 | Give IOLM an explicit owner task for fresh consumer receipts | covered |
| O4 | Bind only exact upstream handles; do not copy semantic authority | covered |
| O5 | Avoid a BTE core/consumer dependency cycle | covered |
| O6 | Keep IOLM cross-feature blocker out of the EVF core gate | covered |
| O7 | Use YAML/JSON for the machine handoff, not Markdown | covered |
| O8 | Preserve candidate/FPR/release/production boundaries | covered |
| O9 | Default to proposal-only pending explicit apply approval | covered |

## Selected Context

| Source | Selectors | Obligations |
|---|---|---|
| `decisions/2026-07-20-iolm-proof-role.md` | selected option, rationale, related blockers | O1-O6, O8 |
| `decisions/2026-07-20-key-and-door-formal-source.md` | blocker question, options, decision record | O2, O6 |
| EVF `DESIGN.md` | four planes, workflow, interfaces | O2, O4, O8 |
| EVF `IMPLEMENTATION-LAYERING.md` | L0 and L3 rows, boundary rule | O2, O5, O6 |
| EVF `WORK-PACK.md` | SWU atomicity, blockers, breadth handoff | O2, O5, O6 |
| IOLM `SPEC.md` | consumer boundary, FPR-02B handoff, gates | O3-O8 |
| IOLM `ARCHITECTURE-BUNDLE.md` | adapters, validation, decision boundaries | O3, O4, O8 |
| IOLM `IMPLEMENTATION-LAYERING.md` | L0C/L0A and support-receipt blocker | O3, O6, O8 |
| IOLM `WORK-PACK.md` | task/SWU inventory and missing consumer owner | O3, O5, O6 |
| IOLM 00C-B `DECISION-GATE.md` | selected upstream-support route and remaining receipt blocker | O6 |
| BTE `WORK-PACK.md` | core/consumer ordering and SWU-BTE-010 | O3, O5, O8 |
| BTE consumer-manifest task | independent run ownership and fail-closed rules | O3-O5, O8 |
| `INTEGRATED-EVIDENCE-MANIFEST.yml` | machine consumer slots and authority split | O4, O7, O8 |
| x-ray lane model | current external-dependency and lifecycle projection | O8 |

## Evidence Versus Inference

- Evidence: the decision is accepted; EVF core is atomic; IOLM is a required
  read-only consumer; BTE closes core before external consumers; IOLM selected
  the upstream-support route but 00C-B still awaits its exact support receipt;
  no IOLM task presently owns the fresh DomainSpec consumer receipt.
- Inference: one IOLM consumer task with two independently fresh SWUs is the
  smallest safe repair. Distill validates this inference at proposal level.

## Excluded Candidates

- UI implementation files: the UI lane is not a dependency of this refresh.
- Body War implementation: its consumer role is unchanged by DEC-GCP-002.
- Engine source code: refresh authors plans/contracts only.
- Lean/formal research: no runtime or authority change is proposed.
- Historical refresh receipts: immutable evidence, not mutation targets.

## Result

- Files selected: 14 of 14 standard budget.
- Snippets: selector summaries only; below the 280-line budget.
- Obligation coverage: 9/9.
- Strict coverage: pass.
- Runtime handoff: none; apply changes planning and machine contracts only.
- Blockers: 0 for refresh authoring.

## Apply Preimage Rebase

Four selected IOLM sources advanced after the proposal was authored. Their new
state closes the cross-feature routing decision with option 1 while preserving
the unresolved upstream support-receipt dependency. The accepted two-proof
topology is unchanged, so apply is rebased additively rather than overwriting
the newer IOLM work.
