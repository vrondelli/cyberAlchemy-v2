# Task Session — Attestation L1 integrity-seal SWU

runtime: local
adapter: none
task: attestation-capability L1 (attest + verify + mandatory specimen)
result: PASS
mode: direct bounded execution (no --via runtime; no subagents)

## What was built
- `attest.py` — the L1 implementation: `attest(act) → {header, artifact_sha256, seal}` and
  `verify(artifact, claimed) → valid|tampered`. Decidable + total; recomputes from the claimed
  state (never trusts an embedded state copy); frozen `canon_version = attest.canon.v1`. INTERNAL
  (mechanism private).
- `development/specimen/attestation.json` — the mandatory checked-in specimen (over a real cav2
  decision record).
- `development/specimen/DEMO.md` — the demonstrable results (the discriminating self-test).

## Validation (done criteria)
- **Load-bearing discriminating self-test — PASS:** `verify(attest(x), x) = valid` AND
  `verify(attest(x), content-mutated(x)) = tampered` on a real fixture (arms A1, A2).
- Controls: A1b (trailing-whitespace variant → valid — canon does real work); A3 (attestation's
  own hash swapped → tampered — seal integrity).
- Soundness held: `valid ⇒ claimed canonical state == attested state` (no false valid, modulo SHA-256).
- Boundary held: results demonstrated; mechanism withheld to the private `attest.py` (cite-results-withhold-mechanism).

## Gate verdict
No blockers. canon/hash were non-blocking implementation choices (sha256 over a frozen canon rule).
No consequential/policy decision → no decision-gate needed.

## Experiment harness
status: pass — the specimen run shows BOTH arms (positive + negative control); the golden fixture
("none exists yet" in HARNESS) is now produced. This is the L1 MVP rung; NOT the L2 guarantee.

## Remaining blockers / follow-up
- **L2 (external signature) — deferred-moat**, intended-not-shipped. Open question: the actor-identity
  model (routed in HANDOFF) must be decided before L2.
- **Unblocks Mint L2:** Mint's signed decision-gate stage (SWU-4) can now call `attest(mint-act)` to
  seal the mint governance record. The Mint L1-attributional placeholder can be upgraded to a real seal.

lifecycle_owner_next_step: sigil-development (promotion-readiness review of the L1 MVP) OR task-session for Mint SWU-4 (now unblocked).
