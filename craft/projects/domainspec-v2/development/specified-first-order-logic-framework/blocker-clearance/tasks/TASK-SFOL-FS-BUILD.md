# TASK-SFOL-FS-BUILD

## Objective

Regenerate Financial Settlement from canonical machine nodes using the new
logic-admitting development profile and the exact experimental proposal.

## Dependencies

BC-001 profile/compiler and BC-002 source proposal pass. BC-003 is sequenced
before this unit by policy but is not a causal build dependency.

## SWU-SFOL-BC-004

- Primary behavior: canonical per-node sources deterministically produce a
  graph, source manifest, human view, and build receipt containing the proposed
  logic modules.
- Inputs: source proposal, development profile, C3/P4 proposed logic modules.
- Outputs: `project.json`, `feature.json`, node files, generated artifacts,
  build/projection receipt.
- Algorithm:
  1. Author one Calculation node owning C3 and one Operation node owning P4.
  2. Keep supporting Rule/Event nodes structural and connect only admitted
     relationships.
  3. Bind project language handles to the explicit development registry.
  4. Build twice in memory and require identical bytes.
  5. Write generated artifacts below the feature directory.
  6. Verify views and project both logic modules from canonical proof handles.
  7. Require each projected clause AST canonical digest to equal its proposed
     clause AST digest and each projected normalized clause semantic digest to
     equal its proposed semantic digest. The module digest independently binds
     the complete canonical module.
- Edge cases: duplicate logic ownership, direct AST input, stale profile digest,
  output path escape, nondeterminism, malformed module.
- Failure modes: editing generated output, placing logic in Markdown, using the
  released profile, or bypassing manifest/build evidence.
- Split analysis: sources and generated proof context are one coherent build
  boundary; either alone is unreviewable as a regeneration claim.
- Write scope: Financial Settlement machine sources/generated artifacts, build
  tool/script, package script, BC-004 evidence.
- Done criteria: two modules project with exact source/build handles, exact
  clause AST/semantic proposal digests, and independently bound module digests;
  double build is byte-identical; verifier and negative controls pass.
- Acceptance evidence: build receipt, projection receipt, deterministic digest
  matrix, execution receipt.
- Validation surface: build command twice, build verifier, projection suite,
  tool and engine typechecks.
- Execution owner: local-fallback.
- Handoff: refresh verifies canonical build/projection evidence, explicitly
  leaves formal G-SFOL-01 open, and returns SWU-SFOL-BC-005 only when
  G-SFOL-01-EXP and the BC-003 execution-policy gate pass. G-SFOL-06 closure
  remains attributed to BC-001.
