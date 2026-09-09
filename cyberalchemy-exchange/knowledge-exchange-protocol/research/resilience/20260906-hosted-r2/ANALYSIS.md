# KEP stressor and attractor analysis — hosted r2

Analysis candidate, 6 September 2026. No approval, source repair or operational effect is granted. Uses the residuality-spec audit method.

## Earlier model found

The prior model is [candidate 013 adversarial-model.json](../../../capabilities/solana-coownership/successors/encrypted-durable-devnet/v1/formal-evidence/deployment-continuation/013/adversarial-model.json). It has 15 paths and seven attractor clusters, scoped to SBF deployment continuation. Ten paths are reachable in that boundary; five wider-product paths are excluded. This report retains it unchanged and brings those wider concerns into the current hosted-product scope.

The earlier generated adversarial receipt states NOT_EVALUABLE and explicitly says its matrix does not execute all required evidence. ARCHITECTURE.md describes later refinements as well. These are different evidence surfaces: no old coverage count is transferred to current account/file code, and this report does not adjudicate every historical refinement epoch.

## Normal intent and evidence

A participant unlocks a wallet-bound encrypted account, uploads an encrypted original, grants recipient access through explicit wallet actions, retrieves and verifies authorized bytes, and restores saved identity/context after reload. Hosted availability begins its one-calendar-year inactivity timer at the first verified-download acknowledgement, and later distinct acknowledged downloads renew it. No first download currently means no deadline. Provenance survives payload expiry; original extraction is still proposed work.

This is a broad structured analysis, not exhaustive stress execution or a complete state-space proof. Desired residues below are proposed requirements unless already selected in the product/user policy. Evidence descriptions distinguish current bounded tests, historical evidence, inference and open decisions. No external market/legal/security claims are evaluated.

Current evidence was rechecked by hash: the checkpoint repair receipt and browser-run source manifest have no drift. The repaired same-session checkpoint failure and the browser account-save/acknowledgement retries are no longer untreated defects. Remaining crash/reload ambiguity is intentionally not cleared by that repair. The browser experiment aborts requests before sending; it does not prove response loss after server commit.

## Attractors

“Attractor” here means a cluster of stressors sharing a vulnerability mechanism, following the repository method. It is not a proven dynamical-systems attractor.

| ID | Cluster | Shared mechanism | Owner / implication |
|---|---|---|---|
| A1 | Ambiguous progress | Multiple failures erase the distinction between prepared, durably checkpointed, submitted and finalized. | KEP controller owner: Explicit operation states and reconciliation; preserve safety without permanent false uncertainty. |
| A2 | Split authority and stale state | Wallet, identity, account revision, database snapshot and chain ownership can diverge. | KEP account/backend owner: Bind identities and revisions; enforce single writer or durable concurrency control. |
| A3 | Concentrated recovery secrets | A small number of recovery keys determine long-term usable access. | KEP product/security owner: Specify loss and compromise separately; choose recovery and rotation semantics before promising them. |
| A4 | Representation and context mismatch | Valid bytes in one representation may express a different operation or encrypted context elsewhere. | KEP protocol/crypto owner: Version boundaries, exact context binding and cross-runtime negative tests. |
| A5 | Divergent lifecycle clocks and copies | Receipt, saved file, hosted payload, archive and backup have different lifetimes. | KEP file/storage owner: Define which copy expires and when; keep receipt replay and restoration consistent. |
| A6 | Unbounded resource retention | Small bounded requests accumulate into unbounded account, storage and compute demand. | KEP backend/operations owner: Select quotas and admission controls; measure failure behavior before public use. |
| A7 | Misleading interface expectations | Similar screens and files imply different security and persistence guarantees. | KEP UX/product owner: Distinguish recovery, handoff, verification and saving; identify the primary console. |
| A8 | Evidence and operational context decay | Code, papers, accepted records and operator knowledge age at different rates. | KEP evidence/operations owner: New bounded epochs, source-linked claims and rehearsed handoffs. |
| A9 | Unknown failure handling | Unclassified errors are mistaken for safe retries or blanket success. | KEP incident/controller owner: Retain redacted context, stop affected effects, classify before resuming. |

## Stressor-to-residue matrix

Each row supplies a concrete degradation rule and a verification task. Signals must avoid private keys, plaintext and recovery-file content.

### A1 — Ambiguous progress

**S01 — Checkpoint save fails before wallet call**

- Required residue: Known no-submission state remains retryable in the same session.
- Degradation: Pause sharing; save exact pending account state before retry.
- Observe: Checkpoint failure; zero submission count.
- Verify: Inject failure at initialization and grant checkpoints; verify exactly one eventual submission per stage.
- Evidence: current regression tests.

**S02 — Crash after checkpoint but before known signature**

