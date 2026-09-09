# WLC-007: bounded export collection

Product-construction prototype extending WLC-006's diagnostic findings. The
historical timeout remains unexplained; this change improves bounded readiness
and error capture, not a claim that its cause has been fixed.

## Contract

Collection uses one monotonic 10000 ms ceiling, including timeout configuration,
readback, script evaluation and pending-state waits. Each HTTP request is capped
by the remaining deadline. Driver script time is at most 5000 ms, shrinks with
remaining time, and is read back before evaluation. Collection fails early when
1000 ms reserve is exhausted or driver headroom cannot be retained.

Only absent export and an exact, correctly identity-bound empty export may be
polled. Malformed evidence, identity mismatch, driver errors, transport errors,
late responses and timeout-setting mismatch are terminal. No retry follows those
errors. Trace and readiness events survive failed runs. Existing validation
still requires exactly one cold handshake and an available frame.

run.mjs launches baseline then treatment using unchanged WLC-003 native binaries,
fresh local data, the local mock backend, protocol drift tolerance disabled and
before/after kernel process identity verification. The first failed arm stops
the sequence. It retains run artifacts and closes only its owned process group.
No live-model turn, approval or production-source change is introduced.

## Validation

Run fixtures before launching native sessions:

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-007/collection.test.mjs cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-005/semantics.test.mjs cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-003/collector.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-007/run.mjs
```

Fixture suite: 13 passed. The initial fixture run caught the inherited validator's
additional empty-row error; pending classification was corrected before native
execution. These synthetic fixtures do not constitute a performance campaign.
Native outcomes are recorded separately in EVIDENCE.json and runs/.

## Construction and operational lanes

Current construction frontier: bounded collection and native semantic checks.
Next runnable construction: uninstrumented native overhead control using WLC-005's
frontend control, then exact experiment registration and differential population
capture. Selected semantic dependencies remain the inherited owned research
scaffolds and WLC-003 implementation bindings; no ontology admission is claimed.

Operational support: the Workspace test operator owns uncontended-host
qualification for the later performance campaign. This does not block harness
construction. Qualified repeated populations, overhead evidence, full frozen
candidate product tests and product-owner approval remain outstanding. All
product budgets remain unchanged. Approval, reconciliation, commit, publication
and release remain separate decisions; this prototype grants none of them.
