---
mode: refresh
spell: invoke
phase_status: pass
mutation_mode: apply-approved
created: 2026-07-12
target_artifact: DomainSpec v2 R3 closeout attestation route
target_owner: task-session / Craft / sigil-development / DomainSpec v2 authority
---

# Invoke Refresh Report: R3C Attestation Route

## Verdict

**PASS, apply-approved.** The passed Decision Gate made SWU-R3C-010 executable
at L1, but it does not close the L2 external-signature blocker. The current
artifact set contains two kinds of drift: R3/Craft routing still treats the
whole attestation capability as unavailable, and the private capability README
and harness still describe the demonstrated L1 rung as unbuilt.

The approved R3/Craft, authority-pointer, and private sigil-projection deltas
were applied. SWU-R3C-010 then produced a valid L1 integrity receipt.

## Declared scope

- Evidence date: 2026-07-12.
- Mutation mode: apply-approved by explicit operator confirmation.
- Refresh R3 work-pack/task routing and Craft blocker semantics from the passed
  assurance/payload decision.
- Route private capability-document corrections to sigil-development.
- Defer DomainSpec authority-model wording until a real SWU-R3C-010 receipt.
- Preserve historical mint/ratification decisions and the public/private wall.

## Context Builder and Inventory

Strict standard Context Builder coverage passed six of six obligations; see
`CONTEXT-PACK.md`. Inventory machine lookup selected
`entries-attestation-capability-moat-mvp-synthesis` with high confidence: L1 is
built/demonstrated and L2 remains intended-not-shipped. No new Inventory entry
is needed for this proposal.

## Refresh signals

| ID | Type | Claim | Targets | Safety |
|---|---|---|---|---|
| R3C-ARF-001 | evidence_added | Decision Gate selected L1 now, a deterministic two-record manifest, and retained L2 residue. | R3 work-pack/task, Craft | safe |
| R3C-ARF-002 | evidence_added | L1 Task Session proves non-vacuous `valid`/`tampered` verification. | R3 task, attestation README/HARNESS | safe |
| R3C-ARF-003 | status_changed | SWU-R3C-009 is complete; the work-pack still reports receipts only through 008 and navigates to 009. | R3 WORK-PACK | safe |
| R3C-ARF-004 | route_changed | SWU-R3C-010 changes from unavailable-capability handoff to executable L1 manifest/seal, with L2 retained. | R3 work-pack/task | needs_review |
| R3C-ARF-005 | status_changed | Craft blocker should narrow from whole-capability unavailable to L2 external-signature unavailable. | `.craft/ledger.yml`, `CRAFT.md` | needs_review |
| R3C-ARF-006 | artifact_drift | Attestation README says L1 is merely buildable and next; direct receipt says built/PASS. | capability README | needs_review |
| R3C-ARF-007 | artifact_drift | Harness says scaffold/no examples; specimen and L1 receipt exist. | capability HARNESS | needs_review |
| R3C-ARF-008 | no_op | Authority model's L2-pending statement remains true before a DomainSpec-specific L1 receipt. | authority model | safe |
| R3C-ARF-009 | no_op | Original mint/ratification decisions remain immutable source acts; new evidence is appended alongside. | historical decisions | safe |

## Delta summary

| Class | Count |
|---|---:|
| evidence_added | 2 |
| status_changed | 2 |
| route_changed | 1 |
| artifact_drift | 2 |
| no_op | 2 |

## Proposed changes

### Task Session / Craft lane

1. Refresh R3 control fields and Distill navigation through SWU-R3C-009 and the
   passed Decision Gate; make SWU-R3C-010 the next unit.
2. Refine SWU-R3C-010 to require a deterministic proposal→ratification manifest,
   source-digest recomputation, L1 seal, positive verify, tampered negative
   control, and explicit L2 residue.
3. Refine Craft blocker text/status without removing it from active blockers:
   L1 is available; external actor signature remains unavailable.
4. After the SWU-R3C-010 receipt only, add authority-model and Craft pointers
   saying DomainSpec is L1 integrity-sealed while L2 remains pending.

### Sigil Development lane

5. Refresh attestation `README.md` and `development/HARNESS.md` to say L1 is
   built/demonstrated, point to the receipt/specimen, retain INTERNAL and
   in-development status, and keep L2/promotion readiness open.

Exact file-level deltas are in `REFRESH-PATCH-PROPOSAL.md`.

## Applied changes

- R3 `WORK-PACK.md` and `TASK-R3C-AUTHORITY.md` synchronized through SWU-R3C-010.
- Craft machine ledger and human view refined the still-active blocker to L2.
- DomainSpec authority model links the L1 receipt and preserves external L2 pending.
- Private attestation README/HARNESS now reflect built L1 and unbuilt L2.
- SWU-R3C-010 added the deterministic manifest, L1 artifact, discriminating
  verification receipt, and Task Session receipt.

## Skipped changes

- No manifest, attestation, or verification run: Task Session owns execution.
- No authority-model “L1 sealed” update before a DomainSpec-specific receipt.
- No rewrite of the original mint or owner-ratification decisions.
- No L2 key/identity/signing design.
- No capability promotion and no public Arcanum mutation.
- No duplicate APE backend-lane refresh; that package already represents the
  completed graph-verification route.

## Dispatch technique trace

Full dispatch: `r3c-attestation-refresh.dispatch.json`.

- `sequence` and `handle_handoff`: proposal → approved R3/Craft delta → SWU-010
  receipt → post-receipt synchronization.
- `owner_boundary_check` and `authority_split_gate`: separate Invoke,
  Task Session, Craft, sigil-development, and authority-owner lanes.
- `artifact_contract_bridge` and `validation_loop`: bind the decision to a
  deterministic manifest plus discriminating verification evidence.
- `concrete_path_evidence`: every status claim points to a decision, receipt,
  target artifact, or Inventory selector.
- `state_namespace_boundary`: keep R3 planning, private authority evidence,
  private sigil lifecycle, observability, and public Arcanum separate.
- `execution_receipt_handoff`: require structured SWU-010 and sigil-update
  receipts before downstream status changes.
- `residue_ledger`: retain L2 identity/signature work.
- `recomposition_proof`: the L1 receipt recomposes into R3 final verification
  without pretending to finish L2.

Subagent strategy: none. The route is small, serial, and already decision-gated.

## Distill validation

Triggered because the refresh crosses two lifecycle owners. **PASS.** The
smallest coherent proposal has two patch groups and one shared decision handle:

1. R3/Craft/SWU-010 execution route → Task Session.
2. Capability status projections → sigil-development.

Combining both under Task Session would violate sigil lifecycle ownership;
splitting the decision or duplicating the attestation contract would lose the
shared L1/L2 boundary. Both routes recompose through the SWU-R3C-010 receipt.

## Blockers and gaps

- Full L2 external actor authentication remains deferred and blocks only the
  full L2 authority seal.

Invoke-specific gaps: none.

## Validation plan

- Dispatch Spec deterministic validation.
- JSON parse and signal-to-delta/target coverage checks.
- Markdown/frontmatter link validation.
- Craft YAML/index/human-view checks if applied.
- L1 source-manifest recomputation and deterministic rebuild.
- `verify` positive arm and content-tampered negative control.
- Private/public leak scan and scoped `git diff --check`.

## Next route

Task Session SWU-R3C-011 final verification. It must preserve the distinction
between completed backend graph/L1 integrity work and the still-open full L2
external-signature seal.
