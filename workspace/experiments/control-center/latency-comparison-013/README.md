# WLC-013: native evidence to campaign ledger

Product-construction integration candidate. Uses WLC-012's append-only ledger,
WLC-011's host monitor and WLC-010's common aggregate collector with the unchanged
WLC-003 baseline and WLC-008 control binaries. All previous candidates remain intact.

## One-step execution

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-013/import.test.mjs cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-012/campaign.test.mjs cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-011/host.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-013/run.mjs campaign-integration-001
```

The runner creates or resumes the named local campaign and executes at most one
reserved pair. Order comes from ledger state, not a user-selected AB/BA argument.
It verifies bound sources and binaries, checks all prior imported artifact hashes,
reserves and fsyncs before launch, then settles all reserved arms. Rejections and
failures stop the pair; successors are recorded not-run. No automatic retry or
campaign loop occurs. An incomplete reservation blocks resume and requires explicit
recovery work; missing evidence is not converted into success.

## Import contract

Each run writes context.json before launch, binding pair, arm, harness, registration,
build/binary, backend and fresh-state posture. importArm checks that context against
the reservation, recomputes host identity and qualification, validates process
before/after identity, aggregate identity/posture, semantic responses, and closeout
log digest. It records hashes of every consumed raw file. Paths resolving outside
the run directory are rejected. Subsequent resume checks imported bytes for drift.

Prelaunch rejection has no native timing and must have actual rejection reasons.
During-run failure remains failed even if the host is also contaminated. Missing
closeout fails closed. The context and process receipts are local runner witnesses,
not cryptographic hardware attestation or independent proof against a malicious
rewriting of the entire evidence store. Raw phase rows are not re-imported here:
the hash-bound collector's identity-checked aggregate is the selected measurement.

The persistent evaluator still reports campaign_readiness not_evaluable. Numeric
threshold results, when a population eventually exists, are not product approval.
The 40-session population, conservative 60-reservation ceiling, 1 ms overhead
threshold and existing product budgets remain unchanged.

## Evidence and frontier

Nineteen focused tests passed before the integrated attempt. Synthetic passing
fixtures are not native measurement evidence. EVIDENCE.json records the live
integration result separately, following research-evidence-harness boundaries.

Construction completed: raw evidence importer and reserve-before-launch runner
adapter. Next runnable construction: bind exact product budgets and complete
the differential evidence package, including cross-session host comparability and
an evidence-verifying report command. A successful native import path and during-run
host coverage still require live validation if the current host rejects prelaunch.

Operational support: Workspace test operator owns a qualifying collection window.
No live model or approval commands are issued by this mock-backed adapter. Full
frozen-product tests, product-owner approval, lab reconciliation, commit, publication
and release remain separate pending work. Inherited D01/D03/D08 scaffolds remain
unchanged and non-authoritative. authority_effect none.
