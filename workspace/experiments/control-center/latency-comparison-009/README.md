# WLC-009: uninstrumented native control smoke

Product construction: collect the original cold-handshake aggregate from the
exact WLC-008 executable and run WLC-005's bounded semantic checks. No binary,
production source, instrumentation, budget or previous evidence is modified.

The collector uses the WLC-007 ten-second total collection ceiling, shorter
driver deadlines with readback, and terminal error handling. It polls only a
pending aggregate snapshot. The phase export must be absent; exactly one finite,
nonnegative cold-handshake duration with a positive timestamp is required.
This is capture readiness, not proof that the handshake succeeded or met a budget.
The separate semantic probe checks eight true status responses, false inactive
disconnect and the exact inactive replay error. It is bounded parity evidence,
not universal behavioral equivalence.

The runner verifies build inputs before launch and kernel-observed executable
identity before and after collection. It launches one isolated mock-backed
session with protocol drift tolerance disabled; no live-model turn or approval
command is issued. Errors stop the attempt; logs, traces and closeout survive.

```sh
node --test cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-009/collection.test.mjs cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-005/semantics.test.mjs
node cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-009/run.mjs
```

Eight focused tests passed before native execution. EVIDENCE.json records the
native outcome separately. No sample in this slice is a qualified population or
an overhead result. The existing aggregate is not relabeled a population p95.

## Construction and operational lanes

Current frontier: native control smoke and bounded semantic parity.
Next construction after a passing smoke: register the exact WLC-003 baseline
versus WLC-008 control comparison and implement identity-bound aggregate capture
for both arms. The treatment arm is not an overhead comparator because it also
changes warmup scheduling. Inherited WLC-005 D01/D03/D08 semantic scaffolds remain
unchanged; no ontology admission is claimed.

Operational support: Workspace test operator owns host qualification for a later
campaign. Unqualified host state does not block this diagnostic construction but
does prevent performance inference. Qualified populations, differential evidence,
full frozen-candidate product tests and product-owner approval remain pending.
Lab reconciliation, commit, publication and release are separate decisions.
