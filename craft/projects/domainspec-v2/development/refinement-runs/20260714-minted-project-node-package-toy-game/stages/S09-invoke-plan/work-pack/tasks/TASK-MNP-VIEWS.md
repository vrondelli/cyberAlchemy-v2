# TASK-MNP-VIEWS — Generated Human View and Receipt Verification

Layer: L1  
Status: `SWU-MNP-004` completed; receipt pass

## Purpose and Decision Owned

Generate human-readable Markdown from normalized graph semantics and verify that canonical sources, graph, source manifest, and human views remain digest-bound. This task owns projections only and cannot repair or add semantics missing from machine sources.

## SWU-MNP-004

- Goal: implement deterministic view generation and source-aware build receipt verification.
- Dependencies: SWU-MNP-003.
- Write scope: view/receipt modules and generic templates below `projects/domainspec-v2/impl/tools/minted-project/`, generated-view contracts below `projects/domainspec-v2/impl/spec/minted-project/`, and `projects/domainspec-v2/impl/tools/tests/minted-project-views.test.ts`.
- Algorithm:
  1. accept only validated normalized graph and source manifest;
  2. render stable node and edge sections from graph fields, with explicit generated banner and graph digest;
  3. never read author Markdown to fill graph/node fields;
  4. emit receipt binding language/profile, source set, graph, source manifest, and Markdown digests;
  5. on verify, recompute current project input hashes and source-set digest;
  6. verify every graph ID joins to one source manifest record and containing source;
  7. verify each output digest independently;
  8. report stale-source, stale-graph, stale-source-manifest, and stale-Markdown separately.
- Edge cases: source changes after build; deleted source; hand-edited Markdown; graph changed without source; manifest path tampered; locale/order instability; a missing machine field present only in prose.
- Done criteria: unchanged builds are byte-equal; each stale mutation fails with its own code; deletion/regeneration is safe; human view contains no independent semantic field.
- Acceptance evidence: S08 source-aware checks promoted into production tests plus source-manifest drift mutation.
- Verification: `npm --prefix projects/domainspec-v2/impl run tools:test` and `npm --prefix projects/domainspec-v2/impl run typecheck`.
- Execution owner: local fallback.
- Handoff: provide generator/receipt contract and exact output paths to SWU-MNP-005.

## Completion Evidence

- Session: `task-sessions/20260715-swu-mnp-004/`.
- Validation: targeted `10/10`; full tools suite `92/92`; TypeScript and diff pass.
- Generator digest: `fad9abde6356eedae4541c7dca8a1a17897a29504e57ed0d46b9911e8e2d0a10`.
