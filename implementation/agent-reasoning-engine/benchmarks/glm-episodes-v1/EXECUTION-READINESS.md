# Local execution readiness

`packages/coding-agent-runtime/execution-readiness.mjs` measures immediate local prerequisites for a corrective request. It runs three sequential permission-restricted Node processes with an exact trusted crypto output. Each has a 1000 ms subprocess timeout, 1024-byte output bound and 500 ms observed-latency ceiling. All must pass before one real secret consumption is attempted. The existing bounded secret provider keeps its 5000 ms deadline; successful consumption must finish within 1000 ms for readiness. No secret value, locator, child stderr or arbitrary error text is exported. Failures retain fixed categories. There are no retries.

The secret callback is a trusted, bounded host adapter. The shipped runner uses the existing SOPS-age provider and registry with a consumer that returns no material; bytes are cleared through that existing boundary. Test-only execution and clock adapters are not model/config fields. Thresholds are explicit conservative engineering choices, not statistically calibrated reliability guarantees. A passing sample cannot guarantee that a later request or validation child will finish.

`public-feedback-v2` requires a readiness callback before recording or dispatching a corrective request. A negative, malformed or failed readiness result produces `feedback.execution-not-ready` with zero model attempts. Passing proposals and validation execution failures do not need this extra credential access because they make no corrective call. Existing terminal coding-agent runs remain unchanged. This stage is explicit; the default agent policy is not activated.

The diagnostic runner performs eight fixed rounds. It runs the six retained public-validation replays only if every round passes. Its maximums are 24 probe children and eight local secret consumptions, with zero model/tokenizer endpoint calls. Fresh output directories and per-round started/results preserve blocked runs. It checks hashes of its enumerated source files and external Python bridge sources before and after each round. Host pressure evidence is observational and does not alter unrelated processes.

```sh
/path/to/node-26.8.1 execution-readiness-run.mjs \
  /path/to/credential-reference.json /path/to/new-evidence-directory
```

## Open Questions

The [result report](evidence/execution-readiness-2026-09-08/README.md#open-questions) owns host-contention, threshold calibration and prospective evaluation questions. Readiness admission limits wasted work; it does not provide host resource isolation, repair correctness or operational authority.
