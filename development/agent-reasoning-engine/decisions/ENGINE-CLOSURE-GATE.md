# Agent reasoning engine — closure decision gate

Status: **BLOCK — POLICY SELECTION COMPLETE**<br>
Target: policy readiness and evidence-closure routing across `WP-ARE-001`<br>
Opened: `2026-07-22T13:40:22-03:00`<br>
Decision authority: human project gatekeeper; personal identity not asserted

This record separates policy decisions that a human can resolve from gaps that
close only when their specified evidence exists. A policy choice never stands
in for an executable witness, experiment, operational test, or efficacy result.

## Decision inventory

1. Authority and applicability policy.
2. Challenge closure and late-material-defeat policy.
3. Fixed test-only effect envelope, gate, and idempotency policy.
4. Artifact durability and admission policy.
5. Incident and compensation policy.
6. Private interface and rollout policy.

## D1 — authority and applicability policy

- **Question:** Which finite policy controls applicability, exceptions,
  authority ambiguity, temporal invalidity, and rule conflicts?
- **Options considered:**
  - A — typed fail-closed policy preserving distinct terminal outcomes;
  - B — strict rejection policy mapping most defects to
    `UnauthorizedCatalog`;
  - C — evidence-first policy mapping most uncertainty to
    `Deferred.Insufficient`.
- **Selected:** A — typed fail-closed policy.
- **Source:** explicit user selection `A` after the complete owner-level policy
  was presented in the active Decision Gate.
- **Rationale:** the user selected the recommended policy; no additional
  rationale was asserted.
- **Recorded:** `2026-07-22T13:40:22-03:00`.
- **Finite rules:**
  1. Applicability and exceptions require explicit catalog selectors and
     deterministic predicates; the evaluator does not infer a match.
  2. Missing mandatory evidence returns `Deferred.Insufficient`.
  3. No registered rule for the conclusion domain returns `OutOfDomain`.
  4. Missing, circular, or self-appointed authority and unresolved applicable
     rule conflicts return `EscalateOwner`.
  5. An expired or revoked catalog returns `UnauthorizedCatalog` during a fresh
     evaluation.
  6. Expiry or revocation discovered by current revalidation returns
     `Invalidated` without rewriting the historical result.
- **Downstream impact:** closes the policy-choice portion of
  `BLK-ARE-APP-001`; the blocker remains open until this policy is emitted as a
  complete versioned owner record and independently boundary-reviewed.

## D2 — challenge closure and late-material-defeat policy

- **Question:** Which finite policy closes required challenge lanes and handles
  material defeaters that arrive after initial closure?
- **Options considered:**
  - A — bounded fail-closed closure with typed timeout, dispute, revalidation,
    and incident routes;
  - B — route every incomplete, disputed, or late challenge to an owner;
  - C — treat the challenge window as final and apply late evidence only to
    future requests.
- **Selected:** A — bounded fail-closed closure.
- **Source:** explicit user selection `A` after the complete owner-level policy
  was presented in the active Decision Gate.
- **Rationale:** the user selected the recommended policy; no additional
  rationale was asserted.
- **Recorded:** `2026-07-22T18:56:19-03:00`.
- **Finite rules:**
  1. The frozen plan assigns every required challenge lane a finite deadline
     and attempt limit.
  2. A required-lane timeout or failure returns `Deferred.Insufficient` and
     produces zero effect calls.
  3. A material dispute that cannot be resolved by the frozen deterministic
     policy returns `EscalateOwner`.
  4. A material defeater admitted before the exact-effect gate cancels the
     pending recommendation and requires reevaluation.
  5. A material defeater admitted after an effect attempt cannot rewrite the
     historical receipt. Current revalidation emits `Invalidated` under a new
     run and opens an incident/compensation owner route.
  6. Late defeat never triggers automatic compensation.
- **Downstream impact:** closes the policy-choice portion of
  `BLK-ARE-CHAL-001`; the blocker remains open until this policy is emitted as a
  complete versioned owner record and independently boundary-reviewed.

## D3 — fixed test-only effect, gate, and idempotency policy

- **Question:** Which test-only contract witnesses the zero-or-one-effect
  boundary without authorizing a real effect?
