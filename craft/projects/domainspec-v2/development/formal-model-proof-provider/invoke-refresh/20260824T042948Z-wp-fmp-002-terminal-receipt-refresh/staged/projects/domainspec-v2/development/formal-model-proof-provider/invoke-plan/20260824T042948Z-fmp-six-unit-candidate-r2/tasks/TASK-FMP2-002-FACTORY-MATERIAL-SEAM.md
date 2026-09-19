# TASK-FMP2-002 — Generic Factory Material-Lock Seam

## Smallest Working Unit

- SWU: `SWU-FMP2-002`
- Layer: L1
- Dependency: accepted `SWU-FMP2-001`
- Owner prerequisite: accepted `FMP2-FACTORY-MATERIAL-LOCK-001`
- Successor: `SWU-FMP2-003`
- Expected execution owner: architecture-conformance factory owner through one Task Session
- Primary behavior: a generic non-executable runtime material and effective node policy are locked once and consumed identically by direct and replay execution without changing legacy provider meaning

## Inputs and outputs

Inputs are provider declarations, explicit selector environment values, provider/component locks, historical/new run-lock shapes, and existing direct/replay pipeline contracts. Outputs are the accepted additive generic contracts, resolver/context behavior, new-plan lock fields, and parity evidence. Runtime filesystem paths remain process-only.

## Exact write scope

The thirteen targets are closed in `SWU-CONTRACTS.json`: four contracts, the run-lock decoder, two resolver files, plan/execute pipelines, two replay files, and two focused tests. Four historical shared surfaces plus the other present targets require exact preimages; five new files are create-only. No TLA provider/corpus file is in scope.

## Algorithm

1. Keep `LockedFactoryToolV1` executable-only. Decode the owner-accepted `LockedFactoryArtifact/v1` shape separately.
2. Validate unique sorted executable/artifact IDs, bounded integer timeout, provider compatibility, absolute real regular selector targets, exact version, and SHA-256.
3. New plan locks emit canonical sorted artifacts, including `[]`, and effective timeout. Historical v1 locks remain readable under the accepted compatibility rule and are never rewritten.
4. Build a deep-frozen, one-node execution context from verified handles and lock bounds.
5. Before direct and replay provider calls, re-resolve and compare provider ID/version, full components, executables, artifacts, and timeout. After return, recheck runtime material identity.
6. Replay child receives only explicitly declared selector variables; parent validates the closed child envelope. Existing providers remain at the accepted legacy behavior.

## Edge cases and hostile evidence

Own `HC-FMP-009..018`: executable/artifact kind collapse, missing/relative/symlink-invalid/wrong-version/wrong-hash selectors, invalid JAR manifest, invalid timeout, duplicate IDs, pre/post replacement, direct/replay drift, timeout drift, and PATH shadowing. Full existing factory regression is acceptance-critical.

## Done and validation

All four commands for 002 in `SWU-CONTRACTS.json` pass independently. The owner-accepted contract digest is present in the Task Session context and receipt. New providers get canonical material fields; existing and historical behavior matches the accepted compatibility contract. Postimage and owner receipt bind successor 003.

## Split analysis

Candidate children are contract/resolver authoring and direct/replay consumption. Splitting would permit acceptance of an identity representation that no execution path proves it actually consumes, or direct execution without replay parity. Provider-specific scratch/TLC behavior is independently acceptable and remains 003.

## Runtime context anchors and result shape

Use `OWNER-PREREQUISITE-REQUEST.*`, accepted owner response, prior factory contract/pipeline sources named in the overlap audit, baseline, hostile catalogue, and this task. Return the standard SWU result with exact shared-file pre/postimages and every regression status. No TLA model execution or authority claim.

Rollback restores only admitted modified preimages and removes only unit-created files before acceptance.
