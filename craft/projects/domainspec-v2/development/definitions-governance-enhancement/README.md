<!-- PRIVATE staging folder (DomainSpec v2). Not public. Not applied to arcanum. -->

# definitions-governance-enhancement — staging

**What this is.** A private, sanitized *proposal* to enhance the PUBLIC Arcanum
sigil `definitions-governance`. It was authored from a DomainSpec v2 session that
discovered three reusable patterns while maintaining v2's local definitions surface.

**Status:** proposal only. Nothing here has been applied to Arcanum.

## Boundary (hard)
- Arcanum (`arcanum/`, the public submodule `git@github.com:cyberAlchemyAI/Arcanum.git`)
  was **read, never written**. No file under `arcanum/` is touched by this folder.
- The proposed sigil deltas are **generic and sanitized**: no private authority IDs,
  no private authority term names. A consuming repo wires its own private governance
  primitives into the generic hooks (see `SIGIL-DEV-PROPOSAL.md` → Provenance).
- Claim ≤ proof: this is a proposal, not a shipped change.

## Contents
- `HANDOFF.md` — invoke-style handoff packet: target = the Arcanum
  `definitions-governance` sigil; observed capability = invoke; mode = handoff;
  recommended next route = `sigil-development` (owner-gated, submodule-disciplined).
- `SIGIL-DEV-PROPOSAL.md` — the proposed change as three generic enhancement deltas
  (A machine-view pairing · B voice-quality discipline · C contestability hook),
  each naming the exact `SKILL.md` section it touches with before→after intent.

## Gated next step (NOT performed here)
1. Owner reviews this proposal.
2. Owner approves.
3. Owner runs `sigil-development` against `arcanum/arcana/definitions-governance/`
   (author the ratified deltas into the public sigil).
4. Regenerate the local `.claude/skills/definitions-governance/` copy from the sigil.
5. Commit the **arcanum submodule first**, then bump the parent (`make bump-check`),
   per `SUBMODULE-DISCIPLINE.md` (submodule first, parent last; no detached HEAD;
   public/private boundary preserved).
