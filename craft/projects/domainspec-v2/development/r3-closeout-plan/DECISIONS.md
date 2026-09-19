---
module: r3-closeout-plan
docType: decision-gate
updatedAt: 2026-07-12
---

# R3 Closeout Decisions

## DEC-R3C-004-DISPATCH — second-corpus execution route

- Status: **PASS — Option A confirmed by user on 2026-07-12**
- Consequential work blocked: registration and execution of the
  `SWU-R3C-004` corpus-selection dispatch; no corpus or implementation mutation
  has started.
- Source: repository subagent human gate plus `SWU-R3C-004` owner `subagent`.
- Check-tension: **double PASS** from two independent read-only gate agents.
- Dispatch registration: authorized; register before working agents launch.
- Ledger mutation: dispatch row pending at decision-record update time.

### Decision question

How should `SWU-R3C-004` cross its declared subagent-owner boundary?

### Option A — confirm the governed research dispatch (recommended)

- Benefit: two independent corpus-selection lenses and two distinct rejection
  gates decide whether a source-backed second corpus exists.
- Cost/risk: seven bounded agent invocations across five dependent lanes; the
  result is selection evidence only, not implementation.
- Downstream impact: after the dispatch closes, the parent Task Session inspects
  its evidence, then performs any source mutation and validation locally because
  `dispatch_type: code` is reserved.
- Choose when: independent corpus selection is worth the extra coordination and
  evidence record.

### Option B — explicitly reassign SWU-R3C-004 to local parent execution

- Benefit: lowest coordination cost and immediate continuation.
- Cost/risk: gives up independent corpus-selection tension and requires an
  explicit work-pack owner override before execution.
- Downstream impact: update the SWU owner/handoff, build a local Context Pack,
  and execute the candidate sweep plus validation in the parent Task Session.
- Choose when: speed matters more than independent selection evidence.

### Option C — defer SWU-R3C-004

- Benefit: no additional work or mutation now.
- Cost/risk: `GAP-DSV2-EXERCISE` stays active and the second-corpus evidence
  slice remains incomplete.
- Downstream impact: stop this continuation; later work must reopen this gate.
- Choose when: evidence breadth is intentionally postponed.

### Explain / more context

This is non-committal and does not resolve the gate. If selected, explain the
dispatch cost, the code-type reservation, and the exact parent/subagent split,
then present Options A–C again.

### Proposed dispatch strategy for Option A

- P1 triggers: synthesis, isolation, and parallelism.
- Type: live `research`; selection only, never code execution.
- Working folder:
  `development/r3-closeout-plan/research/2026-07-12-second-corpus-selection/`.
- Global tension: reuse-first corpus selection versus evidence-integrity
  rejection.

| Lane | Agents | Role and angle | Dependency |
| --- | --- | --- | --- |
| `corpus_explorers` | Shannon; Noether | Empirical repo-owned candidate inventory versus formal DS-D8/SWU obligation match; composite methodology + source-corpus axis. | starts first; parallel pair |
| `corpus_synthesizer` | Turing | Reconcile returns into a cited select/reject/no-suitable matrix. | after explorers |
| `corpus_reviewers` | Popper; Lakatos | Non-vacuity witness gate versus definitional-soundness/no-invention gate; attack-vector axis. | bounded zig-zag after synthesis |
| `corpus_writer` | Baez | Persist `findings.md` only with candidate matrix and exact parent handoff. | after reviewers |
| `corpus_auditor` | Brandenburg | Evaluate `findings.md` only; independent final approver. | after writer; one revision allowed |

Dependency flow:

`explorers -> synthesizer <-> reviewers -> writer -> auditor`, with one bounded
auditor-to-writer revision. No feedback to explorers is predeclared.

Expected closeout: exactly one dispatch row after confirmation, one close row at
termination, explicit `exit_reason`, spawn report, result inventory, and
observability update.

### Decision state

- Selected option: Option A — governed research dispatch.
- Rationale: preserve independent corpus-selection evidence while retaining
  implementation and validation in the parent Task Session.
