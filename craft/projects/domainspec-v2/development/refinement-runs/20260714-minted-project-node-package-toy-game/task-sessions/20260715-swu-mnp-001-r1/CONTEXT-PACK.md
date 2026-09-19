# Lean Context Pack — SWU-MNP-001-R1

Session evidence, not canonical authority.

- Goal: add per-kind machine body schemas for the four experimental-profile
  kinds and repair the Key/Door contract witness/digest closure.
- Decision: Option 1 in
  `authority/decisions/2026-07-14-minted-node-body-formation-contract.md`.
- Coverage: `7/7`; strict local execution: pass.
- Write scope: existing SWU-MNP-001 contract/profile/fixture/test homes plus
  this session evidence.
- Validation: targeted contract test, full tools suite, TypeScript, diff check.
- Blockers: none.

## Obligations

1. Bind one body schema per admitted kind from the supported profile.
2. Make node validation dispatch body validation from `kind`.
3. Preserve canonical criteria: Entity typedness+identity, Operation state
   change, Rule boolean return, Event past temporal declaration.
4. Keep body schemas generic and free of Key/Door domain meaning.
5. Repair Key/Door source, graph, provenance, Markdown, and receipt digests.
6. Keep release admission ungranted and generated artifacts read-only.
7. Mechanically regenerate/check the human contract index.
