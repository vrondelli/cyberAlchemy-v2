# Interrogation refine-review — Coupling Dialectic (s3)

Roles: coupling-architect vs circularity-skeptic. Pattern: dialectic + zig_zag.
Convergence criteria: a coupling seam proposed; the circularity objection answered
or recorded as residue. Full lanes: `CIRCULARITY-CRITIQUE.md` (s3),
`COUPLING-ARCHITECTURE.md` (s6).

## Convergence (the two lanes agree)
- **Architect:** the only model giving genuine D1 ∧ D2 acyclically is a
  **compiler-pair** — `K↓: LanguageArtifacts → ValidatorInputs` and
  `K↑: Verdict → LifecycleTransitionGuard`, over **disjoint facts**. Rejected:
  shared-core-vocab (no D2), layered-dependency (one stack can't carry both
  directions acyclically), full-merge (collapses the authority split → self-
  validation).
- **Skeptic:** mutual dependency is **safe iff** authority is split (content =
  language, well-formedness = validator) and **D2 binds only to well-formedness,
  never content-correctness**. That exact split is what the architect's
  disjoint-facts compiler-pair encodes. Independent agreement.

## The dialectic resolved into one rule
> **Acyclicity rule:** `K↓` never reads a verdict or `status`; `K↑` never reads
> the obligation table. Every meta-level arrow points forward
> (obligation_id → table → gradeFor → verdict → lifecycle advance); the loop-
> closing edge (verdict/status → obligation *content*) is **barred by
> construction**. A spec therefore never validates its own content.

## Bootstrap (skeptic, accepted by architect)
B0 seed σ-vocab from `domainspec-core` → B1 well-formedness-only validator → B2
empty/warn-only obligation table → B3 specs reach `validated` on well-formedness
→ B4 graduate obligations warn→fail as B-1 mechanizes → **B5 bind promotion last
(Lean pass necessary, owner approval P8 sufficient)**.

## Change-propagation
Convergent **iff** promotion/`validated` status never feeds back into the σ-vocab
or obligation content (cut that edge at B0/B5) and obligations enter warn-before-
fail (B4). Oscillates only if promotion feeds the vocabulary — that edge stays cut.

## Residue
- R-circularity → **conditioned** (gated by the acyclicity rule + bootstrap order).
- R-bridge-feasibility (open) gates obligation graduation (B4).
- P8 owner-approval stays human; Lean pass is necessary, not sufficient.
