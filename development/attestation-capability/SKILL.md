# Sigil: Attestation / Signer

<objective>
Upgrade a cav2 "signed governance act" from an attributional, git-attributed markdown record into a
**verifiable attestation**: seal the `⟨actor, act, artifact-state, timestamp⟩` tuple so any later edit
is detectable, and ship a **runnable third-party `verify` checker** whose `valid` verdict is a sound
statement (claimed state = attested state), not a vibe. The differentiator is *demonstration over
assertion*: a specimen + a checker someone can run.
</objective>

<logic-type>
Arcana: governance/moat infrastructure — a sound, decidable verifier over a sealed governance tuple,
with a deliberate cite-results-withhold-mechanism boundary. Private cav2 capability; intended-not-shipped;
promotes nothing.
</logic-type>

<boundary>
INTERNAL, moat-adjacent. **Demonstrable (results):** the specimen attestation, the verdict surface, a
passing `verify` run, a tamper-detected `verify` run. **Withheld (mechanism):** the canonicalization
rule internals, the hash construction, the serialization, and (at L2) the signing/identity scheme —
private, per [2026-06-24 engine-moat decision](../../authority/decisions/2026-06-24-engine-moat-and-free-paid-boundary.md).
Never leak into public `arcanum/`.
</boundary>

<applicability>
Use to attest a consequential, owner-ratified cav2 act (kind ∈ {decision, promotion, mint}) and to
verify an attestation against a claimed artifact state. Continue from the invoke handoff (this folder).
NOT for: public Arcanum sigils; non-consequential acts; asserting the L2 external-signature guarantee
before it is built.
</applicability>

<inputs>
`governance_act` = `{ ratified_content, kind ∈ decision|promotion|mint, id }`; `actor` (ratifying
identity); `timestamp` (iso-8601). For `verify`: an `attestation_artifact` + a `claimed_state`.
</inputs>

<process>
The contract is `attest(governance-act) → artifact` and
`verify(artifact, claimed-state) → { valid | tampered | bad-signature | unknown-actor }`.

1. **Canonicalize (the load-bearing rule).** Normalize the artifact-state to a deterministic byte form
   (fixed encoding, newline/whitespace policy, field order) under a frozen, versioned `canon_version`,
   so "the same artifact" always hashes the same way and `verify` uses the rule `attest` used.
2. **L1 — `attest` (the seal, MVP — buildable).** Build the tuple
   `{ actor, act:⟨kind,id⟩, artifact_state:=canonicalize(content,canon_version), timestamp }`, compute
   `seal := H(canon_version ‖ serialize(tuple))` with the owned content-hash primitive, and emit
   `AttestationArtifact{ header(actor,act,timestamp,canon_version), seal }`. Commit it **alongside** the
   governance record (preserves L0 git attribution as the base layer, now + a tamper seal).
3. **`verify` (the runnable third-party checker — the differentiator).** Recompute from the *claimed*
   state by the *same* frozen canon rule + hash; if `seal' ≠ artifact.seal → tampered`, else `→ valid`.
   `verify` is **decidable and total** (every input → exactly one verdict, no "probably") and its `valid`
   condition is **defined independently** of `attest` (it does not trust the artifact's own copy of the
   state — it recomputes). This inherits the owned sound-verifier discipline (see *Origin*).
4. **Specimen (mandatory).** Ship a checked-in specimen attestation over a real cav2 decision record + a
   demonstrable `verify → valid` (unmodified) and `verify → tampered` (one-byte mutation) run. Without
   the specimen + runnable verify, the capability is exactly the assertion-without-checker posture the
   Kodamai synthesis flags.
5. **L2 — external signature (the moat rung; deferred-moat, intended-not-shipped).** Bind actor identity
   to the seal via `sign(seal, actor_key)` + a published verification procedure yielding
   `bad-signature | unknown-actor`. Do NOT start until the L2 actor-identity model is decided; do NOT
   describe it as built.
</process>

<quality-bar>
A successful execution of this sigil must:
- **(THE LOAD-BEARING ONE — the discriminating self-test)** demonstrate a `verify` that *distinguishes*:
  **`verify(attest(x), x) = valid` AND `verify(attest(x), tampered(x)) = tampered`** on a real fixture. A
  verifier that cannot tell an untampered state from a mutated one is **vacuous** — it proves nothing. The
  specimen must show BOTH arms (the positive AND the negative control), not a self-confirming demo;
