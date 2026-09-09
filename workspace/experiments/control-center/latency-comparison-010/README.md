# WLC-010: paired overhead capture

Local candidate registration binds the exact WLC-003 instrumented baseline (A)
and WLC-008 uninstrumented control (B), their saved build identities, the original
comparison design, and selected collector/runner dependencies. Both retain original
warmup. Treatment is excluded because it changes scheduling as well.

Product construction implemented: common aggregate capture, per-arm export checks,
AB/BA diagnostic ordering, exact binary/process checks and pair-level evidence.
The baseline requires a valid build-bound phase export; the control requires its
absence. Both capture the existing workspace.tauri.chat-cold-ipc-handshake metric.
One total collection deadline and shorter driver deadlines remain unchanged.
Only explicit pending states poll; malformed evidence and driver errors stop.

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-010/collection.test.mjs cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-005/semantics.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-010/run.mjs AB
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-010/run.mjs BA
```

Each runner command launches exactly one diagnostic pair with fresh per-arm state
and the local mock backend, without live-model or approval commands. It verifies
registration bindings and both native packages before launch. A failed arm stops
the pair; artifacts survive. Completed pair.json binds registration, order, member
receipt hashes and semantic hashes. Receipts retain observed before/after process
identities, aggregate samples and backend hashes. This is not a campaign executor:
caller-selected order does not enforce alternation across separate invocations.

Eight focused tests cover both arms, missing exports, wrong identity, duplicates,
malformed samples and terminal driver errors. Native diagnostic results are in
EVIDENCE.json. Synthetic fixtures and unqualified captures cannot become empirical
performance support by changing a status field.

## Construction frontier and operational residue

Registration is a local candidate, NOT campaign-ready admission. It preserves
40 qualified sessions per arm, at most 60 attempts per arm, alternating AB/BA,
nearest-rank p95 of session maxima, baseline-minus-control overhead at most 1 ms,
and zero semantic mismatches. Existing product budgets remain unchanged.

Next runnable construction: integrate host-load evidence and deterministic rejection,
exact product-budget and fixture/protocol bindings, persistent campaign ordering,
attempt limits, population validation and differential evaluation. Until these
are tested, campaign readiness and overhead remain not_evaluable. No one-pair p95
or overhead pass is emitted here. Current blockers affect campaign inference,
not this bounded diagnostic capture implementation.

Operational support: Workspace test operator owns the uncontended-host window
for future qualified collection. Product owner retains approval after complete,
current frozen-candidate product tests. Lab reconciliation, commit, publication,
release and deployment remain deferred separate decisions.

Semantic dependencies remain WLC-005's inherited D01/D03/D08 research scaffolds;
no ontology record is changed or admitted. The research-evidence-harness skill
keeps fixture validation, diagnostic runtime evidence and future campaign claims
separate. All artifacts have authority_effect none.