- Required residue: Never infer no effect from absence of a signature.
- Degradation: Stop automatic retry and retain operation identity.
- Observe: Started marker without signature.
- Verify: Crash at every await boundary; restore and reconcile against controlled chain adapter.
- Evidence: partial: restored uncertain state tests; full crash matrix absent.

**S03 — Submission response lost or finality delayed**

- Required residue: One semantic operation; known signature reused.
- Degradation: Observe existing signature; no new submission.
- Observe: Operation ID, signature, finality state.
- Verify: Timeout before/after callback; stale/finalized-failure observations; assert submission counts.
- Evidence: current controller tests with mocked finality; live evidence absent.

**S04 — Account save response lost after server commit**

- Required residue: Exact pending ciphertext and revision remain idempotent.
- Degradation: Retry same snapshot before allowing more changes.
- Observe: Expected/current account revision; retry count.
- Verify: Drop response after commit, then reload; distinguish from abort-before-send.
- Evidence: partial: unit retry and browser abort-before-send; after-commit browser case absent.

### A2 — Split authority and stale state

**S05 — Wallet changes during an unlocked session**

- Required residue: No command signed under the wrong wallet identity.
- Degradation: Require original wallet or explicit lock.
- Observe: Wallet mismatch without secret fields.
- Verify: Switch wallet between prepare, checkpoint and sign awaits.
- Evidence: partial controller mismatch tests; full mid-await matrix absent.

**S06 — Two tabs edit the same account revision**

- Required residue: No silent overwrite of newer account data.
- Degradation: Reject stale write; retain unsaved local changes.
- Observe: 409 conflict and unsaved-state indicator.
- Verify: Two isolated browser tabs write same revision, recover without losing pending context.
- Evidence: in-process API conflict tested; two-tab workflow absent.

**S07 — Second backend process writes stale snapshot**

- Required residue: A committed update cannot be silently replaced by stale process state.
- Degradation: Enforce one writer or stop second process.
- Observe: Writer lease or database revision conflict.
- Verify: Two backend instances sharing disposable DB; account and expiry races.
- Evidence: open: documented single-writer model, enforcement not demonstrated.

**S08 — Forged or replayed wallet authorization**

- Required residue: Wrong actor cannot read or mutate private account data.
- Degradation: Reject before mutation; bound accepted signature lifetime.
- Observe: 403, expired authorization, operation context.
- Verify: Wrong signer, expired request, cross-wallet discovery and exact retry tests.
- Evidence: bounded current Rust tests.

### A3 — Concentrated recovery secrets

**S09 — Recovery file is lost**

- Required residue: Do not falsely promise wallet-only decryption recovery.
- Degradation: Explain loss; preserve encrypted record; avoid destructive reset.
- Observe: Recovery unavailable; no automatic new identity overwrite.
- Verify: Define recovery/reset contract and test data survival.
- Evidence: open product decision.

**S10 — Recovery key or browser secrets compromised**

- Required residue: Old stolen capability is not called revoked by simple rewrap.
- Degradation: Stop new sharing; explicit rotation/epoch procedure.
- Observe: Compromise report; key/epoch version.
- Verify: Define revocation and migration; prove old ciphertext access limitations.
- Evidence: open product decision; no compromise-recovery proof.

**S11 — Wrong recovery file, corrupted backup or stale revision**

- Required residue: Decrypt only with matching wallet/key/revision context.
- Degradation: Remain locked with recoverable error.
- Observe: Unlock failure without plaintext logging.
- Verify: Tamper ciphertext and AAD; wrong key/wallet; account reload.
- Evidence: current crypto tests and browser happy-path recovery.

**S12 — Recipient loses envelope key or requests reissue**

- Required residue: Preserve membership and exact version; distinguish loss from compromise.
- Degradation: Require policy-authorized fulfiller; no duplicate grant.
- Observe: Reissue status and epoch mismatch.
- Verify: Exercise connected-console reissue and account persistence across reload.
- Evidence: historical Rust reissue; current connected UI coverage missing.

### A4 — Representation and context mismatch

**S13 — Ciphertext, nonce, manifest or envelope context altered**

- Required residue: No unverified plaintext presented as original.
- Degradation: Reject; retain provenance and error classification.
- Observe: Integrity failure; no download acknowledgement.
- Verify: Cross-runtime vectors, bit flips, wrong identity/epoch and binary edge cases.
- Evidence: bounded crypto and binary tests; not security certification.

**S14 — Malformed handoff or version/discriminant mismatch**

- Required residue: Reject incompatible intent before side effects.
- Degradation: Explain unsupported card version; no guessed conversion.
- Observe: Parse/schema/version error.
- Verify: Boundary fuzzing, negative fixtures, Rust/browser version matrix.
- Evidence: partial deterministic tests; fuzz campaign absent.

**S15 — Browser dependency or wallet API changes**