- Source of decision: user replied `confirmed` on 2026-07-12.
- Remaining blocker: none at the human gate; proceed to registration and run.
- Assumptions: none; silence and prior approval of the Invoke refresh are not
  subagent-dispatch confirmation.

## DEC-R3C-005-DISPATCH — backend-card triage route

- Status: **PASS — Option A confirmed by user on 2026-07-12**
- Consequential work resolved: the `SWU-R3C-005` backend-card triage dispatch
  was registered, executed, accepted, and closed; the parent Task Session then
  materialized the staging matrix and Import Manifest rows.
- Source: `SWU-R3C-005` execution owner `subagent` plus the repository human
  dispatch gate.
- Check-tension: **double PASS** from two independent read-only gate agents.
- Dispatch registration: completed as
  `2026-07-12-r3c-backend-card-triage`.
- Ledger lifecycle: one dispatch row plus one `resolved` close row.

### Decision question

How should `SWU-R3C-005` cross its declared subagent-owner boundary?

### Option A — confirm the governed research dispatch (recommended)

- Benefit: every one of the 14 backend cards is classified through independent
  reuse and authority-integrity lenses, then challenged for non-vacuity and
  definitional soundness.
- Cost/risk: seven bounded agent invocations; the result is a classification
  matrix, not copied cards or promotion.
- Downstream impact: the parent Task Session inspects the accepted findings,
  creates the v2 evidence/staging surface and Import Manifest rows, validates
  links, and stops rather than inventing a classification.

### Option B — explicitly reassign SWU-R3C-005 to local parent execution

- Benefit: immediate continuation with lower coordination cost.
- Cost/risk: loses independent tension over whether useful v1 authoring content
  is merely schema restatement or carries retired authority assumptions.
- Downstream impact: update the SWU owner, build a local Context Pack, and
  perform all 14 classifications locally.

### Option C — defer SWU-R3C-005

- Benefit: no further mutation now.
- Cost/risk: `GAP-DSV2-APE-CARD-TRIAGE` stays active and `SWU-R3C-006` remains
  dependency-blocked.

### Explain / more context

This is non-committal and does not resolve the gate. Explain the authority
boundary, expected 14-row result, cost, and downstream parent mutation, then
present Options A–C again.

### Proposed dispatch strategy for Option A

- P1 triggers: synthesis, isolation, and parallelism over 14 source cards.
- Type: live `research`; classification only, never copy/promotion authority.
- Working folder:
  `development/r3-closeout-plan/research/2026-07-12-backend-card-triage/`.
- Global tension: reuse-owned authoring knowledge versus current-authority
  integrity.

| Lane | Agents | Role and angle | Dependency |
| --- | --- | --- | --- |
| `card_explorers` | Abramsky; Noether | Empirical v1 authoring-content inventory versus formal current-13-type/provenance admission; composite methodology + source-corpus axis. | starts first; parallel pair |
| `card_synthesizer` | Turing | Reconcile returns into a cited 14-row triage matrix. | after explorers |
| `card_reviewers` | Popper; Lakatos | Non-vacuity/usable-evidence gate versus definitional-soundness/no-authority-by-copy gate; attack-vector axis. | bounded zig-zag after synthesis |
| `card_writer` | Baez | Persist `findings.md` only with verdict matrix and exact parent handoff. | after reviewers |
| `card_auditor` | Brandenburg | Evaluate `findings.md` only; independent final approver. | after writer; one revision allowed |

Dependency flow:

`card_explorers -> card_synthesizer <-> card_reviewers -> card_writer ->
card_auditor`, with one bounded auditor-to-writer revision.

Expected closeout: exactly one dispatch append after confirmation and one close
append at termination, explicit exit reason/spawn report, strategy-result
Inventory, and observability update.

### Decision state

- Selected option: Option A — governed research dispatch.
- Rationale: preserve independent utility and authority-integrity checks before
  the parent creates any v2 staging surface.
