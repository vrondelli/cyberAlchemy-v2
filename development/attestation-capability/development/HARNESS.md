# Attestation / Signer — experiment harness

**Status:** **L1 PASS** — the low-regime specimen and discriminating controls are complete; medium,
complex, and all L2 controls remain future work. Owner: `sigil-development` + `experiment-harness`.
INTERNAL; promotes nothing; L2 intended-not-shipped. Evidence:
[`TASK-SESSION-L1.md`](./TASK-SESSION-L1.md) and [`specimen/DEMO.md`](./specimen/DEMO.md).

## Falsification target (the gate the capability must pass) — the discriminating verify
The whole capability stands or falls on one **falsification-style self-test**: a `verify` that
*distinguishes* an untampered state from a mutated one. It is a real pass/fail, not a self-confirming
demo. For a fixture `x`:

- **positive arm:** `verify(attest(x), x) = valid`
- **negative control:** `verify(attest(x), tampered(x)) = tampered`

**FALSIFIED if either arm fails** — i.e. if `verify` returns `tampered` on the untampered state (a false
alarm), or returns `valid` on the mutated state (a **vacuous verifier** — the load-bearing failure). A
`verify` that always returns `valid` passes the positive arm but FAILS the negative control: that is
exactly the assertion-without-checker posture the
[Kodamai synthesis](../../../../.arcanum/inventory/entries/kodamai-smithe-correctness-layer-synthesis.md)
flags. **Both arms must hold for the same fixture under the same `canon_version`.** This harness exists
to produce that pass/fail table.

Soundness statement under test (the pin, inherited from the owned kernel —
[`AgentPermissionKernel.lean`](../../../../domainspec-lean-formalization/lean-engineer/AgentPermissionKernel.lean)'s
`decidePolicy_allow_iff` / `decidePolicy_sound`): `verify = valid ⇒ claimed state is byte-for-byte the
attested state` (no false `valid`).

## Fixtures / controls
- **Golden (positive) fixture — COMPLETE.** A stable real cav2 decision record was sealed and verifies
  `valid`; see [`specimen/attestation.json`](./specimen/attestation.json). The selected source was
  [`authority/decisions/2026-06-24-saturn-domainspec-public-disclosure.md`](../../../authority/decisions/2026-06-24-saturn-domainspec-public-disclosure.md)
  (a real owner-ratified governance act).
- **Negative control — COMPLETE.** A content-mutated copy verifies **`tampered`**. This proves the
  verifier is non-vacuous; the run also covers whitespace normalization and attestation-hash tampering.
- **L2 controls (deferred):** `bad-signature` (valid seal, wrong/absent actor signature) and
  `unknown-actor` (signature by an unpublished identity) — authored only when the L2 actor-identity model
  is decided. Out of scope for the L1 MVP run.

## Example regimes
| regime | status | fixture | tests |
|---|---|---|---|
| **low** | **PASS** | the golden decision record above | `verify(attest(x),x)=valid` AND `verify(attest(x),tampered(x))=tampered`, plus normalization and artifact-integrity controls |
| **medium** | future | a **promotion** act (a candidate crossing a gate, kind=promotion) | same two arms on a different act-kind; canonicalization stable across record shapes; `canon_version` agreement between attest and verify |
| **complex** | selected next consumer | a **mint act** (kind=mint; artifact-state = a minted authority spine, the Mint-L2 consumer) | two live-source digest checks, deterministic manifest, positive/tampered arms; does not test external actor identity |

Per `experiment-harness`: require **real output bodies** (an actual attestation artifact + actual verdict
output), not save-summaries. The checked-in low-regime specimen satisfies this. Future regimes retain
the same mandatory negative-control rule and must use explicit local execution receipts.

## Blocks carried into the harness
- **L2 (external signature) — intended-not-shipped.** The `bad-signature` / `unknown-actor` arms wait on
  the L2 actor-identity model decision ([HANDOFF open questions](../HANDOFF.md)). The L1 MVP run covers
  `valid` / `tampered` only.
- **Mechanism stays withheld.** The harness demonstrates *results* (artifact, verdicts, the two-arm
  table); it must not document the canon rule internals, hash construction, or serialization in any
  promotable/public surface.

## Promotion-readiness gate (not yet met)
The L1 discriminating-self-test criterion is met. Promotion still requires the **L2 actor-identity
model**, built L2 rung, and a boundary scrub proving no mechanism leak. Until then the capability
remains INTERNAL, in-development, and unpromoted; only L1 integrity results are demonstrable.