- **Options considered:**
  - A — append one immutable synthetic recommendation marker to a dedicated
    in-memory test log under an exact gate and idempotency contract;
  - B — mutate and roll back temporary local state;
  - C — emit only a receipt and perform no test-double effect attempt.
- **Selected:** A — immutable test marker.
- **Source:** user response `1`, meaning the first option in the immediately
  preceding Decision 3 prompt.
- **Rationale:** no additional rationale was asserted.
- **Recorded:** `2026-07-22T19:42:02-03:00`.
- **Fixed envelope and finite rules:**
  1. The only action is `record_test_recommendation` against a dedicated
     in-memory test effect log.
  2. The subject binds exactly one `run_id`, `RecommendedUnderSnapshot`
     reasoning-receipt digest, authority-snapshot digest, and fixed-envelope
     digest.
  3. A one-run exact-effect gate must return `pass` for those identical digests
     after the reasoning receipt has persisted. Any non-pass verdict, missing
     digest, or mismatch produces zero test-double calls.
  4. The idempotency key is the SHA-256 digest of canonical JSON containing the
     action, target, run ID, reasoning-receipt digest, authority-snapshot digest,
     and fixed-envelope digest.
  5. Repeating identical content returns the prior logical result without a
     second marker. Reusing the key with different content returns
     `IdempotencyConflict` with zero new calls.
  6. The marker is synthetic and immutable. It creates no external effect and
     authorizes no real rollback or compensation behavior.
- **Downstream impact:** closes the policy-choice portion of
  `BLK-ARE-EFFECT-001`; the blocker remains open until this contract is emitted
  as a complete versioned owner record and independently boundary-reviewed.

## D4 — artifact durability and admission policy

- **Question:** Which storage and authority posture governs reasoning receipts
  and journals?
- **Options considered:**
  - A — immutable content-addressed private local candidate store;
  - B — ephemeral run storage deleted after testing;
  - C — managed external database or object storage.
- **Selected:** A — private local candidate store.
- **Source:** explicit user selection `A` after the complete Decision 4 options
  were presented. An earlier unmatched `A` was explicitly excluded.
- **Rationale:** the user selected the recommended policy; no additional
  rationale was asserted.
- **Recorded:** `2026-07-22T19:45:01-03:00`.
- **Finite rules:**
  1. Records are immutable, content-addressed, private, and local to the
     candidate implementation.
  2. Publication uses temp-write, byte sync, atomic publish, parent metadata
     sync, and post-publish digest verification.
  3. Partial, corrupt, digest-mismatched, and unknown-version objects are
     quarantined and never admitted as valid inputs.
  4. Successful recovery admits only complete immutable records whose exact
     bytes match their recorded digest.
  5. Records remain local evidence and acquire no canonical, public, semantic,
     or authority status from persistence.
  6. Retention lasts through the relevant gate review. Deletion requires an
     explicit owner decision and a deletion receipt; no silent cleanup is
     permitted for admitted gate evidence.
- **Downstream impact:** closes the owner-policy portion of
  `GAP-ARE-ARTIFACT-DURABILITY`; the gap itself remains open until
  `SWU-ARE-006` passes crash, corruption, recovery, and digest tests.

## D5 — incident and compensation policy

- **Question:** Which policy governs persistence failure, ambiguous delivery,
  late material defeat, and compensation?
- **Options considered:**
  - A — fail closed, persist an incident, and require a separately authorized
    compensation action;
  - B — automatically attempt a predefined inverse action;
  - C — persist the incident without defining a governed compensation route.
- **Selected:** A — fail closed and require new authorization.
- **Source:** explicit user selection `A` after the complete Decision 5 options
  were presented.
- **Rationale:** the user selected the recommended policy; no additional
  rationale was asserted.
- **Recorded:** `2026-07-22T19:50:11-03:00`.
- **Finite rules:**
  1. Receipt-persistence failure closes the run incomplete with zero effect
     calls.
  2. Ambiguous delivery creates an incident and prohibits blind retry.
  3. Late material defeat preserves the historical record and produces a new
     `Invalidated` result under current revalidation.
  4. Compensation is never automatic. It requires a new explicit intent,
     independently authorized exact effect envelope, owner gate, and
     idempotency key.
  5. Missing or ambiguous incident ownership returns `EscalateOwner`.
  6. Every incident and later compensation decision binds the relevant
     historical digests without mutating prior receipts.
