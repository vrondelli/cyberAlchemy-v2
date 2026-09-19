<!-- PRIVATE staging. invoke-style HANDOFF packet. Sanitized. Not applied to arcanum. -->

# HANDOFF — enhance the `definitions-governance` sigil

> invoke artifact · mode: **handoff** · observed capability: **invoke**
> This packet routes an observed improvement to its next owner. It does **not**
> mutate anything. The target is a PUBLIC sigil; the mutation is owner-gated.

## Target artifact
- **Sigil:** `definitions-governance` (Arcanum, tier: arcana, domain: semantic-governance).
- **On disk (read-only from here):** `arcanum/arcana/definitions-governance/SKILL.md`
  (public submodule `git@github.com:cyberAlchemyAI/Arcanum.git`).
- **Local runtime copy (regenerated downstream):** `.claude/skills/definitions-governance/`.

## Observed capability & mode
- **Observed capability:** `invoke` — turn a discovered, recurring maintenance
  practice into a governed handoff artifact before any lifecycle execution.
- **Mode:** `handoff` — hand the observation to the sigil's development owner with a
  precise, ratifiable change proposal; author nothing into the public sigil here.

## Source signals (where this came from)
- A DomainSpec v2 definitions-maintenance session, working the local definitions
  surface, surfaced three patterns that the *generic* sigil does not yet encode:
  1. **Human card + machine registry pairing** — each canonical definition kept as a
     human `.md` card *and* a machine registry entry (`.yml`) that is a read-model
     index (not a validation schema). Local instance: a per-scheme card file paired
     with a per-scheme registry `.yml`, each member pointing at its criterion source.
  2. **Voice quality, not just voice presence** — the richest local cards carry
     quality beyond the three mandated voices (explicit "use carefully" / "misuse
     warning" / promotion-boundary notes). The sigil mandates the *presence* of three
     voices but sets no *quality bar* per voice and accumulates no lessons.
  3. **Contestability of candidates** — candidate definitions locally carry an
     open/to-ground field, stage in a review area, and promote candidate→active only
     under an explicit owner step. The generic sigil has no slot describing *how a
     candidate is contested* or *what confirms its promotion*.
- These are three independent, generalizable gaps in the public sigil. Each maps to
  named `SKILL.md` sections (see `SIGIL-DEV-PROPOSAL.md`).

## Recommended next route
- **Route:** `sigil-development` against `arcanum/arcana/definitions-governance/`,
  **owner-gated** and **submodule-disciplined**.
- **Input to that route:** the three deltas in `SIGIL-DEV-PROPOSAL.md` (A, B, C),
  each with the exact section it touches and before→after intent.
- **Why sigil-development, not a direct edit:** the target is a versioned public
  sigil; changing `<definition-voice-model>`, `<process>`, `<output-contract>`,
  `<quality-bar>`, and the default `definitions/` surface is a sigil-lifecycle change
  (revise → observe → reflect), not an ad-hoc file edit.

## Boundary note (load-bearing)
- The target sigil is **PUBLIC**. This handoff and its proposal are **PRIVATE** and
  **generic**: no private authority IDs or private authority term names appear in the
  proposed sigil text. A cav2-based consuming repo has private instantiations it would
  wire into the generic hooks — that wiring stays in the private repo, never in the
  sigil (see `SIGIL-DEV-PROPOSAL.md` → Provenance).
- **No mutation occurs on this route step.** Applying the deltas is a separate,
  owner-approved `sigil-development` run followed by submodule-first / parent-last
  commit discipline (`make bump-check`), per `SUBMODULE-DISCIPLINE.md`.

## Gate to advance
Owner reads `SIGIL-DEV-PROPOSAL.md` → ratifies deltas (all / subset) → runs
`sigil-development` on the public sigil → regenerates the local skill copy →
commits arcanum submodule first, then bumps the parent.
