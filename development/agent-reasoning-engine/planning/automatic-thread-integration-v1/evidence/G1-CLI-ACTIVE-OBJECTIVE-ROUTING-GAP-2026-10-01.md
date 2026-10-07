# G1 active-objective routing gap in the repository CLI adapter

Status: bounded diagnostic evidence, 2026-10-01. No route-policy change or
current-task activation. TUI is discontinued and out of scope.

## Reproduction

The local `are decide route` adapter preserves the exact `raw_request` and
marks caller-derived `objective_kind` as `inferred`. With the active user goal
“my pc restarted, contineu until we have this integration layer working
properly and then continue with the ui work, i`ll review everything at the
end, dont stop to ask questions, we have everything needed already”, an
inferred `implement` objective and `change code` effect returned `block` with
`selection.no-match`. With the earlier exact user text “we need to plan and
implement this”, an inferred `implement` objective returned `gate` with
`selection.multiple-capabilities` (`CA2-ROUTE-PLAN` and
`CA2-ROUTE-IMPLEMENT`). `requested_effects` assessed consequence; it did not
create route affinity.

The router source deliberately allows only an **explicit** `objective_kind`
to select a route without lexical evidence. Inferred targets and constraints
also cannot manufacture lexical evidence. Focused router tests passed 26/26,
including the cases that require inferred objectives to remain nonselecting
and Plan/Implement overlap to gate. This is not a failing test or a reason to
relax those safety invariants.

## Integration implication

The CLI's `session_id` is a caller correlation label, not an authenticated
Codex task identity or durable objective-state handle. The CLI request schema
contains the current raw request and hints, but no host-bound predecessor
intent, explicit active-goal binding, or signed route-continuation state.
Consequently, it cannot independently resolve elliptical follow-ups such as
“continue” or “do this” from conversation history. The wrapper has separate
objective lifecycle machinery, but connecting to the CLI or passing a claimed
session ID does not transfer that state or activate this desktop task. The
managed-session launcher accepts a caller-selected gateway profile and does
not itself require `objective_resolution.enabled`; the wrapper config defaults
that feature to disabled when absent. Thus a running managed gateway also
cannot be assumed to provide objective continuity without inspecting its exact
selected profile and a bound turn/restart test.

An implementation candidate must bind a host-attributed active objective and
its previous route/decision receipt to the exact conversation, authenticate
the continuity source, and distinguish continued implementation from a new
Plan request or changed user intent. Unknown, stale, contradictory, or
unauthenticated bindings must still gate. This is a proposed integration
contract, not authority to reinterpret the current user's raw words or change
the repository router's explicit/inferred posture rules.

## Evidence and claim ceiling

- `agent-routing/capabilities/are-cli/README.md` and `request.schema.json`:
  stateless CLI request and caller-carried receipt contract.
- `implementation/agent-reasoning-engine/packages/request-decision-router/src/router.mjs`:
  explicit-objective and lexical selection rules.
- `implementation/agent-reasoning-engine/packages/request-decision-router/test/router.test.mjs`:
  inferred-objective and overlapping-route cases; 26/26 passed locally.
- `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/objective-requirements.mjs`:
  separate wrapper objective-state continuity machinery.
- `implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/config.mjs`
  and `bin/are-managed-session.mjs`: opt-in objective resolution and
  caller-selected managed gateway configuration.

This evidence identifies a routing-continuity gap for the local adapter. It
does not prove that a supported desktop handover exists, that the active task
is ARE-managed, or that a new session's full UI and effect paths are ready.

## Open Questions

- Which host-owned event or API can provide an authenticated active-goal and
  previous-route binding to ARE before interpreting an elliptical follow-up?
- Should the repository CLI remain strictly one-request-at-a-time while the
  managed gateway owns goal continuity, or receive a separately verified
  continuation envelope for repository sessions?
