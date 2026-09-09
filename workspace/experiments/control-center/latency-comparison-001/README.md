# First latency comparison: frame wait

WLC-001 is registration preparation, not a registered native experiment. It
selects WLH-001's `frame-wait` alternative and implements a companion phase probe
plus a closed-field JSONL receipt validator. No production source is changed.

## Product construction

The prototype meanings and ontology scaffolds remain Research Hypothesis D01,
Research Experiment D03 and Research Work Plan D08 from the owned
`are.research-learning` ontology (SHA-256
`18c671dc8929b07582295c68b286de152028125036ae7ec1188c2c1944cb0481`).
The selected hypothesis candidate and its timing source bindings are verified
before readiness is reported. No ambient ontology gate is used.

Sequence: selected hypothesis → comparison design → phase receipt implementation
and fixture tests → exact instrumented candidates → native evidence validation →
complete experiment registration → separately qualified runs → assessment.

`design.json` proposes 5 ms and 10% primary improvement, 5 ms frame improvement,
at most 1 ms status-IPC regression and instrumentation overhead, and zero semantic
mismatches. These are prospective research choices, not changed product budgets.
Both improvement conditions must hold; all existing budgets must still pass.
The inherited 40 qualified sessions and 60-attempt ceiling remain per arm.

The selected source currently performs status IPC and then awaits a frame inside
the existing aggregate measurement. `phase-probe.mjs` preserves that sequence,
the status result, and status errors. It emits only identifiers and process-local
monotonic spans. Wrap it with the unchanged aggregate metric when integrating.
It is a tested standalone helper, not yet wired into the desktop application.
Missing/invalid receipts must reject research inference, never become zero latency.

`register.mjs` collects every missing prerequisite as `not_evaluable`. It
intentionally cannot authorize or complete registration, even if someone fills
identity fields with plausible hashes. Independent byte and evidence verification
must be implemented first. `validateRows` proves receipt shape and arithmetic
only; it does not qualify hosts, verify binaries, or calculate campaign results.
The JSONL schema is encoded as an exact field allowlist and typed checks in that
validator. Passing and failing synthetic fixtures are in `register.test.mjs`.

Runnable construction: select an exact unrelated startup operation worth
deferring, or reject this treatment if none is defensible; integrate the same
probe into isolated baseline/treatment source candidates; build and verify them.
No task-completion event is emitted and the prior research plan stays unchanged.

## Operational support

Workspace test operator owns host qualification for future native product tests.
It does not block current code or design work. Live runs, approval, activation,
lab reconciliation and publication remain separate deferred work.

## Verify

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-001/register.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-001/register.mjs
```

`readiness.json` records current source hashes and all unmet prerequisites.
`EVIDENCE.json` records fixture results, not product performance. The evidence
harness skill keeps synthetic checks separate from native empirical support.

## Open questions

- Which exact startup operation is unrelated and safe to defer?
- Do isolated candidates meet the proposed overhead and equivalence criteria?
- Which build pipeline will independently bind source, binary and fixture bytes?