- **Downstream impact:** closes the policy-choice portion of
  `BLK-ARE-INCIDENT-001`; incident readiness remains open until `SWU-ARE-007`
  passes failure, ambiguity, late-defeat, and owner-route fixtures.

## D6 — private interface and rollout policy

- **Question:** Which private interface and rollout posture applies after L2?
- **Options considered:**
  - A — versioned private interface with staged shadow and canary rollout;
  - B — offline private local CLI only;
  - C — bounded private network-service canary.
- **Selected:** B — private local CLI only.
- **Source:** explicit user selection `B` after the complete Decision 6 options
  were presented.
- **Rationale:** no additional rationale was asserted.
- **Recorded:** `2026-07-22T19:51:16-03:00`.
- **Finite rules:**
  1. The candidate exposes only a versioned private local CLI; it opens no
     network listener and accepts no remote traffic.
  2. The CLI preserves typed outcomes, digests, complete gate records, and
     non-authority metadata.
  3. Unknown versions, missing authorization, envelope mismatch, and any real
     effect request fail closed.
  4. Invocation is manual and offline. Shadow deployment, canary deployment,
     public release, and real effects are outside the selected scope.
  5. Historical records remain immutable when the CLI is disabled or removed.
- **Downstream impact:** closes the interface-scope choice in
  `BLK-ARE-ROLLOUT-001` by selecting no rollout. It does not close
  `GAP-ARE-ROLLOUT-READINESS`; that evidence is deferred unless a future gate
  authorizes rollout scope.

## Emitted owner policy records

- [Authority and applicability policy](implementation-readiness/APPLICABILITY-POLICY-v1.md)
- [Challenge closure policy](implementation-readiness/CHALLENGE-CLOSURE-POLICY-v1.md)
- [Test-only effect policy](implementation-readiness/TEST-EFFECT-POLICY-v1.md)
- [Artifact durability and admission policy](ARTIFACT-ADMISSION-POLICY-v1.md)
- [Incident and compensation policy](INCIDENT-COMPENSATION-POLICY-v1.md)
- [Private interface and rollout policy](PRIVATE-INTERFACE-ROLLOUT-POLICY-v1.md)

## Evidence-producing closure inventory

These items remain open after policy selection:

| Gap | Closure requires |
|---|---|
| `GAP-ARE-SEMANTIC-WITNESS` | execute and pass `SWU-ARE-001` counterfactual, replay, ordering, and zero/one-effect tests |
| `GAP-ARE-ARTIFACT-DURABILITY` | owner policy plus passing `SWU-ARE-006` crash, corruption, recovery, and digest evidence |
| `GAP-ARE-INCIDENT-READINESS` | owner policy plus passing `SWU-ARE-007` degraded/incident fixtures |
| `GAP-ARE-ROLLOUT-READINESS` | owner policy plus passing `SWU-ARE-008/009` interface, security, load, privacy, rollback, and manual rollout review |
| `GAP-ARE-INTENT-EVIDENCE` | revision-bearing intent experiment and inter-rater evidence under an intent-contract owner |
| `GAP-ARE-ANTI-BIAS-EFFICACY` | governed intervention protocol and comparative efficacy evidence; no claim closes by policy choice alone |

## Deferred decisions and assumptions

- Deferred decisions: none.
- Existing reversible assumption: L0 uses Node 22 ESM and standard-library-first
  deterministic code unless the plan is explicitly revised.

## Current result

- Policy decisions resolved: 6 of 6.
- Policy decisions remaining: 0.
- Versioned owner policy records emitted: 6 of 6.
- Independent owner/boundary review: pending.
- Evidence gaps closed: 0 of 6.
- Result: **BLOCK**.
- Next step: independently boundary-review the owner records, then authorize a
  bounded Task Session for `SWU-ARE-001`; do not claim evidence gaps closed.
