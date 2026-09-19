# Context Pack — s1 (evidence baseline)

Owner: context-builder (parent) + lean-validator-xray subagent receipt.
Full x-ray: `VALIDATOR-XRAY.md` (same folder).

## Load-bearing facts the design must respect

- **The spec is already a typed quiver, free by construction.** `EdgeRow`
  (`Richness.lean:45`) carries `wellTyped : sigmaValid p edge (metaOf src) (metaOf tgt) = true`;
  Theorem 1 `all_edges_well_typed` (`Richness.lean:71`) proves every `Spec` is a
  valid typed quiver over the σ-schema `sigmaValid` (`Sigma.lean:56`). It is a
  **quiver, not yet a category** — no composition/identity/functor laws exist.
- **Deterministic grader exists.** `gradeFor` (`Report.lean:136`) + worst-component
  `aggregateOverall`. P1 closure (`gradeP1Closure`, real) and P5 acyclicity
  (`gradeP5Acyclic`, real, hand-rolled gray/black DFS, no Mathlib). P3
  (`gradeP3Obligations`) and P4 (`gradeP4Ambiguity`) are `.pass` stubs.
- **M6 detector exists** (`m6Witnesses`, `Richness.lean:85`) and `EdgeProvenance`
  (`declared | contextInferred | sigmaFallback`) — the computable witness layer
  for ambiguity/residue, but its grader/theorem are unbuilt.
- **Adversarial harness exists**: `examples/FaultInject.lean` triggers P1 fail
  (unresolved refs), P5 fail (R_CF cycle), and an R_CF profile-gated path. This
  is the Stage-B toy-game reference.
- **Constraints:** self-contained Lean 4, **no Mathlib**; `#eval gradeFor spec`
  is the deployment surface; `partial def dfsCycle` is an unverified check, not a
  proof; 8 R_U edges are unsigned (empty σ → WARN under D12).
- **Absent from this repo:** the `audit_richness.py` translator (MarkdownToSpec /
  SpecToLean) and the `discovery/` decision docs — only emitted Lean output is
  in-tree. **There is no existing LLM-code→spec translator at all.** The named
  categorical roadmap (Spec-as-presheaf, Quiver Meta, `Lan`, "Lan-faithful not
  full", open M6-graph theorem) is cited in `README.md:88-91` but unbuilt.

## Reuse map (seed → two stages)

- Stage A: `EdgeRow.wellTyped` + Theorem 1 (typing, free); `gradeP1Closure`;
  `gradeP5Acyclic`. Missing: P3/P4 real, B-1 `obligation_id`s.
- Stage B: `ConceptSpace.metaOf` (object map) + `EdgeRow` (arrow map w/ proof) are
  the shape a functor `C → S` needs; `gradeFor` is the verdict surface;
  `m6Witnesses` is the residue witness. Missing: S-as-category, the translator
  `T`, the functor-law check.
