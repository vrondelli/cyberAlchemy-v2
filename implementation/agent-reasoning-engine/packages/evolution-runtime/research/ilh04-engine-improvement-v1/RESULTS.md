# IL-H04 Engine-Improvement Results

Status: construction variant integrated and recommended  
Production activation: none

## Outcome

IL-H04 is integrated into the ARE Codex app-server wrapper immediately after
objective-transition resolution and before model dispatch. When explicitly
enabled in a construction profile, the wrapper:

1. obtains a closed high-risk binding from the engine-owned provider;
2. derives transition and objective identity from the verified objective
   resolution rather than accepting them from the provider;
3. renders the retained deterministic continuity response;
4. adds a digest-bound `cyberalchemy.are.continuity` context projection;
5. emits a typed `cyberalchemy/continuity` client notification; and
6. records structural digests, not response prose, in the runtime journal.

The repository profile contains `continuity_renderer.enabled: false`. Missing,
malformed, drifted, or over-specified engine bindings fail before model
dispatch. A minimal `{high_risk:false}` binding bypasses the renderer.

## Evidence

| Check | Result |
| --- | --- |
| Retained 20-scenario exact-render parity | 20/20 |
| Candidate high-risk projection coverage | 20/20 |
| Disabled baseline projections | 0/20 |
| Focused continuity integration tests | 8/8 passed |
| Full Codex wrapper tests | 208/208 passed |
| Full evolution-runtime tests | 128/128 passed |
| Coordinator settlement | 5/5 tasks completed |
| Restart reconstruction | verified |
| SQLite-loss reconstruction | verified |

The integration package decision is `recommend-variant`. Its exact artifact is
`evidence/ilh04-engine-improvement-v1/integration-package.json`. No model or
provider call was needed for rendering or validation.

- Comparison digest: `3baa4d56dc9cd06ec1ecbe60a45cc269a2467b0b6dce6ff8c9bb8327c8f062a4`
- Validation digest: `685a23fa26e8149dbc6181cb07df25f0b7dec5491d9849c036f9efe1e502faf7`
- Integration-package digest: `369db01477caa100aa041daa649e9f9dd287538b4b55c7d4a56600aa54e835bc`
- Coordinator-settlement digest: `dc2870c30275903bad034bf29254206f6a1d9555ed57b955c9b5a6b36ae71c52`

## Rollback

Keep the configuration disabled or remove the continuity adapter, context key,
and notification emission. This does not modify objective-resolution history or
the retained interaction-learning package.

## Claim boundary

This proves a disabled construction integration and exact behavior on the
retained synthetic cohort. It does not prove real-user effectiveness, host UI
display behavior, production safety, or eligibility for automatic activation.

## Open Questions

- The [non-activating successor canary](../ilh04-host-confirmation-v1/RESULTS.md)
  confirmed consumption by the shared headless RPC host. Codex Desktop/Windows
  consumption remains unverified.
- The real-user cohort and activation threshold remain undecided.
