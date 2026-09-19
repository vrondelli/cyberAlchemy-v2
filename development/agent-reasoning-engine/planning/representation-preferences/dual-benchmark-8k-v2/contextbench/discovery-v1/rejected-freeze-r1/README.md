# Rejected freeze attempt 1

All eight tokenizer-only preflights passed with zero model calls. The source-freeze scanner then interpreted an import-like string in a test fixture as an executable import, causing ENOENT before a live-freeze file or model generation existed.

The original coordinator and all preliminary native records/preflight evidence are retained here. The coordinator now uses Node SourceTextModule parsing without evaluation. Because the coordinator itself was bound in preflight, the tokenizer-only preflight is repeated against the corrected source instead of rewriting historical hashes. No task, policy, model answer, metric or success threshold changed. This is a pre-live instrument amendment, not a retry of a benchmark answer.

## Open questions

Live quality and efficiency remain owned by ../LIVE-PROTOCOL.md.
