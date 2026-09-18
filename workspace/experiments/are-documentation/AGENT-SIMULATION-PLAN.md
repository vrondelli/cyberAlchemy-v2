# Agent conversation simulation

Historical artifact: the simulated conversation and its test were removed at the user's request. The page now uses [the protected live chat](VISITOR-CHAT-PLAN.md). Implementation descriptions below record the prior iteration.

Status: reviewed, implemented and locally verified. User objective: let visitors interact with a simulated agent and observe routing, language/explanation adaptation, and continuation without unnecessary questions.

## Design and order

1. Preserve the reviewed walkthrough as a comparison variant.
2. Build a bounded conversation state machine with two initial requests: explain (read-only) or fix (authorized implementation and checks).
3. Let the visitor correct project terminology and select a plain or technical explanation. Reuse those selections in later replies and displayed context.
4. Animate a prepared failed-test → investigation → retry sequence without requiring another confirmation for already authorized work.
5. Show an approval boundary for deployment; finishing the simulation does not deploy or ask for blanket permission.
6. Expose an adjacent ARE trace: route reason, scoped lessons, prepared context, continuation reason and boundary. Explain which transitions are illustrative.
7. Verify both routes, both terminology choices, both explanation styles, continuation, pause/resume, read-only scope, reset isolation, reduced motion, narrow layout and keyboard operation.

## Review

- The read-only path cannot silently start repairs. A separate visible visitor request authorizes the fix.
- The fix request explicitly includes checks and continued investigation, while reserving deployment for approval.
- Source: [request-decision-router](../../../implementation/agent-reasoning-engine/packages/request-decision-router/README.md). Routing and continuation decisions do not execute actions or grant permission; host integration remains responsible.
- Source: [interaction-learning prototype](../../../implementation/agent-reasoning-engine/benchmarks/real-reasoning-v1/interaction-learning/README.md). Scoped corrections are supported by synthetic validation, not evidence of reliable arbitrary inference or model-quality gain.
- This is a frontend simulation with prepared replies and test results. Do not label fixtures live model calls, actual repairs, actual test runs or verified ARE runtime receipts.
- Visitors choose suggested replies; no fake free-text chat that pretends to understand arbitrary input.
- Show state changes and later reuse, not only badges claiming a capability is active.
- Auto-advance only prepared work events. Provide pause and restart; reduced motion requires no visual animation. Changing settings/restarting cancels pending timers.
- Maintain icon-led open layout, blue palette, hero, role introduction and docs entry. Avoid decorative cards.

Review outcome: proceed inside the existing prototype. This demonstrates product behavior and causal relationships; it does not establish runtime performance.

## Construction boundary

Current frontier: working interactive conversation prototype. Runnable work: React state, fixture messages and local browser checks. No API key, backend, external model or deployment prerequisite. Exact effects: prototype files and local evidence only. Product owner authorization is the current request.

Deferred residue: a live adapter-backed demonstration requires a separately scoped integration and validated trace. Reader comprehension testing still needs recruited participants.

## Open Questions

- Do visitors distinguish scoped terminology reuse from model training?
- Is the relationship between host execution and ARE decision support clear?
- Does the automatic continuation feel understandable rather than too fast?
- Which verified runtime trace should replace this prepared illustration first?

## Execution evidence

- Default explanation is [AgentSimulation.tsx](src/AgentSimulation.tsx), with [agent-simulation.css](src/agent-simulation.css).
- The previous version remains in [GuidedWalkthrough.tsx](src/GuidedWalkthrough.tsx), selected by ?explanation=walkthrough.
- Production build passed.
- [Simulation checks](scripts/agent-simulation-proof.mjs): 40 passed across desktop, narrow and 240×320 reduced-motion panes, covering both request routes, vocabulary/style reuse, explicit repair authorization, pause/resume, automatic continuation, final boundary, reset cancellation and comparison-variant smoke checks.
- Retained role introduction: 9 layout checks passed.
- Visual evidence: evidence/agent-simulation-1440.png and corresponding narrow renders. Test evidence: evidence/agent-simulation-proof.json.
- Fixed an observed stale visibility notification in the smallest pane by refreshing visibility on scroll and layout changes.
- No live runtime/model claim, actual repair or actual test-run claim is made. Reader comprehension remains unmeasured.