- Required residue: Unsupported behavior cannot silently alter signed intent.
- Degradation: Fail clearly before submission; preserve draft.
- Observe: Provider capability/version failure.
- Verify: Wallet/browser compatibility matrix and pinned dependency review.
- Evidence: open; test signer is not wallet extension evidence.

### A5 — Divergent lifecycle clocks and copies

**S16 — Download succeeds but acknowledgement fails**

- Required residue: Keep verified bytes and exact retryable acknowledgement.
- Degradation: Allow save and acknowledgement retry without new access.
- Observe: Receipt pending; access/ack counters.
- Verify: Abort acknowledgement; retry; compare original bytes.
- Evidence: current browser run: one access, identical bytes.

**S17 — Acknowledgement replay attempts to extend retention**

- Required residue: Same attempt does not create a new retention period.
- Degradation: Return original receipt or reject invalid attempt.
- Observe: Attempt ID and unchanged expiry.
- Verify: Replay before/after deadline and expiry boundary.
- Evidence: bounded current lifecycle tests.

**S18 — Clock jumps, leap day or expiry races with access**

- Required residue: Policy deadline remains explicit and no expired payload resurrects.
- Degradation: Deny due content; retain metadata; expose timer uncertainty.
- Observe: Server expiry timestamp and cleanup lag.
- Verify: Leap-day tests plus clock skew and concurrent ack/cleanup fault cases.
- Evidence: calendar tests pass; skew/concurrency matrix incomplete.

**S19 — Backup restore contains expired ciphertext**

- Required residue: Availability policy survives restoration.
- Degradation: Reapply tombstones/deadlines before serving restored payloads.
- Observe: Expired bytes found during restore audit.
- Verify: Restore old snapshot to isolated instance with advanced clock.
- Evidence: open operational evidence; same-host expiry tested.

**S20 — Downloaded copy outlives hosted expiry**

- Required residue: Do not claim remote revocation or erasure of learned knowledge.
- Degradation: Clarify hosted availability versus recipient copy.
- Observe: Policy copy and user comprehension.
- Verify: Review notices and comprehension test after download.
- Evidence: physical/design boundary; no usability study.

### A6 — Unbounded resource retention

**S21 — Many undownloaded files exhaust storage**

- Required residue: Existing authorized data remains intact; new work fails predictably.
- Degradation: Apply a separately selected quota; do not invent expiry for existing files.
- Observe: Bytes per account, pending uploads, capacity alerts.
- Verify: Load/fault tests at quota and near-full disk.
- Evidence: open quota decision; per-file 10 MB limit is not total quota.

**S22 — Database outage or disk full during mutation**

- Required residue: No acknowledged success without durable commit.
- Degradation: Return unavailable; retain retry context.
- Observe: Persistence failure and commit acknowledgement.
- Verify: Fault before/after commit, restart, exact idempotent retry.
- Evidence: partial persistence tests; outage matrix absent.

**S23 — Abuse or high concurrency on expensive endpoints**

- Required residue: Bound compute/memory and protect established accounts.
- Degradation: Rate-limit admission without discarding valid state.
- Observe: Request rate, memory, queue depth; redacted diagnostics.
- Verify: Bounded resource stress and authorization-before-expensive-work checks.
- Evidence: open hardening evidence.

### A7 — Misleading interface expectations

**S24 — User mistakes recovery backup for public handoff**

- Required residue: Secret recovery material is not encouraged to be shared.
- Degradation: Distinct labels and formats; actionable rejection.
- Observe: Wrong-file import category; no secret telemetry.
- Verify: Wrong-file tests and observed task comprehension.
- Evidence: format separation implemented; usability evidence absent.

**S25 — User interprets download as saved-to-disk**

- Required residue: Receipt semantics and Save original remain distinguishable.
- Degradation: Show verified versus saved action clearly.
- Observe: Verified receipt versus explicit save action.
- Verify: Test interrupted downloads and user comprehension.
- Evidence: current browser save works; comprehension unmeasured.

**S26 — User returns through old workbench or diagnostic UI**

- Required residue: One clear primary console; legacy routes do not imply same recovery guarantees.
- Degradation: Label/link surfaces; retain existing data until migration selected.
- Observe: Entry route and support confusion.
- Verify: Route inventory and regression tests for cross-surface navigation.
- Evidence: three surfaces observed; product consolidation still pending.

### A8 — Evidence and operational context decay

**S27 — Paper or acceptance receipt refers to earlier bytes**

- Required residue: Historical evidence stays intact and dated.
- Degradation: Block stronger current claims; author new evidence epoch.
- Observe: Source digest mismatch.
- Verify: Bind paper claims, implementation and receipts to current snapshot.
- Evidence: observed binding/paper gap in prior audit.

**S28 — Team handoff loses recovery or incident knowledge**

