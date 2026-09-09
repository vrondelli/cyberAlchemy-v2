# TASK-LGP-ACCEPTANCE: Browser Mechanics Evidence

## Objective

Implement and run one pinned local browser harness that proves the declared
candidate mechanics and side-effect boundaries for the owner-admitted host.

## Layer And Slice

- Layer: L2
- Slice: S-010
- Wave: W5
- SWU: SWU-LGP-010

## Dependencies

- SWU-LGP-009 owner receipt;
- current source/product digests;
- shared user-global Playwright and Chromium runtime verified at execution;
- exact local server URL and isolation/teardown contract.

## Implementation Detail

### Inputs

- existing host and learner-projection artifacts;
- expected stable IDs, proof tiers, positive/abstention text;
- pinned Playwright version, Chromium revision/executable and hashes;
- expected zero-outbound and zero-workflow-event policy.

### Ordered Browser Scenario

1. Verify runtime paths/versions and hash all product/test inputs.
2. Start an isolated loopback server with no external network dependency.
3. Open the exact host URL and capture console, page errors, requests,
   responses, downloads, dialogs, and application event probes.
4. Verify the five existing lenses, search, navigator, inspector, help, and
   beginner-guide link still exist.
5. Focus `MaxAmountRule`; assert no-reported-finding ceiling text.
6. Focus `LegacyLimitRule`; assert `ABSTAIN`, gap, exact v2 question, literal
   owner string, prerequisites/invalidation, and no action control.
7. Switch Graph/Outline/Table and compare IDs/classes/proof tiers/validity.
8. Run keyboard path and focus/inspector synchronization.
9. Run narrow and wide viewport checks and stale/invalid input scenario.
10. Assert zero unexpected console/page errors, zero unexpected outbound
    requests/downloads/dialogs, and zero workflow-like events/state.
11. Persist exact observed results and teardown server/browser.

### Failure Modes

- shared runtime not current/pinned in receipt;
- unexpected request, console/page error, download, dialog, or route event;
- stale projection displays derived content;
- view/keyboard/host regression;
- teardown failure;
- receipt claims comprehension, accessibility conformance, mutation/semantic/
  destination-owner admission,
  promotion, release, deployment, or production.

## Exact Write Scope

1. `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/learner-projection/tests/browser-acceptance.mjs`
2. `cyberAlchemy-v2/development/research/2026-08-01-learning-graph-next-route-guide/invoke/work-pack/session-evidence/SWU-LGP-010/runtime.json`
3. `cyberAlchemy-v2/development/research/2026-08-01-learning-graph-next-route-guide/invoke/work-pack/session-evidence/SWU-LGP-010/baseline.json`
4. `cyberAlchemy-v2/development/research/2026-08-01-learning-graph-next-route-guide/invoke/work-pack/session-evidence/SWU-LGP-010/browser-observations.json`
5. `cyberAlchemy-v2/development/research/2026-08-01-learning-graph-next-route-guide/invoke/work-pack/session-evidence/SWU-LGP-010/task-session-receipt.json`
6. `cyberAlchemy-v2/development/research/2026-08-01-learning-graph-next-route-guide/invoke/work-pack/session-evidence/SWU-LGP-010/validation.json`

No new package root or dependency file is in scope.

## Validation

Execution-time commands must first verify the shared runtime named by
`AGENTS.md`, then run the exact harness with a loopback URL and declared output
directory. The task receipt records the resolved commands, versions, hashes,
exit status, observations, and teardown.

## Done Criteria

- every LGP browser/host acceptance check has an explicit observed result;
- zero unexpected errors/outbound/workflow effects;
- input/runtime/receipt hashes are exact and replayable;
- teardown passes;
- claim ceiling remains candidate browser mechanics only.

## Closeout

Invoke Refresh synchronizes the common inventory and routes to independent
TASK-LGP-VERIFY. No L3 human study, adapter request, or promotion is admitted.
The browser Task Session does not write an owner receipt. The browser evidence
reviewer supplies the bound audit reference; the learner-view/navigation
lifecycle owner alone writes
`work-pack/owner-evidence/SWU-LGP-010/owner-receipt.json`.
