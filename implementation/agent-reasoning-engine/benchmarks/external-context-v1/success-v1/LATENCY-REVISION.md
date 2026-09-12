# Third functional attempt: explicit deadline revision

Attempts1 and2 remain frozen failures. Their final requests each reached the60-second deadline without returned bytes. Completed long responses approached that boundary:1238 output tokens took50.004 seconds and1669 took53.518 seconds. These data support a latency experiment; they do not recover missing responses or prove why those requests timed out.

The [provider's thinking-mode documentation](https://docs.z.ai/guides/capabilities/thinking-mode), checked2026-09-09, states that GLM-5.3-Flash requires thinking. Disabling it is therefore not a supported way to reduce latency.

This revises the plan's original per-request deadline for the third functional attempt to120 seconds, under `diagnostic-latency-v1`. Tokenizer timeout,24 model/48 tokenizer call caps,2048 output cap,12K local threshold,30-minute episode ceiling,2 candidates,4 probes and USD0.10 episode reserve remain unchanged. Standard and original diagnostic policies retain their60-second maximum. A request from either failed episode is never replayed. This is the campaign's final functional episode, with its own sources and research freeze; phase control and model-visible public evidence are unchanged.

## Open Questions

Will the longer bounded deadline allow a complete revision? Is latency due to inference length, queueing, or another provider condition? An unresolved third episode ends the functional campaign as unresolved; it does not authorize unlimited retries or another task.
