**PASS — bounded independent code and evidence review. No confirmed actionable findings.**

- Reviewer: native helper `/root/r08_reviewer`, independent of the R03–R07 candidate and test authorship.
- Candidate: `DSV2-R07-LOCAL-RECOVERY-PRODUCT-001`.
- Product-test manifest SHA256: `f7068d6ecd0ae4208b792804fcf502a1b25502309913eaa32c7b88b3138d47aa`.
- Source currentness: all 104 manifest-bound files matched before and after probes; candidate manifest unchanged.
- Findings by severity: none.
- Authority effect: none. Product approval remains the owner’s separate decision.

The coordination implementation’s shared `_write` transaction checks expected version, current claim/fence, latest lease generation, and lease validity; joins changed state, transition, and outbox; and rechecks time before COMMIT. Takeover marks unfinished attempts unknown before replacement work. The Operation adapter atomically joins business changes, successful invocation evidence, and its outbox. Replay checks stable identity and exact binding/payload digests. Recovery rereads durable results before selecting retry or terminal handling, retains attempt budgets and schedules across reopen, and rechecks Operation evidence before projecting completion.

Primary inspected implementation locations:

- `r03-recovery-v1/store.py:217` — transaction, CAS, fencing, and pre-COMMIT authorization.
- `r03-recovery-v1/store.py:287` — takeover and unknown-attempt preservation.
- `r03-recovery-v1/store.py:384` — terminal eligibility and atomic semantic projection.
- `r04-recovery-v1/ledger.py:150` and `:186` — recorded-result validation and atomic application.
- `r05-recovery-v1/worker.py:107` — attempt/invocation separation and late-result handling.
- `r06-recovery-v1/recovery.py:114` and `:147` — durable evidence validation, restart, retries, and terminal orchestration.

These paths are relative to `/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/development/completion-dag/v1/evidence/`.

Every scenario mapping was compared with its actual assertions and recorded observations:

| Scenario | Review assessment |
|---|---|
| F01 | PASS: planner/registration leaves callback count and attempts zero; worker subsequently invokes. |
| F02 | PASS with scope note: identical registration remains one dispatch; mapped mismatch changes binding payload. Independent probe additionally rejects a valid alternative plan for the same failure. |
| F03 | PASS: stored plan mutation rejects on reopen without further changes. |
| F04 | PASS: repeated Operation has distinct occurrence/invocation identities and two applications. |
| F05 | PASS: missing/unavailable later binding prevents claim and first invocation. |
| F06 | PASS: competing expected-version acquisitions yield one commit; stale version rejects. |
| F07 | PASS: SIGKILL checks cover coordination/outbox, progress, schedule, terminal, and acknowledgement boundaries. |
| F08 | PASS: second-occurrence crash/retry retains the completed prefix. |
| F09 | PASS: two processes produce one current claim and no acquisition-created attempt. |
| F10 | PASS: two replacements increase fences to 1, 2, 3 with one current claim. |
| F11 | PASS: exact expiry and superseded claim reject without advancement. |
| F12 | PASS: renewal replaces generation; prior generation rejects; renewal creates no attempt. |
| F13 | PASS for tested schedule: business result commits, worker pauses, replacement reconciles, old worker’s outcome rejects. |
| F14 | PASS: acquire/renew create no attempt; two starts receive distinct IDs/consecutive numbers. |
| F15 | PASS: killed attempt retries under replacement ownership with stable intent/invocation identity. |
| F16 | PASS: crash between commits reconciles one business application and one Operation event. |
| F17 | PASS: injected exact expiry after business invocation yields unknown; expiry before start produces no effect. |
| F18 | PASS: persisted delay and budget survive reopen; three starts lead to exhaustion without a fourth. |
| F19 | PASS: binding replacement after failure rejects while original state remains. |
| F20 | PASS: all four disposition fixtures reject direct subsequent start/schedule; only completed projects satisfied. |
| F21 | PASS: Operation rollback/SIGKILL protects all local participants; source inspection confirms business writes remain adapter-owned. |
| F22 | PASS: actual killed process/fresh process resumes prefix; terminal reopen performs no work. |
| F23 | PASS: missing Operation evidence yields unknown and prevents schedule/completion; no fabricated terminal. |
| F24 | PASS: acknowledged-event replay and Operation replay preserve one application. |
| F25 | PASS: failed attempts retain required semantics; terminal exhaustion projects unresolved separately. |
| F26 | PASS, formation only: concern-specific bindings form and universal Port rejects. |
| F27 | PASS: formation explicitly claims no runtime guarantee; selected store reopen verifies persisted identity and resource mismatch preservation. |
| F28 | PASS: separate database commit faults and between-commit crash demonstrate local atomicity and reconciliation. |
| F29 | PASS: injected retryable classification follows explicit escalation/retry selection rather than selecting retry itself. |
| F30 | PASS: missing replay/clock/version contracts and schema/boot/clock mismatches reject; no terminal fabricated. |

Freshly executed verification:

```text
python3 -B projects/domainspec-v2/development/completion-dag/v1/evidence/r07-recovery-v1/verify.py
{"verification":"PASS","node":"R07","scenarios":30,"executions":60,
 "replay":"isolated processes, same authored tests","product_approved":false}
```

Independent reproduction artifacts:

- [Probe source](/tmp/r08-independent-review-probes.py)
- [Exact probe output](/tmp/r08-independent-review-probes-output.json)
- Reproduction: `python3 -B /tmp/r08-independent-review-probes.py`

The probes confirmed rejection of valid changed-plan resubmission and rollback when expiry occurs at the pre-COMMIT check. A reader-lock probe also demonstrated that a final check at time 4999 can precede COMMIT completion at time 5000, when the lease expires. This is **an observed timing limit, not a confirmed violation**: the selected R01 rule specifies authorization and an immediate pre-COMMIT recheck, not a physical COMMIT-completion deadline. Claims must preserve that distinction.

Review limits: the full campaign was not rerun; its 60 recorded executions were checked against the bound harness and source. F13’s mapped pause is after the business commit, and F17 uses injected expiry rather than process death; other mapped scenarios supply actual SIGKILL evidence. These results do not exhaust concurrent interleavings or establish cross-boot, multi-host, power-loss, production, or universal exactly-once guarantees. Repository files were not modified.
