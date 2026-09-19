# Lean Context Pack — SWU-MNP-002

Session evidence, not canonical authority.

- Task: `SWU-MNP-002` safe source resolver.
- Coverage: `8/8`; strict local execution: pass.
- Runtime: local; adapter: none; subagents: none.
- Write scope: `impl/tools/minted-project/` and
  `impl/tools/tests/minted-project-resolver.test.ts` plus Task Session evidence
  and status synchronization.
- Validation: `npm --prefix projects/domainspec-v2/impl run tools:test` and
  `npm --prefix projects/domainspec-v2/impl run typecheck`.

## Obligations

1. Canonicalize the project root and keep every resolved real path beneath it.
2. Reject absolute, escaping, symlink-escaping, and Windows-shaped paths before
   domain parsing.
3. Reject missing, non-file, unreadable, unsupported-extension, duplicate, and
   case/canonical alias sources with stable error codes.
4. Discover `project.json -> feature manifests -> feature-relative node files`.
5. Reject unsupported project/feature envelope versions during discovery.
6. Return sorted project-relative `{path,digest}` records and one canonical
   source-set digest.
7. Prove deterministic repeat output and each named failure class with tests.
8. Preserve the experimental profile and factory/consumer/generated authority
   split; do not perform compiler semantics in this SWU.

## Selected Evidence

- `TASK-MNP-COMPILER.md` — SWU algorithm, failure modes, scope, done criteria.
- `WORK-PACK.md` — dependency state and required verification.
- `task-sessions/20260714-swu-mnp-001/receipt.json` — contract dependency pass.
- `stages/S08-distill-repair/selected-design.json` — layout A and provenance
  projection.
- `impl/spec/minted-project/project.schema.json` — project path/version fields.
- `impl/spec/minted-project/feature.schema.json` — feature-relative node paths.
- positive `key-and-door/project.json` — concrete project discovery witness.
- positive `key-and-door/specs/key-and-door/feature.json` — concrete node-source
  discovery witness.

## Decisions and Gates

- Safe assumption: v1 source files use lowercase `.json` only.
- Safe assumption: case-folded or real-path aliases fail closed on every host.
- Blockers: none.
- Decision Gate: not required.
