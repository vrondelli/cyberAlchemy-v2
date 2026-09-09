# Decision: Mint — Signer/Attestation Capability + Public/Private MVP Scope

Status: pass
Owner route: decision-gate + boundaries
Timestamp: 2026-06-29
Target scope: the Mint sigil (`cyberAlchemy-v2/development/mint/`) — two blockers gating work past L1.

## Consequential Work

Resolves the two owner-level blockers that the `mint-design-plan-review` (FIX) and the frozen
`mint-foundry-boundary-criterion` left open. Until resolved, building Mint past L1 was blocked.
Both are governance/boundary decisions, not code. Source: operator choices, 2026-06-29
(Decision 1 taken after an explain-loop). INTERNAL; moat-adjacent.

## Decision 1: The "signed governance act" mechanism (review C7 — the L2 signer gap)

When a mint proposes domain authority kinds, the cav2 owner must ratify them and the mint must
produce a "signed governance act." Review C7 found `decision-gate` models no signer/ratifier.

Considered options:
- **A — committed owner-confirmed record (build-from-owned).** "Signed" = an attributed, committed
  `authority/decisions/<date>-mint.md` (how cav2 already signs — cf. the resonantos decisions).
  ~Zero new infra; attributional/social, not tamper-evident.
- **B — build a dedicated signer/attestation capability.** Net-new verifiable-attestation infra.
- **C — extend `decision-gate` with a signer.** Mutates a shared skill for one consumer.

**Selected: B — build a dedicated signer/attestation capability.**

Rationale (operator): the deliberate **"attestation IS the moat"** bet (per `machine-map-and-moat`
and the Kodamai finding — attestation + governance-data is the wall, not provability). Mint becomes
the vehicle for *starting* the attestation-moat infrastructure: verifiable attestation of the mint
governance act, not merely an attributional markdown record.

**Consequence (recorded honestly):** L2 (Mint's signed decision-gate stage) now has a **NEW upstream
dependency** — the attestation/signer capability must be designed and built *first*, through its own
lifecycle (`invoke` → `sigil-development`). This is a larger, deliberate commitment than Option A —
it is a strategic initiative, not a quick unblock. **The MVP (L0 + L1) remains buildable now;** L2
waits on the attestation capability. This decision does not itself build it — it greenlights and
sequences it.

## Decision 2: Public/private MVP scope (`BLK-CAV2-PUBLIC-PRIVATE-001`)

Considered options:
- **A — private-only MVP, defer public.** Internal/private domain repos only; public mints stay BLOCKED.
- **B — resolve the full public/private boundary now.** Define what a public mint may expose.
- **C — internal-only permanently.** Public mints out of scope by definition.

**Selected: A — private-only MVP; defer public-attached mints.**

Rationale (operator): the experiment + L0/L1 are all internal, so private-only unblocks them without
forcing the hard boundary resolution prematurely.

**Consequence:** the Mint MVP produces internal/private domain repos only (private framework attach).
`BLK-CAV2-PUBLIC-PRIVATE-001` stays **DEFERRED (not resolved)** — public-attached mints remain blocked
until a later decision.

## Remaining blockers / deferred / new dependencies

- **DEFERRED:** `BLK-CAV2-PUBLIC-PRIVATE-001` (public-attached mints) — by Decision 2.
- **NEW DEPENDENCY (from Decision 1):** the **attestation/signer capability** — gates Mint L2; route
  through its own `invoke` → `sigil-development` lifecycle. Strategically the moat, so it warrants
  first-class treatment, not a Mint sub-task.

## Downstream updates this decision forces (next step, not done here)

- Mint `SKILL.md` / `EXECUTION-PACK.md` / `development/HARNESS.md`: change L2's block reason from
  "signer-capability absent (decision-gate models none)" to **"gated on the attestation/signer
  capability (decided 2026-06-29 to build)"**; record MVP scope = **private-only**.
- Mint `README.md`: note `BLK-CAV2-PUBLIC-PRIVATE-001` is now *deferred by decision*, not just open.
