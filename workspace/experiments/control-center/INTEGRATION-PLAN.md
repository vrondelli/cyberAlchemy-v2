# Workspace integration: persistent conversation dock

Status: local construction candidate; no product approval or operational authority.

## Selected dependencies

The existing Definition Pack and experiment remain unchanged. This slice realizes
only IC-STATE (one retained conversation), IC-SURFACE (existing artifact instances)
and SYS-VIEW from `system.json`. It does not claim full contract coverage.
The frozen isolated prototype receipt remains historical evidence for its bytes.

## Product construction frontier and sequence

1. Before code, record this boundary and checks.
2. Add a tested visibility policy in runtime/src/features/control-center/layout.ts.
   Normal navigation stays unchanged. Opt-in dock mode retains exactly the same
   chat component while an artifact is selected. Chat-only navigation remains valid.
3. Add shell controls to enable/disable the mode and expand/compact chat. Keep
   existing component positions and keys: do not remount editors or chat.
4. Add scoped CSS: artifact above chat, independent scroll regions, accessible
   decision panel, narrow-screen fallback. Never hide approval controls.
5. Run policy and existing chat tests, typecheck, and a disposable-output Vite build.
   Browser/desktop evidence must be reported separately from compilation.

Runnable now: steps 2–5. No causal operational blocker for this local slice.
One primary behavior: retaining the live chat alongside existing artifact surfaces.
No bridge, permission, automatic-approval, target-routing, benchmark-budget,
snapshot, ontology-source, or production-dist edits are in scope.

## Operational support and deferred construction

- Agent owns temporary preview/build outputs; affects prototype inspection only.
- Desktop test owner: full Rust/WDIO, cold-session qualification and differential
  campaign after the integrated candidate is complete; not evaluated by this slice.
- Construction residue: multi-panel proposals/pins, typed artifact target adapter,
  successor orchestration adapter, attention aggregation and durable recovery.
- Product owner: exact tested-candidate approval remains pending. Repository
  owner: reconciliation, commit, merge, publication and release are separate.

## Acceptance checks

Normal mode has one visible surface. Dock mode shows chat plus the selected
artifact, never two chat instances. Chat-only navigation does not expose a stale
artifact. Enabling dock ensures chat is mounted. Disabling/expanding does not
replace the component tree or alter drafts, permissions, or target state.
