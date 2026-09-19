# Standard Context Pack — SWU-MNP-006

Session evidence, not canonical authority.

- Coverage: `10/10`; strict local execution: pass.
- Dependencies: compiler, views, and minter receipts pass.
- Write scope: minted-project conformance fixtures, derivation-engine conformance
  tests/verifier, this session's conformance receipts, and status synchronization.
- Runtime: local; adapter/subagents: none; Decision Gate: not required.
- Validation: targeted Vitest, full `engine:test`, root TypeScript, diff check.

## Obligations

Prove Key and Door plus a semantically independent single-feature corpus; carry
the eight S06 controls (dangling target, duplicate edge, unknown relationship,
endpoint mismatch, stale graph, stale Markdown, missing machine field, escaping
source) and two S08 repairs (stale source, language digest mismatch); add formation
failure for Entity/Event/Operation/Rule; add generated/deprecated/deferred/unknown,
wrong-endpoint, and cross-feature relationship states; damage source, graph,
manifest, Markdown, language binding, and generated root independently; verify
deterministic compile/view/mint behavior and graph-to-source navigation; emit a
digest-bound non-admission receipt whose replay passes and whose fixture mutation
fails. Do not copy the immutable Refine package or claim cross-feature completeness.

## Selected Evidence

- `TASK-MNP-CONFORMANCE.md` and W3 own scope, completion, and stop conditions.
- S06 `toy-game/EVIDENCE.json` owns the original eight mutation identities.
- S08 `REPAIR-EVIDENCE.json` owns stale-source, language-binding, and total ten.
- Current profile registry owns admitted kinds and relationship signatures.
- Production resolver/compiler/views/minter own actual failure classifications.
- Key and Door is the first production witness; the second must use a different
  semantic domain and a strict subset of kinds/signatures.
