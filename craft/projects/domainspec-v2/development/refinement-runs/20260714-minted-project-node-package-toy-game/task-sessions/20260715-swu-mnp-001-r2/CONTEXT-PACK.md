# Lean Context Pack — SWU-MNP-001-R2

Session evidence, not canonical authority.

- Coverage: `8/8`; strict local execution: pass.
- Decision: empty minted projects are admitted by operator-selected Option 1.
- Write scope: minted-project source/generated schemas, resolver behavior,
  focused tests, this evidence, and synchronized work-pack status.
- Runtime: local; adapter/subagents: none; Decision Gate: resolved.
- Validation: targeted minted-project tests, full tools suite, TypeScript, diff.

## Obligations

Allow `project.features: []` and `feature.node_sources: []`; continue requiring
those properties to be arrays of non-empty string paths when populated; admit an
empty generated graph and zero provenance records while retaining at least the
project manifest as an input; prove deterministic compile/view/verification for
the empty project; preserve all non-empty fixture behavior and authority roles;
record current schema and resolver digests before resuming the minter.
