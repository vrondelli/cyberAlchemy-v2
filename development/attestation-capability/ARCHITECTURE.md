---
node_type: design
is_session: false
status: candidate
boundary: INTERNAL — moat-adjacent (mechanism private; results demonstrable)
created: 2026-06-29
authored_by: invoke (mode=design)
owner_next: sigil-development
scope: design for the MVP rung (L1 integrity seal) + the runnable verifier; L2 sketched, not designed in full
note: Paths are repo-root-relative from domainspec-core/. claim ≤ proof — this designs the MVP, not the moat rung.
---

# Attestation / Signer Capability — ARCHITECTURE (design)

Designs the **MVP rung (L1 integrity seal)** and the **runnable verifier** that the SPEC pins.
L2 (external signature) is sketched at the end as the next rung — **not** fully designed here
(claim ≤ proof: we design what the MVP needs, and name the moat-rung shape without committing its
internals on paper, per the cite-results-withhold-mechanism boundary).

## What is being designed (and what is not)
- **Designed:** the attested-tuple shape, the canonicalization rule, the `attest` (seal) step, the
  `verify` (recompute + compare) checker, the specimen, and the verdict surface — i.e. everything
  that makes L1 a *runnable* tamper-check.
- **Not designed here (next owner / next rung):** L2 key/identity management, the signing scheme,
  the published external verification procedure. Sketched only.

## The attested tuple (the object both rungs seal)
```
AttestedTuple = {
  actor:          identity-ref      // the ratifying owner (+ producing capability, e.g. mint)
  act:            { kind, id }      // kind ∈ {decision, promotion, mint}; id = the act's record id
  artifact_state: canonical-bytes   // the exact ratified content, canonicalized (see below)
  timestamp:      iso-8601
}
```
The whole point is that `artifact_state` is pinned to **exact bytes** so a later edit is detectable.

## Canonicalization (the load-bearing rule)
A seal is only meaningful if "the same artifact" always hashes the same way. So the MVP fixes **one
canonicalization rule** applied before hashing:
- normalize the artifact-state to a deterministic byte form (fixed encoding, fixed newline/whitespace
  policy, fixed field order for the tuple's structured parts);
- the rule is **frozen and versioned** (`canon_version`) so verify uses the same rule that attest used.

Design constraint inherited from the owned verifier discipline (`AgentPermissionKernel.lean`): the
**verifier's pass-condition must be defined independently and pinned**, so "verify = valid" is a
sound statement. Here that means: `verify` recomputes the seal from the *claimed* state by the *same
frozen canon rule + hash*, and `valid` means *byte-for-byte seal match* — nothing softer.

## L1 — `attest` (the seal step, MVP)
```
attest(governance_act, actor, ts):
  state   := canonicalize(governance_act.ratified_content, canon_version)
  tuple   := { actor, act := ⟨governance_act.kind, governance_act.id⟩, artifact_state := state, timestamp := ts }
  seal    := H( canon_version ‖ serialize(tuple) )        // owned content-hash primitive
  return AttestationArtifact { tuple-header (actor, act, timestamp, canon_version), seal }
```
- `H` = the owned content-hash primitive (mechanism withheld in public surfaces).
- The artifact is **committed alongside the governance record** (e.g. next to the decision/mint record),
  so the attestation travels with the act and lands in git history (preserving L0's attribution as the
  base layer, now *plus* a tamper seal).

## The verifier — `verify` (the runnable third-party checker, the differentiator)
```
verify(attestation_artifact, claimed_state):
  state'  := canonicalize(claimed_state, attestation_artifact.canon_version)
  tuple'  := rebuild_tuple(attestation_artifact.header, state')
  seal'   := H( attestation_artifact.canon_version ‖ serialize(tuple') )
  if seal' ≠ attestation_artifact.seal:  return tampered          // L1 verdict
  // L2 (next rung): verify signature over seal against actor identity → bad-signature | unknown-actor
  return valid
```
Verdicts: `valid | tampered` at L1; `+ bad-signature | unknown-actor` at L2.

**Design discipline (from the owned sound-verifier template):**
- `verify` is **decidable and total** — every input yields one verdict, no "probably".
- `verify`'s `valid` condition is **defined independently** of `attest` (it recomputes from claimed
  state; it does not trust the artifact's own copy of the state) — this is the analogue of
  `decidePolicy` being defined independently of `Satisfies`, with the match being the load-bearing
  soundness statement (`decidePolicy_allow_iff`). The attestation analogue: *verify says valid ⇒ the
  claimed state is exactly the attested state* (no false `valid`). That soundness statement is the
  one to pin (and, longer-horizon, the candidate to machine-check — but that is amplifier, not MVP).

## The specimen (mandatory — this is the Kodamai-lesson deliverable)
The MVP must ship a **checked-in specimen attestation** + a **demonstrable verify run**, because the
whole differentiator is *demonstration over assertion*:
- a real attested governance act (e.g. an attestation over an existing `authority/decisions/*.md`),
- a `verify → valid` run on the unmodified state,
- a `verify → tampered` run on a one-byte-mutated state.
Without the specimen + runnable verify, this capability would be exactly the assertion-without-checker
posture the Kodamai synthesis flags. The specimen is the proof the verifier exists.

## L2 — external signature (the moat rung; sketched, not designed)
Next rung, deliberately under-specified here (mechanism stays private):
- bind **actor identity** to the seal via a signature (`sign(seal, actor_key)`);
- publish a **verification procedure** a third party runs to confirm the actor (identity binding +
  `verify_sig`), yielding `bad-signature | unknown-actor` in addition to `tampered | valid`.
- This is the genuinely net-new work and the auditor-accepted wall; it is **intended-not-shipped**.

## Boundary in the architecture
- **Demonstrable (results):** the specimen, the verdict surface, a passing/tampered verify run.
- **Withheld (mechanism):** the canon rule internals, the hash construction, the serialization, and
  (at L2) the signing/identity scheme — private, per `2026-06-24-engine-moat-and-free-paid-boundary.md`.

## Open design questions (for sigil-development)
- Which hash/canonicalization primitive (owned choice) — and how `canon_version` is governed.
- Where the attestation artifact is stored relative to the governance record (inline vs sidecar file).
- Whether L1's soundness statement should be machine-checked now (amplifier) or after L2.
- L2 actor-identity model: per-owner key vs an org identity; how a third party obtains the public identity.
