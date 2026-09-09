# CC-003 — lookup profile reconciliation

The shared reasoning-profile mismatch is repaired. CA2-ROUTE-LOCATE now has
an explicit local-read policy and current route-registry provenance. Its profile
digest was deterministically recomputed. The diff contains only the new policy,
registry provenance hash and profile digest; other effects/policies are unchanged.

CC-003 binds current selected source bytes and the new lookup regression test.
Its predecessor is CC-002, whose bytes and recorded failure remain unchanged.
The original runtime manifest and current budget bytes also remain unchanged.

## Evidence

- Request-decision-router suite: 27 passed, including 5 new lookup tests.
- Codex integration suite: 20 passed with the existing mock transport. This is
  not live Codex conformance or a native Tauri run.
- CC-003 validator tests: 6 passed.
- CC-003 selected binding: PASS; nested profile: PASS; missing route policies: none.
- Scoped Git whitespace check: passed.

Candidate SHA-256:
`d6d0cab8e8b6699eafed912a8467a7599ed3d10cf756348765cc6142f361861d`

Budget SHA-256 (unchanged):
`e8f7ac530bb990402a04a85ea61e654f83787263c24e73ac26d279fdabd77baf`

## Recheck

From repository root:

```sh
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/test/*.test.mjs
node --test cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/test/*.test.mjs
node --test cyberAlchemy-v2/workspace/experiments/control-center/candidates/cc-003/validate.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/candidates/cc-003/validate.mjs
```

`RESULT.json` is the captured candidate check, not a reusable approval.
CC-002's live validator now correctly reports source drift after the profile
repair; its historical tests/results describe its previous epoch, not current
execution. Nothing in CC-002 was rewritten to conceal that distinction.

## Next construction frontier

Prepare an isolated WDIO-specific desktop build and exercise native Tauri smoke
against this candidate, keeping production assets and sessions separate. The
legacy global frontend test still selects its old manifest; explicit new-candidate
test selection remains to be wired, not silently bypassed or labeled green.

This is a selected-source inventory, not full transitive build closure or a
frozen tested binary. Full frontend/Rust/native campaign and host-qualified
differential evidence remain pending for that desktop candidate. Historical
budget comparison remains unresolved where original bytes were unavailable.
No budget limits were relaxed; single samples are not campaign p95 evidence.

Operational residue: no app restart, commit, publication or release performed.
No product approval, admission or operational authority is implied by these tests.
