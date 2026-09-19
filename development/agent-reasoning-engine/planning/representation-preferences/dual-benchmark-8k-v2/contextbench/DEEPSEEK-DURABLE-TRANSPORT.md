# Durable DeepSeek transport

## Full-window73 transport correction

Complete provider SSE responses ending in `length` or another recognized unsuccessful
termination now pass through unchanged, with all returned usage charged. The proxy
no longer permanently poisons the session merely because the model stopped early.
Malformed streams, missing usage, wrong model identity and accounting violations still
stop it. Partial tool arguments never become valid source evidence. Native DSH can
continue after a failed pre-step summary, so older paid-length failures are partly
instrumentation-confounded. Opt-in1M context,32MiB requests and512MiB guarded stages
are described in [the full-window plan](DEEPSEEK-FULL-WINDOW-DAG.md).


Status: candidate implementation; 29 transport, HTTP and wire-export tests pass. Live qualification evidence is separate.

The transport preserves exact request bytes, tokenizer measurements, admission,
model dispatch intent, response bytes and completion receipts. Exclusive writes
use the existing guarded persistence implementation with file and directory
fsync. The evidence directory must be fresh; interrupted runs are reconciled,
never resumed silently. A final seal binds all journal files by hash.

Response bodies are bounded while reading. The private HTTP adapter returns the
original SSE bytes after they have been persisted; this buffers delivery and is
an instrumentation adaptation. It does not rewrite the harness history or tools.
Only the proxy receives the provider credential. The harness runs on an internal
Docker network without the credential or direct provider access.

Each model call reserves measured input + 512 margin + output cap within 8,000
and the remaining cumulative budget. Defaults are 2,048 output, 96,000 cumulative
tokens and 96 model calls. Actual usage is checked afterward; tokenizer drift
stops the arm. Compaction requests use the same boundary. There are no network retries. An unpaid window denial returns HTTP400 with
context_length_exceeded and leaves the transport available for a smaller request.
Native compaction may recover once; total attempts are bounded at twice the model
call limit. Every denial remains in the sealed journal. Cumulative budget denial
and paid length termination still stop the transport.
Provider failure, cancellation, persistence failure and unresolved dispatches
remain visible. Unknown cost forbids savings claims. Length-terminated calls
with valid usage are charged even though the episode fails.

Shutdown aborts an in-flight provider request, awaits settlement, reconciles the
journal and writes RESULTS.json from the reserved final-output allowance. A hard
process kill cannot guarantee a final seal; its retained dispatch intent remains
unresolved and blocks a complete-cost claim.

## Validation

Sixteen transport/reconciliation tests cover successful reconciliation, exact-window rejection,
cumulative reservations, network interruption, length termination, tokenizer
drift, streaming size bounds, graceful cancellation, failed response persistence,
crash reconciliation and journal gaps. Two HTTP tests check persisted SSE delivery, recoverable overflow and final
sealing. Eleven wire-export tests verify delivery and source binding. The retained live qualification seal is also replayed. Tests cannot establish benchmark quality.

[Live matched-tool qualification](deepseek-durable-live-evidence/README.md) completed
five GLM calls, 9,635 tokens and a valid native export with both processes exiting
zero. Offline actual-harness recovery67 passed an injected overflow and completed
a terminal selection with two summaries and zero provider calls. Real benchmark qualification68 confirms recovery after an unpaid denial, but
ends on a truncated checkpoint. Native DSH also rejects that checkpoint. See
[the completed report](deepseek-recovery-68/REPORT.md).

## Open questions

The 512-token margin needs real qualification with benchmark-shaped prompts.
Native compaction behavior, outer process/storage settlement, full run manifest
verification and symmetric ARE transport settings remain requirements in
[the comparison DAG](DEEPSEEK-COMPARISON-DAG.md).
