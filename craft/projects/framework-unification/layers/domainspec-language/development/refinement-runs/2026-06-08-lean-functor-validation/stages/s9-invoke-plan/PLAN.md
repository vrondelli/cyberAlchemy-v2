# Invoke Plan — Work Pack: Smallest Honest Provable Stage-B Surface (s9)

Stage: s9 · Capability: invoke (plan) · **Non-executed.** No Lean/parser/translator
code is written by this refine run. This is the plan a future task-session or
sigil-development run would execute. Gated by DEC-CAT-01 (categorical decision)
and the s8 repair sequencing.

## Outcome
Make the Stage-B residue story **operational and honest** before building the
translator, then prove the smallest functor-obligation surface on one fixture —
reusing the existing validator with no change to Theorem 1.

## Ordering principle (from s8 falsifier)
Residue must **govern** before it is **claimed**. So P4 + per-edge provenance
land first; the translator T and the functor narrative come after.

## Tasks (waves)

### Wave A — make residue govern (closes the falsifier)
| ID | Task | Done when |
|----|------|-----------|
| A1 | Wire per-edge `EdgeProvenance` through the emitter (stop hardcoding `.declared`): `.declared` for tag edges, `.contextInferred` for pattern edges, `.sigmaFallback` for σ-filtered graph edges | emitter output carries real per-edge provenance |
| A2 | Make `gradeP4Ambiguity` real: grade `m6Witnesses` by provenance (`declared`/`contextInferred` → fail; `sigmaFallback` → warn) | P4 is no longer a `.pass` stub; Fault D now WARN/FAIL |
| A3 | Add unspecified-behavior + unimplemented-obligation residue as **sidecar records** (not in `concepts`): code∉spec and spec∉code diffs | both residue directions surfaced, provenance-tagged |

### Wave B — minimal deterministic translator T (one tier, one fixture)
| ID | Task | Done when |
|----|------|-----------|
| B1 | Implement T's **tag tier only** (tag ≻ pattern ≻ graph): DomainSpec source tags → `Meta`/`EdgeType` by identity rename; emit existing `Spec` format | a tagged example produces a `gradeFor`-ingestible Spec deterministically |
| B2 | Pin determinism: declaration-order tie-break + lexical sort + pinned graph snapshot; assert same input → byte-identical Spec | reproducibility check passes twice |

### Wave C — prove the toy-game (Stage-B falsification harness)
| ID | Task | Done when |
|----|------|-----------|
| C1 | Author Faults A–D as fixtures (σ-violation / P5 cycle / P1 unresolved / M6 ambiguity), mirroring `FaultInject.lean` | each fault produces its expected verdict |
| C2 | Assert the PASS criterion: validator REJECTs/WARNs every non-functorial lift AND attributes residue by provenance | toy-game green; falsifier not triggered |

### Deferred (named, not silently dropped)
- **P3 per-meta obligations** — gated on DESIGN-PACKAGE blocker **B-1** (`obligation_id`s); ship `warn`-only when it lands.
- **Lan layer / η / M6-graph theorem** — OPEN CONJECTURE; never on the critical path.
- **Path-equation commutativity** — undecidable in general; only finite-confluent sets; no path equations in `Spec` today.
- **Full presheaf lift** — recomposition target, post-MVP.

## Verification surface
- `lake env lean --run …/examples/<fixture>.lean` prints a `CodegenReadinessReport` (the standing command).
- Wave C toy-game: non-functorial lift never silently passes.
- No edit weakens Theorem 1; no Mathlib added.

## Boundaries / blocked stop conditions
- Read-only on lean-code-validator, Craft, implementation/domainspec source — this plan describes changes a future executing run would make in that tree under its own impact-analysis rules; the refine run does not make them.
- Stop and escalate if A1 reveals the emitter cannot carry provenance without a parser rewrite (would reopen scope), or if B1 tag coverage is too sparse to type any fixture.

## Recommended next route
`task-session` (or `domainspec-task-session`) on **Wave A** first (it is the honesty-critical, lowest-cost unit and unblocks every later claim).
