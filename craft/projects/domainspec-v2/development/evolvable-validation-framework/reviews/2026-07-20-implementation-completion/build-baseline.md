# Frozen build baseline

- Dispatch: `2026-07-20-evf-implementation-completion-review`
- Captured: 2026-07-20 (America/Sao_Paulo)
- DomainSpec root base: `c1f25ed67a28ac6be30203647b9620540df43910`
- Lean repository head: `c2ed8782706083d77323c57ffe722b918deeab67`
- Lean commit window: `57e4d66f9e5ab037c4987ffc53a849b84bc71de3..c2ed8782706083d77323c57ffe722b918deeab67` (111 commits)

## Commands

| Command | Result |
| --- | --- |
| `npm run engine:test` from `projects/domainspec-v2/impl` | PASS: 10 files, 107 tests |
| `npm run typecheck` from `projects/domainspec-v2/impl` | PASS: `tsc --noEmit` |
| `npm run validate:rels` from `projects/domainspec-v2/impl` | PASS: 5 specs, 34 edges, 30 canonical signatures |

This proves only the bounded current suite. It does not establish the planned graph-to-receipt vertical slice or backend completeness.
