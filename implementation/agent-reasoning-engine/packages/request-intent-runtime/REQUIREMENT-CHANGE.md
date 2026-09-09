# Explicit objective requirement changes

This opt-in contract follows the isolated continuation/refinement experiment.
A requirement describes an expected property of the work; it is not evidence
that a completion criterion has been satisfied.

`are.objective-requirements/v1` binds an explicit requirement set and source refs
to one consumer, scope, objective ID and objective-state digest. Empty means an
explicitly supplied empty set, not proof that the objective has no implicit needs.

`are.objective-requirement-change/v1` records retained, added and removed entries,
the resulting set, predecessor snapshot digest and exact request digest. Strings
are exact requirement identities, with whitespace trimmed; semantic aliases are
not automatically merged.

```text
current objective + bound requirement snapshot + request
  → explicit retained / added / removed proposal
  → check set accounting and transition consistency
  → successor objective + successor requirement snapshot
```

Pass `requirement_snapshot` to `resolveObjectiveTransition` and provide a candidate
with `requirement_delta: {retained: [], added: [], removed: []}`. Continue must
change nothing; refine must add or remove at least one requirement. Retained
entries must equal the prior set minus explicit removals. Duplicate entries,
unknown removals, re-adding existing entries, missing delta, stale/cross-scope
snapshots and budget overflow block without changing objective state.

Strict mode asks an available provider for the complete candidate even for a
recognized cue; a lexical cue cannot supply an unobserved requirement delta.
The provider receives the frozen snapshot. Existing provider deadlines remain.
Without strict-mode input, historical request/result bytes remain unchanged.

This slice covers continue/refine on the active objective, not resuming another
objective or constructing/replacing one. Caller-supplied snapshots and deltas
are not semantic proof. A model can still omit an unrecognized requirement or
propose an unsupported removal; structural consistency does not detect all such
errors. Downstream consumers must preserve the explicit snapshot, not reconstruct
requirements from the prose description alone.

Construction frontier: library contract, resolver integration, unit tests and
new-domain live replication. Operational residue: wrapper policy/persistence
integration and model activation remain with the ARE runtime owner; no defaults,
timeouts, acceptance records or source registries are changed by this slice.

## Validation results

On Node v26.8.1, all 175 tests passed (43 request-intent, 132 wrapper), with no
skips. The legacy 14-case objective benchmark retained its exact functional
digest. Replay preserves the current snapshot without another provider call.

The 16-turn Codex app-server replication used gpt-5.6-luna on eight newly authored
cases: baseline labels 7/8, treatment labels 8/8, treatment contract checks and
expected requirement sets 8/8. No tool events were observed. The baseline missed
the addition of keyboard navigation to an accessibility review.

Local turn p95 was 6.49 seconds baseline versus 18.20 seconds treatment, excluding
startup (the first thread took 62.75 seconds). With eight observations per variant,
p95 is the maximum. This does not demonstrate compatibility with the wrapper's
one-second provider deadline. The sample is small and both instructions and output
schema differ; it is not a statistical or market claim. One earlier attempted
run lost its output and is not scored.

Raw prompts, responses, source digests and checks are retained in
[the live result](../codex-app-server-wrapper/test/evidence/requirement-change-001.result.json),
with its [manifest](../codex-app-server-wrapper/test/evidence/requirement-change-001.manifest.json).

## Compact model transport

`assessRequirementPatch({snapshot, request, request_ref, patch})` accepts only
`patch: {transition, added, removed}`. It derives retained entries from the exact
snapshot minus explicit removals, then calls the existing full-delta assessment.
Equivalent inputs produce byte-identical assessment records. Missing removals
preserve prior requirements; unknown, duplicated, unsupported, oversized or
authority-bearing patches block. This is a transport optimization, not a new
source of facts or an automatic objective-description rewrite.

The model need not regenerate the entire objective description or retained set.
Callers still verify the snapshot's current consumer/objective/state binding via
the resolver before applying a result. Snapshot integrity alone is not currentness.
The compact adapter does not install a provider, change its deadline, or cache
semantic judgments. The product-construction frontier is this adapter and its
comparison; wrapper integration remains deferred work for the ARE runtime owner.

Run the explicit live comparison from the repository root with Node v26.8.1:

```sh
node cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/scripts/benchmark-requirement-latency.mjs --live
```

The runner emits progress and final JSON to stdout and never runs as part of
unit tests. It then registers the complete result in the evolution runtime's
research ontology instance collection, including blocked runs. A registration
failure returns a nonzero exit without suppressing result output. See
[benchmark registration and replay](../evolution-runtime/README.md#benchmark-registration-and-replay).
It uses the existing app-server RPC client, exact model/version checks,
isolated read-only turns, and no model tools. Both variants request `low` effort,
verified against `model/list`, following the
[official app-server protocol](https://learn.chatgpt.com/docs/app-server).
Instructions and response shape differ; the benchmark does not isolate which
of those changes causes a result. Model effort and output size were not recorded
in the prior run, so comparing its latency directly would be confounded.

The predeclared local gates are 8/8 quality in both variants, at least 20% lower
compact p95, and a separate 1000 ms wrapper gate. No failed gate raises a timeout
or activates the adapter. Eight observations per variant are development evidence,
not a reliable tail-latency estimate. Unresolved semantic and operational questions
remain below.

### Compact comparison result

`requirement-latency-001` completed 16 real app-server turns. Both full and compact
variants passed all eight label/accounting checks. Observed thread effort was
`low` in both. Full p95 was 5299.49 ms; compact p95 was 4459.25 ms (15.86% lower).
Output bytes fell from 1254 to 455 (63.72%). The quality gate passed, but the
predeclared 20% improvement gate and the 1000 ms wrapper gate both failed. No
turn met the wrapper deadline. Do not activate this as its synchronous provider.

All 180 unit/mock tests passed without skips; the legacy functional digest was
unchanged. Warm local expansion and validation p95 was 0.103 ms over 10,000
iterations, excluding the model and wrapper. The model reported roughly 13,600
input tokens per classification despite the small explicit prompt. That points
to harness input as a measurement target; it does not establish the causal source
or prove a latency floor. Initial thread startup took 41.80 seconds and is
reported separately from turn latency.

The [manifest](../codex-app-server-wrapper/test/evidence/requirement-latency-001.manifest.json)
and [result](../codex-app-server-wrapper/test/evidence/requirement-latency-001.result.json)
retain paired order, raw responses, usage notifications, source hashes and gates.
The adapter remains available opt-in; wrapper activation and persistence remain
deferred. Further model calls are not automatically retried until a gate passes.

## Open Questions

- Which app-server harness inputs account for the reported input tokens, and can
  a supported minimal classification configuration reduce them without losing
  required context or isolation?

- How should trusted initial requirement snapshots be materialized from context?
- What semantic evidence verifies additions/removals without adding prohibitive latency?
- How should wrapper continuation retain snapshots across interrupted objectives?
