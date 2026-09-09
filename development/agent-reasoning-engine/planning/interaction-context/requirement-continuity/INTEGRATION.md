# Use the requirement-continuity prototype

Status: opt-in construction candidate; authority effect: none. This uses the
existing Codex app-server wrapper and existing Reasoning State Ledger. It does
not install a service or enable a model adapter.

Enable `objective_resolution: {enabled: true, requirement_tracking: true}` in an
explicit test/host profile. Provide `requirement_seed_provider` when constructing
`createCodexAppServerWrapper`. The callback is synchronous and receives frozen
`{request, request_ref, state}`. It returns `materializeRequirementSnapshot` from
the existing request-intent runtime:

```js
requirement_seed_provider: ({request_ref, state}) =>
  materializeRequirementSnapshot({
    consumer_ref: state.consumer_ref,
    scope_ref: state.scope_ref,
    objective_id: state.active_objective.objective_id,
    objective_state_digest: state.state_digest,
    requirements: explicitlyDeclaredRequirements,
    source_refs: [request_ref, exactHostEvidenceRef],
  })
```

The host must select source-verified requirements for this exact request and
objective; it must not reuse a global fixed list. The example variables above
are host inputs, not values the wrapper invents. A missing seed blocks. A caller
may explicitly supply an empty set. Raw client `_are` fields are not seed input.
Snapshot integrity verifies binding and structure, not semantic truth or source
ownership. The callback is not an asynchronous interpretation/provider boundary.

Once seeded, the existing expanded local grammar handles add/remove/keep forms
without a provider. An explicit active continuation retains the current set.
Explicit interruption/new/replacement grammar uses separate seeds; resumption
restores the suspended objective's snapshot. Requirements for a replaced
objective remain in historical events, not in the current projection.

Other active-objective refinements require the existing optional objective
provider to return a full requirement delta within its unchanged timeout. No
provider is installed here. General-language interruption/resumption through that
strict provider remains unsupported; explicit local cues retain their existing
bounded semantics. Model proposals remain structurally checked interpretations,
not semantic proof. A local requirement edit retains the objective description;
the explicit requirement snapshot is the current requirement set, and the
description is not a reconstructed requirement list.

The model receives `are.codex-objective-fragment/v2` under the existing objective
context key, including the exact active snapshot and continuity digest. Legacy
untracked requests retain v1. Objective/requirement text and optional Intent
Contract text are charged against the envelope's shared selected-content byte
budget. That budget does not measure the full wire request: existing cache and
context fragments repeat metadata and content on the wire.

Continuity is stored in the existing `objective-transition-resolved` event and
sealed/checkpointed before forwarding. Replay verifies the entire retained set,
explicit changes, predecessor, and resolution. No callback runs on replay.
An already recorded request is not dispatched again; interpretation evidence
alone cannot prove whether its earlier dispatch completed. A failed checkpoint
latches writes until recovery. Disabling tracking on tracked history fails closed;
no silent downgrade or history rewrite is provided.

Limits: at most 17 retained objective snapshots, 32 KiB aggregate continuity,
and the existing 64-entry requirement/source-ref limits. Overflow blocks without
truncation. This is not a compactor or indefinite memory mechanism. Enabling
tracking on legacy state with unseeded suspended objectives requires an explicit
future migration; missing snapshots block.

## Validation and construction lanes

From the repository root, with Node v26.8.1 on PATH:

```sh
python3 -B cyberAlchemy-v2/development/agent-reasoning-engine/planning/interaction-context/requirement-continuity/validate.py --test
```

Without `--test`, the command checks the frozen source manifest and isolated
DomainSpec build replay. It writes no candidate, receipt, or repository state.
Tests use disposable local ledgers and mock upstream messages; no live model is
needed. Product review, host activation and publication remain separate.

Product frontier: this requirement-continuity slice through current tests.
Operational residue and owners: [PLAN.md](PLAN.md). The full interaction learning
loop, preference application and outcome-to-evolution integration remain with
the [parent plan](../PLAN.md).

## Open Questions

See [PLAN.md](PLAN.md). This slice establishes deterministic preservation and
delivery, not general interpretation accuracy, user value, or model reliability.
