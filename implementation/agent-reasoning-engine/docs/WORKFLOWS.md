# End-to-end workflows

This guide explains how operators and developers use ARE's commands and components together.
Each workflow states where work must stop.
A route, receipt, benchmark result, or passing test does not authorize an external effect.

## Evaluate one repository request

1. Preserve the user's exact text. Assign one caller session ID. Assign one request ID.
2. Call `decide route` with an `are.cli-request/v1` document.
3. Read the selected route contract. Read its `read_first` sources.
4. Carry the route receipt unchanged into `decide context`.
5. Perform work within the selected route and existing authorization.
6. Before a consequential boundary, call `decide effect` with the exact
   proposal and effect metadata.
7. At the objective boundary, call `decide continue` with completion evidence
   and any bounded next options.
8. Route a selected new objective as a new request.

~~~text
request -> route -> context -> work -> effect boundary -> observed result
                                      |
                                      +-> completion -> continue -> stop or new request
~~~

The same route receipt binds `context`, `effect`, and `continue` to the original
request and current routing sources. A changed request, session, routing
profile, or receipt requires a fresh route decision. See [CLI and
routing](CLI.md) and the source-owned [CLI
contract](../../../agent-routing/capabilities/are-cli/README.md).

## Connect an agent through the gateway

1. Run `doctor --json`. Verify the repository profile.
2. Place the Unix socket, session store, and Reasoning State directory under a
   private operator-controlled directory.
3. Select the Codex backend or provide a validated JSON-lines process adapter.
4. Start `are gateway` with explicit configuration, repository root, and listen
   path.
5. Initialize the host protocol. Retain the issued resume credential. Use stable request IDs.
6. Acknowledge delivered messages. Reconnect with the same consumer identity
   and resume credential after a transport loss.
7. Treat an unknown crash-time outcome as blocked. Do not dispatch it again
   merely because the client did not see a response.

The gateway provides continuity and bounded replay. The host still owns message
translation, user-visible behavior, effect enforcement, and credential
protection. See [Gateway and agents](GATEWAY-AND-AGENTS.md), [API and data
contracts](API-AND-DATA-CONTRACTS.md), and [Privacy and
retention](PRIVACY-AND-RETENTION.md).

## Learn from an interaction correction

1. Complete the original interaction episode. Record its identity.
2. Accept a correction only with an attributable source, exact target, and
   explicit participant/product scope.
3. Record the lesson as a successor record. Do not rewrite the original turn.
4. Project the lesson only into a later compatible interaction.
5. Observe literal outcome checks. Distinguish lesson delivery, lesson use, and improvement.
6. Append revisions or revocations. Stop projecting lessons that these records replace or revoke.
7. Send repeated, measured outcomes into the recommend-only research chain.

Interaction learning is a default-off prototype. Its complete capability
contract is [Manage interaction context](capabilities/MANAGE-INTERACTION-CONTEXT.md).

## Run a research iteration

1. Start from the [research objective](RESEARCH-PROGRAM.md#research-objective).
2. State a falsifiable hypothesis, mechanism, control, treatment, metrics,
   acceptance gates, token accounting, and stopping rule.
3. Freeze task identities, prompts, scorer, runtime profile, and source hashes
   before live execution.
4. Run the development tests. Then run an independent confirmation or holdout test.
5. Preserve failures and counterevidence.
6. Close the experiment with `KEEP`, `REJECT`, `INCONCLUSIVE`, or `NOT_RUN`.
7. Compact reconstructible caches only after retained evidence can reproduce
   the decision.

Research evidence can recommend a successor. It does not mutate the serving
engine or qualify an untested model/context window.

## Change and freeze the product

1. Locate the smallest owning package and its source contract.
2. Add focused contract tests for changed behavior.
3. Update `product.json` when a required component, integration, entrypoint, or
   closure root changes.
4. Run focused tests, documentation verification, `doctor`, and the complete
   product suite as applicable.
5. Freeze a new candidate identity when closure bytes change.
6. Inspect the frozen candidate. Run release verification.
7. Keep product approval, commit, tag, push, publication, activation, and
   deployment as separately owned decisions.

See [Contributing](CONTRIBUTING.md), [Compatibility and
lifecycle](COMPATIBILITY-AND-LIFECYCLE.md), and [Release and
evidence](RELEASE-AND-EVIDENCE.md).

## Failure handoff

When a workflow blocks, preserve the exact request, reason codes, source or
receipt digests, last durable checkpoint, and observed external outcome. Start
with [Troubleshooting](TROUBLESHOOTING.md). Create a research hypothesis only
when the failure indicates an uncertain mechanism rather than a known contract
violation.

## Open Questions

- Which workflow should become the first fully executable tutorial with a
  disposable fixture and expected output snapshots?
- Should gateway and interaction-learning workflows gain operator-facing
  sequence diagrams generated from their protocol tests?
