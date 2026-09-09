---
decision_id: ARE-CONTEXT-IMPLEMENTATION-AUTHORIZATION-001
status: open-blocking
swu_id: SWU-ARE-CONTEXT-001
work_pack_sha256: fd1be80059ccba76407dcd5aeaf04f36116dbe85d2dfb663891ec80a5c30c2ce
readiness_sha256: e5fdabaf7330404b11624261371f04610ec43011e552990bd9a5d29797f948e7
authority_effect: none
---

# Context Basis implementation authorization gate

## Decision question

Should `SWU-ARE-CONTEXT-001` be authorized to create the pure deterministic
`context-basis-runtime` package under the exact Work Pack and file allowlist?

## Exact authorized effect for option A

Create only these new files beneath
`cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/context-basis-runtime/`:

1. `package.json`
2. `index.mjs`
3. `src/canonical.mjs`
4. `src/definition-closure.mjs`
5. `src/ontology-selector-lock.mjs`
6. `src/context-basis.mjs`
7. `src/context-window-view.mjs`
8. `src/compose.mjs`
9. `test/context-basis.test.mjs`
10. `test/fixtures/definition-catalog.json`
11. `test/fixtures/ontology-snapshot.json`
12. `generated/SWU-ARE-CONTEXT-001-receipt.json`

The implementation must consume the public `request-decision-router` API and
must not modify that package or duplicate its canonical route registry.

## Options

### ARE-IMPL-001-A — Authorize exact SWU

- Benefit: permits the first coherent Context Basis code vertical and its
  deterministic tests.
- Cost/risk: creates implementation bytes that require independent conformance
  review and a later candidate implementation binding.
- Downstream impact: execute under `CA2-ROUTE-IMPLEMENT`, stop on any scope or
  predecessor drift, and report candidate implementation evidence only.

### ARE-IMPL-001-B — Defer

- Benefit: preserves all admitted predecessors and planning evidence.
- Cost/risk: no code is authored.
- Downstream impact: implementation remains blocked until a fresh exact choice.

### ARE-IMPL-001-C — Stop/cancel this SWU

- Benefit: terminates this implementation route without rewriting upstream
  decisions.
- Cost/risk: requires a successor Work Pack and authorization for any future
  implementation.
- Downstream impact: no code mutation.

## Explain / more context

This non-committal choice does not resolve the gate. On request, the same three
options must be explained with aligned low-, medium-, and complex examples.

## Current result

- Result: `BLOCK`.
- Selection: none.
- Blockers remaining: 1.
- Implementation effect: none.
- Next step: explicit user/implementation-owner selection.
