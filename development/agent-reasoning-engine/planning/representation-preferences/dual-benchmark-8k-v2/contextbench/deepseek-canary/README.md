# DeepSeek Harness with GLM: live compatibility canary

Status: real provider/file-read canary passed on 187.77.163.194. Not a ContextBench score or a production accounting-adapter qualification.

## Verified result

Pinned DeepSeek Harness 0.1.5-rc.2 used GLM-5.3-Flash through an isolated observed endpoint, requested its native read tool for /workspace/probe.txt, received HARNESS_TOOL_PROBE_53, and reported it correctly. The second request includes both the tool result and the original reasoning_content. The harness exited 0.

Two model calls used 13,729 input and 120 output tokens, totaling 13,849. Output includes 73 reasoning tokens; cached input is included, not subtracted. Both returned known usage and there were no model retries. Three tokenizer calls were made across the preserved attempts.

Request admission reservations were 7,769 and 7,870 tokens: actual tokenizer input plus a 512-token margin and 512 reserved output, each below 8,000. Provider-reported input exceeded tokenizer input by 69 tokens on each request, within the margin. This small sample does not establish a universal bound.

## Preserved unsuccessful attempts

1. Proxy credential ownership mismatch: harness exited with transport error; proxy did not start, no provider request. Corrected by running the separate credential-holding proxy as the existing secret owner 65532; file permissions and the presentation services were unchanged.
2. Stock prompt/tool request measured 6,745 input tokens. With margin 512 and output reservation 1,024, the 8K admission gate rejected it before generation. One real tokenizer call, no model call.
3. The short canary used output cap 512 and completed. This cap is not silently substituted into the future benchmark protocol.

The original adapter catalog contextWindow of 8,000 caused its own output calculation to fall to one token. A separate canary profile declares conservative provider capacity of 32,768 while the external request gate continues enforcing measured 8,000. This proves a bounded request path, not native harness compaction behavior at 8K. Exact benchmark compaction/context integration remains unresolved.

## Isolation and evidence

The harness container used an internal-only Docker network and no real credential. A separate capped proxy used the existing credential mount and Z.ai endpoint. The proxy retained exact request bodies, raw responses, tokenizer evidence and usage receipts. It never recorded authentication headers. Session-title model generation and telemetry were disabled in the declared canary overlay. Other stock tools remained advertised; only the native read tool was exercised.

[RESULT.json](RESULT.json) binds copied artifacts and verifies delivered tool content, reasoning replay, reservations, usage and process states. All attempts are separate directories. The proxy was stopped after completed calls; Docker reports exit 137. There were no outstanding model attempts at that boundary. Graceful proxy shutdown still needs implementation before campaign use.

The recorder is deliberately a bounded compatibility fixture. It does not yet implement full durable reconciliation, crash-safe directory sync, source-based native benchmark export, stream resource bounds during accumulation or a general multi-worker supervisor. No claim of complete benchmark instrumentation follows from this canary.

## Next tasks and open questions

1. Build the common task/source-edit/final-context adapter while retaining each harness's reasoning loop.
2. Resolve the large stock prompt/tool footprint prospectively: choose and report a matched task-capability profile, output reservation and exact-8K compaction policy for both arms. The canary leaves only 130 tokens of admission headroom after the tool result.
3. Integrate the established durable accounting, limits, cancellation and native scorer with the external harness; do not promote this temporary proxy unchanged.
4. Review/register/freeze the new eight-outcome external-control experiment, then run and score all four paired development tasks.
5. Preserve original perfect-quality/15% token-savings gates and separate untouched confirmation.

Does the stock harness retain enough useful working space for long tasks at 8K? Can its exact request budgeting be integrated without replacing its memory policy? These are open research/integration questions, not resolved by reading one file.
