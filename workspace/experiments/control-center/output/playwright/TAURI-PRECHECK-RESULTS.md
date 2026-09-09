# Tauri candidate precheck

2026-09-05. CA2-ROUTE-VALIDATE. Candidate identity check failed; no approval.

## Executed checks

- `npx vitest run`: 77 passed, 1 failed, 78 total. Failure is the exact-current
  implementation-manifest binding test, with SOURCE_DIGEST_DRIFT.
- `npx tsc --noEmit --pretty false`: passed independently.
- Desktop `cargo test --locked`: 4 passed.
- Essays implementation `cargo test --locked`: 11 conformance and 3 adapter
  tests passed; zero-test binary/library targets and doc-tests also succeeded.

The frontend command chained typecheck after tests, so typecheck did not run in
that initial command. It was subsequently executed independently and passed.

## Collect-all comparison of declared chat source closure

The existing IMPLEMENTATION-MANIFEST.candidate.json declares 40 chat sources;
11 differ from their bound SHA-256. No missing files in that closure comparison.
This comparison does not establish closure completeness or conformance.

Changed declared dependencies (relative to cyberAlchemy-v2):

1. implementation/agent-reasoning-engine/packages/request-decision-router/profiles/cyberalchemy-v1.json
2. goals/profile.json
3. ontology/governance/invariants.json
4. ontology/governance/rules.json
5. agent-routing/routes.json
6. essays/development/agent-runtime/implementation/desktop/src-tauri/src/main.rs
7. workspace/runtime/src/WorkspaceApp.tsx
8. workspace/runtime/src/features/chat/ChatSurface.tsx
9. workspace/runtime/src/features/chat/are-chat-bridge.ts
10. workspace/runtime/src/features/chat/chat.css
11. workspace/runtime/performance-budgets.candidate.json

First failing expected hash:
`a2060b4786c57980c203a156073dc12a0436476810e94feabd5d6e25118618a1`
Actual routing-profile hash:
`39b22abaf179f074712675f8951399327b3027f0840fa1ed73c5c685a19f4867`

Budget file observed SHA-256:
`e8f7ac530bb990402a04a85ea61e654f83787263c24e73ac26d279fdabd77baf`.
No budget edits or automatic digest refresh were performed. A mismatch alone
does not prove which budget values changed or authorize accepting them.

## Test boundary

The existing unified smoke uses native Tauri IPC with a mock Codex server and
ARE_CODEX_ALLOW_PROTOCOL_DRIFT=1. Even a passing run would be local fixture
integration evidence, not live-engine conformance.

Isolated Tauri launch, WDIO-specific candidate build, unified smoke, real receipt
continuity, and qualified repeated/differential performance campaign were not
executed. Exact-candidate claims are blocked by the stale selected binding.
No Python ontology-runtime admission or ambient ontology-epoch gate was used.
Independent frontend/typecheck/Rust work was not blocked by that binding.

## Next construction frontier

Prepare a separately identified current control-center candidate: review the
declared dependency changes and closure completeness, preserve the previous
candidate and evidence, and bind current source without inheriting prior PASS
or approval. The budget discrepancy needs comparison, not blind rehashing.
Then rerun its tests and native desktop smoke. This is construction work, not
product approval or operational authority.

Operational support: no running essays-desktop was found during the process
check; none was stopped or launched. Production dist was not replaced. Cargo
test caches were used; an empty temporary directory was allocated at
`/tmp/cav2-tauri-control-center.2N4PDT`. No desktop-restoration action is needed.
Commit, reconciliation, publication, release and product approval remain separate.
