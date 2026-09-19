# Lean Context Pack — SWU-MNP-004

Session evidence, not canonical authority.

- Coverage: `9/9`; strict local execution: pass.
- Dependencies: compiler retry receipt passes.
- Write scope: view/receipt modules under `impl/tools/minted-project/`, generated
  view contracts, view tests, this evidence, status synchronization.
- Runtime: local; adapter/subagents: none; Decision Gate: not required.
- Validation: targeted views, full tools suite, TypeScript, diff check.

## Obligations

Consume only validated graph/manifest; render deterministic generated Markdown
with graph digest; bind language/source/graph/manifest/Markdown digests; verify
current sources and total provenance; return distinct stale-source, stale-graph,
stale-manifest, stale-Markdown, and provenance failures; prove author Markdown
cannot supply missing machine semantics; preserve generated authority.