- pin the **soundness statement**: `verify` says `valid ⇒ the claimed state is exactly the attested state`
  (no false `valid`) — the analogue of the owned kernel's `decidePolicy_allow_iff`;
- keep `verify` **decidable + total** (one verdict per input) and its `valid` condition **independently
  defined** (recompute from claimed state; never trust the artifact's own state copy);
- freeze + version the canonicalization rule (`canon_version`) so attest and verify agree by construction;
- hold **claim ≤ proof**: L0 owned, L1 the buildable MVP, **L2 intended-not-shipped** (the net-new moat);
- hold the boundary: demonstrate verification *results*, withhold the *mechanism*;
- carry experiment-harness evidence (the specimen run, or a named block) before any promotion-readiness claim.
</quality-bar>

<anti-patterns>
Avoid:
- **vacuous verify** — a `verify` that always returns `valid` (or otherwise cannot distinguish `x` from
  `tampered(x)`): it FAILS the discriminating self-test and proves nothing;
- **claiming L2/external-signature is shipped** — L2 (actor-identity signature + published procedure) is
  the genuinely net-new moat work; never describe it as built;
- **"signed" collapsing back to attributional** — letting the attestation degrade into the L0 owner-line +
  git-attribution record it is *meant to upgrade* (a seal nobody recomputes = a convention, not an attestation);
- **trusting the artifact's own state copy** — verifying against the state the artifact carries instead of
  recomputing from the *claimed* state silently defeats tamper-detection;
- **leaking the mechanism** — pasting the canon rule, hash construction, serialization, or L2 scheme into
  any public surface (the moat is the mechanism; only results are demonstrable).
</anti-patterns>

<observability>
Meaningful execution = an `attest` producing an artifact, or a `verify` producing a verdict. Emit
telemetry (to a future `cyberAlchemy-v2/development/attestation-capability/development/telemetry/` or the
repo observability package): mode; act kind/id; rung exercised (L1/L2-deferred); `verify` verdict
(valid|tampered|bad-signature|unknown-actor); **discriminating-self-test result** (both arms pass?);
canon_version; specimen present?; mechanism-leak detected. Reflection trigger: a `verify` that returns
`valid` on a tampered fixture, or always-`valid`, is a **severe gap** (immediate reflection) — it is the
contract's load-bearing failure (vacuous verifier).
</observability>

<output-contract>
Return: the act attested (kind, id); rung exercised (L1) + deferred (L2); the **discriminating self-test
result** (`verify(attest(x),x)=valid` AND `verify(attest(x),tampered(x))=tampered` — both arms);
canon_version; specimen path; the `verify` verdict surface; blocks; next route.
</output-contract>

<origin>
Authored by `invoke` (define→design→handoff, this folder); lifecycle owner: `sigil-development`.
**Build-from-owned (verify template):** the sound-decidable-judgment discipline in
[`domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean`](../../../domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean)
— `decidePolicy` defined *independently* of `Satisfies`, with `decidePolicy_allow_iff` (sound+complete)
and `decidePolicy_sound` (the `→` half) machine-checked. The attestation `verify` inherits that posture:
an independently-defined decidable check whose pass-condition is pinned (Victor Boscaro, Apache 2.0).
**Owned L0:** the decision-record convention + git attribution. **Owned primitive (L1):** content-hash
(own the wiring, not novelty). **Net-new (L2):** binding external actor identity to the sealed tuple via
signature + a third-party-runnable verification procedure. Next: `task-session` for the L1 integrity-seal
SWU (`attest` + `verify` + specimen). Gates Mint L2.
**Planned 2nd specimen (CANDIDATE — not built; claim ≤ proof):** the body-war TROQAR zone-control
resolution (`projects/body-war/development/refinement-runs/20260629-troqar-score-authority/`) — a runnable,
non-cav2 specimen whose negative control is a late-arriving in-window activity. It would demonstrate the
discriminating verify's *generality* on a playable artifact (a claim DISTINCT from the Mint N=3 foundry-H).
It reuses this pattern (content-hash + the kernel template), not this cav2-scoped sigil.
</origin>