- Required residue: Successor can locate owner, exact source and unresolved operations.
- Degradation: Read-only recovery first; no guessed retry.
- Observe: Missing runbook/owner or unresolved operation.
- Verify: Tabletop handoff without original author; verify stop/recovery decisions.
- Evidence: open organizational evidence.

**S29 — Operator restores wrong DB or deploys second writer**

- Required residue: No production data mutation based on ambiguous environment identity.
- Degradation: Stop on target mismatch; isolate restore rehearsal.
- Observe: Environment/DB identity and writer count.
- Verify: Negative target binding and clean-room restore rehearsal.
- Evidence: open operational controls.

### A9 — Unknown failure handling

**S30 — Previously unclassified combined failure**

- Required residue: No guessed success or duplicate effect; preserve safe diagnostic context.
- Degradation: Stop only affected consequential action; unaffected reads may continue.
- Observe: Unknown classification with operation stage and redacted context.
- Verify: Inject unknown errors at boundaries and verify no false success.
- Evidence: open systematic coverage; conservative controller behavior partial.

## Combined stressors: next experiments

| Combination | Why it matters | Required result |
|---|---|---|
| S01 + S04 + S02: checkpoint response lost, pending account retry, then reload | Durable and in-memory markers can disagree | No duplicate submission; explicit recovery for genuinely unknown status |
| S06 + S07: two tabs and two server instances | Process-local conflict tests do not establish database-wide ordering | Reject stale state at the persistence boundary or prevent a second writer |
| S17 + S18 + S29: expiry, old backup and operator restore | A successful restore can violate the availability policy | Check deadline/tombstone before releasing content |
| S09 + S10: recovery-file loss after suspected compromise | Convenient recovery can retain stolen access | A product-selected recovery/rotation contract with explicit irrecoverable cases |
| S21 + S22 + S23: storage growth, full disk and request burst | Indefinite unaccessed storage can consume capacity needed for recovery | Preserve existing records; bounded rejection of new work; usable diagnostics |
| S24 + S26 + S28: wrong recovery file, legacy console and handoff | Misleading context becomes an operational error | Safe rejection and one clear route to the intended workspace |

These are planned fault experiments, not results from this run. Do not interpret an absent incident as positive evidence.

## Open decisions

1. Recovery-key loss: accept irrecoverability, or design an additional recovery mechanism? Compromise requires a separate rotation decision. No automatic account replacement selected.
2. Undownloaded-file growth: which per-account capacity/admission policy preserves the already-selected “no expiry before first download” promise? A new calendar expiry is not silently introduced.
3. Hosting topology: enforce a single writer, or redesign persistence for multiple writers? The current implementation states a single-writer model.
4. Backup retention: how are deletion deadlines/tombstones applied to restored historical copies, and what retention/RPO/RTO is promised?
5. Product surface: how should old workbench and diagnostic entry points be labeled or retired while preserving existing session data?

These decisions block claims or implementations that depend on them; they do not block independent tests, paper corrections or prototype work.

## Product construction versus operational support

Current frontier: local hosted prototype with repaired pre-submission retry and fresh browser recovery evidence. Runnable product work: model operation-state recovery precisely (A1), add after-commit response-loss and two-tab tests (A1/A2), tighten handoff/backup boundary cases (A3/A4/A7), and update papers with current lifecycle meaning (A5/A8).

Operational support: KEP operations owner must select/enforce writer topology, quotas, clean restore and incident handoff. These affect future public operation; no production environment is touched here. Live finalized two-wallet evidence remains separately scoped. Test databases and /tmp receipts from earlier audit runs are preserved operational residue. Existing acceptance drift remains visible and requires a new candidate epoch before stronger current-conformance claims.

Priority order:

1. Test post-commit response loss and crash recovery; formalize precisely when no effect is known versus uncertain.
2. Select/enforce concurrency boundary and test two-tab conflict recovery.
3. Define recovery loss/compromise and resource/retention policy decisions.
4. Correct paper/overview evidence and freeze the next candidate.
5. Run the relevant EVF paths on that candidate; keep missing environment evidence explicit.

A Rust/Lean target fits A2: stale account revision cannot overwrite a newer committed state. Its assumptions must include the real persistence/writer boundary. A pure in-memory theorem cannot justify multi-process correctness. A1 spans JavaScript, account storage and chain observation, so it needs cross-layer state/trace evidence in addition to any Rust theorem.

## Preservation and outcome

30 stressors, 30 specified degradation behaviors, nine attractor clusters, six combined experiments, five open decisions. Every stressor maps to one owner through its cluster, a desired residue, a signal and a verification task. Structural closure is not behavioral coverage. No readiness upgrade follows.

Historical candidate 013 and the prior 20-path EVF audit remain unchanged. alchLang, unrelated dirty work, accepted records and generated historical views were not edited. Only this new private analysis package was created. No memory updates, publication or transactions occurred.
