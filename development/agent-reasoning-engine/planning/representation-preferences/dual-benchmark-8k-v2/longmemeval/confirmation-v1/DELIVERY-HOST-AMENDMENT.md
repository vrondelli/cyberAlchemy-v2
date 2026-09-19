# Exact delivery-host amendment

The first real single attempt (`source-s-v1.attempt.json`) failed before any dataset body bytes reached the projector. Native storage was admitted; provider calls were zero. The pinned official Hugging Face endpoint returned an HTTPS302 redirect to `us.aws.cdn.hf.co`, which the static allowlist omitted. A separate HEAD-only probe confirmed the hostname and stopped at the redirect; signed query values were not recorded.

Add only that exact hostname to the existing list. HTTPS, normal TLS validation, pinned initial revision, complete body size/SHA, redirect ceiling, single attempt, storage guards and source-only extraction remain unchanged. An independent re-review is required before a separately recorded `source-s-v2` attempt. Preserve the failed first attempt; do not overwrite its marker or call it successful extraction.

## Open questions

The source stream and real schema remain unverified until a reviewed attempt reaches EOF and publishes its source package. No model or tokenizer qualification is implied.