- Source of decision: user replied `confirmed` on 2026-07-12.
- Remaining blocker: none at the human gate; proceed to registration and run.
- Assumptions: the confirmation for `DEC-R3C-004-DISPATCH` does not authorize a
  separate dispatch.

## DEC-R3C-006-DISPATCH — relationship-card triage route

- Status: **PASS — Option A confirmed by user on 2026-07-12**
- Consequential work authorized: registration and execution of the
  `SWU-R3C-006` relationship-card triage research dispatch. Relationship
  staging and Craft mutation remain parent-owned after accepted findings.
- Source: `SWU-R3C-006` execution owner `subagent` plus the repository human
  dispatch gate.
- Check-tension: **double PASS** from two independent read-only gate agents.
- Dispatch registration: authorized; register before working agents launch.
- Ledger lifecycle: one dispatch row plus one `resolved` close row.

### Decision question

How should `SWU-R3C-006` cross its declared subagent-owner boundary?

### Option A — confirm the governed research dispatch (recommended)

- Benefit: every one of the 29 v1 relationship rows is mapped through practical
  reuse and current-authority lenses, while six authority-only entries are
  reported as `no-v1-card` rather than invented examples.
- Cost/risk: seven bounded agent invocations and one review exchange; the result
  is research classification, not staging or authority mutation.
- Downstream impact: the parent Task Session inspects accepted findings, creates
  the relationship-card staging surface, validates documentation, then closes
  the Craft gap only because both SWU-R3C-005 and SWU-R3C-006 receipts exist.

### Option B — explicitly reassign SWU-R3C-006 to local parent execution

- Benefit: lower coordination cost and immediate local execution.
- Cost/risk: loses independent tension over example utility versus DS-D8 state
  integrity, especially for generated, deprecated, deferred, and missing-card
  cases.
- Downstream impact: update the SWU owner, build a new Context Pack, and perform
  the 35-entry full outer join locally before staging.

### Option C — defer SWU-R3C-006

- Benefit: no further mutation now.
- Cost/risk: `GAP-DSV2-APE-CARD-TRIAGE` remains active and TASK-CARDS cannot
  complete.
- Downstream impact: preserve the accepted backend matrix and leave relationship
  staging, Craft closure, and later Evidence-link work pending.

### Explain / more context

This is non-committal and does not resolve the gate. Explain the two populations,
the generated/deprecated/deferred authority boundary, the seven-agent cost, and
the exact parent mutation that would follow; then present Options A–C again.

### Confirmed proposal sheet pending decision

- Proposed dispatch ID: `2026-07-12-r3c-relationship-card-triage`
- Type: live `research`
- Working folder:
  `projects/domainspec-v2/development/r3-closeout-plan/research/2026-07-12-relationship-card-triage/`
- P1 triggers: synthesis, isolation, and parallelism.
- Global tension: reuse legacy examples versus current-authority completeness.
- Explorer 1 (Abramsky): map all 29 v1 rows, endpoints, contracts, examples, and
  practical utility.
- Explorer 2 (Noether): derive the current 30 active + 1 generated + 3 deferred
  + 1 deprecated authority universe and provenance obligations.
- Synthesizer (Turing): produce a keyed 35-entry full outer join with 29
  `v1-card-present` and 6 `no-v1-card` rows.
- Reviewers: Popper attacks vacuous example utility; Lakatos attacks state,
  provenance, generated-view, deprecated-label, deferred-candidate, and
  authority-by-copy errors.
- Writer (Baez): may persist only `findings.md` after the parent preserves the
  explorer transcript as `research.md`.
- Final auditor: Brandenburg, independent, returns `ACCEPT` or one bounded
  `REVISE` request.
- Dependency flow: explorers -> synthesizer -> reviewers (zig-zag cap 1) ->
  writer -> auditor (feedback cap 1).
- Hard boundaries: v1 is read-only; current root DS-D8 is authority; generated
  `owned-by` is never authored canonical; deprecated `enforces-cross` is never
  active; deferred candidates remain deferred; no six missing cards are
  manufactured; parent owns staging, validation, Craft, and work-pack sync.
