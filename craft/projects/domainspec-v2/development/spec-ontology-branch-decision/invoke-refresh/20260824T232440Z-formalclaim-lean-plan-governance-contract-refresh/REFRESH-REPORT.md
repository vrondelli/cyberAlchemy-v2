# Invoke Refresh Report — FormalClaim Lean/EVF Plan Governance Contracts

## Outcome Brief

This proposal repaired the 14 outdated closeout contracts in staged bytes and updated the execution cursor to the truth: SWU-FCL-001 is complete, SWU-FCL-002 is next, and nothing after it has run. It did not change the accepted Plan or execute implementation. The current readiness validator still cannot accept its own current terminal-receipt format, so the proposal stops before apply or renewed acceptance.

- Objective: reconcile the SWU-FCL-002 readiness blocker without changing Plan semantics.
- Result: exact four-file postimages staged; 14 closeout blockers removed; one current WPRA continuity-contract contradiction remains.
- Why it matters: the Plan’s meaning is intact, but continuing now would require inventing false evidence or weakening validation.

## Boundary and Next Decision

- Changed: only this isolated Refresh run root and its staged postimages/evidence.
- Unchanged: accepted Plan bytes, SWU-FCL-001 receipt, SWU-FCL-002 product targets, authority rules, owner roles, C12/Victor pre-merge gate, Git, publication, release, and deployment.
- Open question: the WPRA lifecycle must decide and implement how historical continuity binds the current `closeout_join` terminal structure.
- User decision: none inside this proposal; a separate lifecycle route needs its own authority.
- Next action: run a bounded Spellcraft lifecycle repair for `work-pack-readiness-audit`, then rerun `invoke:refresh:proposal-only`.

## Technical Details

## Invoke Validation Fixture Result

- Mode: refresh
- Spell: invoke
- Canonical ID: invoke
- Scope: library
- Phase status: flag
- Phase status basis: proposal artifacts and governance-only postimages are exact, but one refresh-authoring blocker prevents a safe complete candidate.
- Handoff readiness: blocked
- Mode contract: `.agents/skills/invoke/refresh.md`
- Outputs: `REFRESH-REPORT.md`, `refresh-report.json`, `REFRESH-PATCH-PROPOSAL.md`, staged targets, context, Inventory lookup, Dispatch trace, and validation evidence
- Mutation mode: proposal-only, explicitly requested
- Source signals: 3 — two artifact-drift signals and one truthful status change
- Target artifacts: 4 exact Plan governance files in `TARGET-INVENTORY.json`
- Proposed changes: 3 mapped change groups; all staged, none applied
- Applied changes: none
- Skipped changes: final/trial readiness outputs, implementation-readiness preflight, and acceptance manifests until WPRA can return a truthful current verdict
- Material package: not required for proposal-only; none created
- Mutation ready: false
- Capability ceilings: proposal evidence only; no apply, acceptance, selection, execution, merge, publication, release, deployment, theorem, or business-truth claim
- Dispatch techniques: sequence, concrete-path evidence, artifact-contract bridge, validation loop, execution-receipt handoff, owner-boundary check, residue ledger; Dispatch Spec pass
- Distill validation: skipped because no SWU or semantic restructuring occurs; rationale in `DISTILL-SKIP.json`
- Inventory: lookup readiness pass, zero failures, 153 non-blocking tag warnings; non-authority result in `inventory/LOOKUP-RESULT.json`

## Staged change set

The exact four postimages and hashes are listed in `TARGET-INVENTORY.json`. They:

1. add 14 typed mutation-capable closeout contracts;
2. preserve the current precloseout, Invoke owner-closeout, final terminal, continuity, and Continuation Router schema identities;
3. record SWU-FCL-001 as the only completed/joined prefix;
4. set the unexecuted cursor to SWU-FCL-002; and
5. update the generator so regeneration cannot silently restore the legacy flat shape.

Canonical semantic digest remains `a6aa1679575472ab625b773975463dbc839a184a8833ee178a945fe3ed325c5c`, and every per-unit semantic digest remains identical to the accepted Plan.

## Current WPRA result

- Verdict: block
- Exit: 2
- Terminal code: `BINDING_SELECTOR_UNRESOLVED`
- Blockers: exactly one, `joined-closeout-SWU-FCL-001`
- Selected unit: none
- Mutation ready: false
- Authority effect: none
- Configured commands executed: false

The staged typed contracts remove all 14 `MUTATION_EXECUTION_CONTRACT_MISSING` findings. The remaining contradiction is inside the current WPRA continuity validator:

- it requires `/lifecycle_owner_validation/status` on the terminal receipt;
- the current terminal schema forbids extra properties and uses `closeout_join`;
- the actual joined Invoke result is schema-valid and resolves as `no-op` at `/closeout_join/joined_owner_receipts/0/result`;
- when that real selector is used, WPRA rejects it because it insists on the legacy selector.

## Validation

- Consolidated proposal checks: pass, 25 checks, no failures
- Audit-config v2 schema: pass for exact target postimage and validation-only rebase
- Terminal receipt schema: pass
- Historical Invoke owner-closeout: exact digest and legacy identity verified; incompatibility with the current precloseout owner schema is explicit residue, not rewritten evidence
- Canonical and all per-unit semantic non-drift: pass
- 14 unit identities/routes/scopes/validators/owners: unchanged
- Legacy flat closeout adversarial probe: expected block with 14 typed-contract omissions
- Modern joined-closeout selector probe: expected block exposing the current validator contradiction
- Dispatch Spec: pass
- Inventory lookup readiness: pass
- Symlink and whitespace checks: pass
- Accepted target preimages: unchanged

## Blockers by scope

- Refresh authoring: 1 — current WPRA cannot represent the real joined closeout.
- Apply authorization: 1 deferred — future changed acceptance-bound bytes require current v2 preacceptance closure and renewed exact Rondelli acceptance.
- Target lifecycle: 1 deferred — SWU-FCL-002 remains unselected and unexecuted.
- Audit: 1 — current staged WPRA verdict is block.

## Next route

`spellcraft:work-pack-readiness-audit` must own the validator/schema lifecycle repair, historical owner-receipt compatibility rule, and adversarial regression coverage. After that exact repair passes independently, rerun `invoke:refresh:proposal-only` to produce a complete current candidate, regenerate readiness/preflight and acceptance-bound inventories, and request renewed exact Rondelli acceptance through the current v2 preacceptance closure. Victor Boscaro remains only the later exact pre-merge structural approver.
