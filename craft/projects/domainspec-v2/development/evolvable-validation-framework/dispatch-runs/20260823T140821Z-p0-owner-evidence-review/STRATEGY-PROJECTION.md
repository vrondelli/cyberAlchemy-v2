# EVF L3 P0 owner-evidence review strategy

## P1 trigger

Dispatch is warranted by parallelism, isolation, and synthesis. The BTE prerequisite audit, IOLM DSC-A provenance audit, and dirty-baseline byte audit have independent primary methods, can run concurrently over one frozen request corpus, and must later be joined without collapsing their different owners or authority effects.

This is a `review` dispatch over existing request and repository artifacts. It prepares verified evidence and change/decision inputs; it is not an authority dispatch to the named owners.

## Inventory preflight

- Status: selected discovery-only context supplied by the router.
- Selected entry: `.arcanum/inventory/entries/domainspec-v2-evolvable-validation-framework-strategy-result-synthesis.md` (`domainspec-v2-evolvable-validation-framework-strategy-result-synthesis`, updated 2026-07-17, confidence `high`, no EvidenceCard or EvidenceSet IDs).
- Use: the entry preserves the earlier non-authority layered-framework result and warns about relationship/profile/count drift and missing end-to-end evidence.
- Exclusion: its historical counts, prior dispatch outcome, and synthesized claims cannot satisfy any current owner request or current-byte check.
- Current evidence: the 2026-08-23 continuation result and four exact request artifacts are the governing audit corpus.
- Design consequence: every agent receives the full current corpus, must rehash current artifacts, and must label Inventory-derived context as discovery only. The BTE lane explicitly rechecks current denominators; the IOLM lane requires exact current provenance; the dirty lane computes live-versus-HEAD facts per target.
- Gap: Inventory contains no current BTE owner admissions, private IOLM owner response, dirty-target owner classifications, candidate acceptance, apply inventory, or independent readiness PASS.
- Authority notice: Inventory is a read model and grants no dispatch, owner, execution, promotion, release, or readiness authority.

## Parallel group and agents

One group, `owner-evidence-auditors`, runs all three agents in parallel. `anti_bias` is the `methodology` axis.

| Lane | Pooled agent | Role | Model | Token budget | Primary method and expected output |
|---|---|---|---|---:|---|
| BTE prerequisites | van Lamsweerde, Axel | explorer | `gpt-5.6-sol` | 3000 | Formal contract/provenance/denominator audit; JSON-compatible chat receipt covering every requested freeze, admission, and catalogue path. |
| IOLM DSC-A | Ashby, W. Ross | explorer | `gpt-5.6-sol` | 3000 | Adversarial ownership/reference-integrity audit; JSON-compatible chat receipt for exact current locator/provenance and no-impersonation failures. |
| Dirty baselines | Hewitt, Carl | explorer | `gpt-5.6-sol` | 3000 | Computational live/HEAD hash, size, and diff audit; JSON-compatible chat receipt with five exact owner-decision input packets and no inferred choice. |

All agents read the full continuation-plus-four-request corpus. The lanes differ by audit method and primary responsibility, not by exclusive source partition. Agents write no files; the parent later joins their chat receipts and, if the review is executed and accepted, writes `attacks.md` and `findings.md` in the declared working folder.

## Pairwise tension

- BTE formal versus IOLM adversarial: structural completeness or a located path must not be mistaken for independently authored owner evidence; blanket authority skepticism must not erase exact contract and denominator facts.
- BTE formal versus dirty computational: declared metadata must survive live-byte checks; byte equality must not replace provenance or response-contract requirements.
- IOLM adversarial versus dirty computational: distinct owner gaps must stay separately evidenced; hashes and diffs must not become decisions.

The exact pair sentences live in `dispatch-sheet.json`. That sheet must first pass schema 0.8.0 confirmation readiness, then both independent check-tension agents must return PASS on its exact SHA-256 before the human confirmation gate opens.

## Dependency and join flow

There is exactly one parallel execution wave with `join_policy: all`. The parent orchestrator joins the three normalized receipts, closes every agent, checks target drift and authority ceilings, and performs final synthesis. There are no dependent product, apply, readiness, selection, or Task Session waves.

## Authority ceiling

The dispatch may locate and validate existing evidence and prepare decision-ready packets only. It must not:

- invent or author BTE admission, freeze, catalogue, or validation-owner receipts;
- decide or change the private IOLM DSC-A predecessor;
- decide `adopt-live-bytes-as-future-baseline` or `reconcile-separately-before-future-baseline` for any target;
- accept or apply the proposal candidate;
- select U1, grant readiness, promote, publish, release, deploy, or execute product code;
- impersonate a BTE, IOLM, baseline, planning, apply, readiness, release, or promotion owner.

Private DomainSpec/IOLM/CyberAlchemy evidence remains private and must not be copied into public Arcanum or any external transport.

## Expected outputs and stop conditions

Expected runtime outputs are three JSON-compatible chat receipts, normalized by the parent/orchestrator under the declared run-local receipt refs. Parent synthesis may later produce the review-owned `attacks.md` and `findings.md`; those files remain evidence-only and cannot satisfy owner response contracts by themselves.

Fail closed before or during execution when:

- confirmation readiness, either tension verdict, exact human confirmation, registration, native operation availability, spawn, join, close, or receipt admission fails;
- any current request or declared target digest drifts from the admitted boundary;
- a lane would infer or exercise owner authority;
- a lane would mutate repository, Git, telemetry, Inventory, public Arcanum, request, canonical, planning, contract, consumer, implementation, or Craft state;
- a private/public boundary would be crossed.

## Gate and ledger state

- Candidate sheet: schema 0.8.0, no `evidence_binding`.
- Dispatch Spec authorization: `approved` only for this completed read-only review run after exact human confirmation; no retry authorization exists.
- Subject-agent lifecycle: all 3 expected subject agents spawned, returned, were normalized, and were terminally closed. The coordinator reduced the run to `gate_block` because the BTE receipt declared non-pass status, non-pass validation, and blockers.
- Check-tension: PASS from `owner-calls-tension-checker-d31545fb` and `owner-calls-tension-reviewer-d31545fb`, both bound to exact sheet SHA-256 `d31545fb7ddd9e8a14fae168236b98eb15c11abf680105b9b7c9cc992c64552c`, with no findings or required repairs. The bounded receipt is `TENSION-VERDICTS.json`.
- Human confirmation: confirmed via handle `chat-confirm-20260823T142820Z-d31545fb`; the exact admitted sheet remains unchanged.
- Ledger: dispatch row registered exactly once at `telemetry/agents/subagents-dispatch.yaml:6893`; error close row appended exactly once at `telemetry/agents/subagents-dispatch.yaml:6906`.
- Closeout: `error`; Orchestrate state `gate_block`; event validation PASS; no downstream actions and no retry. The joined evidence is in `attacks.md`, `findings.md`, and the Orchestrate run directory.
- Residue: all requested BTE owner outputs remain absent, the exact private IOLM DSC-A owner receipt remains unresolved, and five dirty-baseline owner classifications remain pending. A governance-defect sidecar is diagnosing the lost sheet-to-host prompt binding; it cannot repair or retry the run.
- Post-result Inventory hook: deferred because this dispatch failed before a complete joined audit and the confirmed scope did not authorize Inventory mutation. The run-local findings remain the evidence surface.

After confirmation readiness and both independent tension verdicts PASS, the exact human confirmation phrase is:

`confirmed`
