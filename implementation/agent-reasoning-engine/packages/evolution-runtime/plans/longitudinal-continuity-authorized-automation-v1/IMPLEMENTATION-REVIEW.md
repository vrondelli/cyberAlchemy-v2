# Implementation Review

Status: bounded fixed-replay implementation validated  
Authority effect: none  
Activation: none

## Verdict

The implementation is fit for the first deterministic milestone. It is not
evidence of prospective effectiveness, full cycle settlement, live VPS/GLM
operation, or production activation.

## Reviewed surfaces

- `src/linked-cycle-benchmark-v1.mjs` implements typed longitudinal preference
  events, scope-aware projection, fail-closed lineage checks, the four-outcome
  automation controller, frozen fixtures, and deterministic scoring.
- `src/linked-cycle-first-milestone-v1.mjs` writes immutable evidence, settles
  only the reviewed coordinator frontier, and verifies restart and SQLite-index
  loss recovery.
- `bin/linked-cycle-first-milestone.mjs` exposes a closed JSON input boundary.
- `test/linked-cycle-first-milestone-v1.test.mjs` covers replay, tampering,
  revocation precedence, automation outcomes, sealing, and recovery.

The candidate is intentionally not exported from the package's public index.
Doing so changed historical source-bound H-EN evidence, so the dedicated module
and CLI remain the correct experimental boundary.

## Validation evidence

- Complete evolution-runtime suite at the first fixed-replay milestone: 150
  passed, 0 failed. The later shadow implementation raises this to 155 tests.
- Receipt integrity: all 14 referenced artifact hashes match their files.
- Clean-runtime reproduction: result digest and receipt digest reproduced
  exactly in `/tmp/are-linked-validation.MkfD01`.
- Coordinator restart parity: true.
- SQLite-index-loss recovery parity: true.
- Privacy scan: no raw reasoning, conversation text, message text, tool
  payload, credential, environment dump/value, or secret-like value was found
  in the JSON evidence tree.
- Production-default generic cycle definitions remain non-runnable, as covered
  by the full regression suite.

## Corrections made during review

1. A newer global preference revocation now dominates an older scoped
   exception.
2. Expired authorization produces `stop` rather than execution.
3. Risk fixtures now cover high risk, environment mismatch, and an unknown
   non-idempotent or uncompensatable effect.
4. Mixed preference lineage, duplicate events/sequences, and tampering fail
   closed.
5. Cycle 2 exposes `aa.accept-handoff` as its next frontier instead of claiming
   completion.
6. Baseline identities are explicit in the result records.

## Residual risks

- The fixture author and implementation author are not independent.
- The candidate was evaluated on deterministic synthetic fixtures, so the
  scores do not estimate real-user effectiveness.
- Cycle 1 still needs shadow and prospective evaluation.
- Cycle 2 still needs an accepted typed handoff before linked treatment.
- No remote provider, VPS dispatch, standing grant, or real external effect was
  exercised.

## Open Questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md). The immediate product frontier is
the revised Cycle 1 shadow collection. VPS/GLM operation is owned by a separate
thread and remains outside this frontier.
