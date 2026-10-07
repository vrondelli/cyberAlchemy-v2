# G01 source-index supervision r6/r7 — exposed no-model development

Status, 2026-10-03: **prospective local source experiments only**. Frozen r17
remains terminal failed, with no new model calls, native scores, or replacement
pairs. These source versions are not integrated into a campaign snapshot.

The [r5 one-pass query-bound index](G01-QUERY-BOUND-INDEX-R5-DEV.md) preserved
complete output and reduced memory on exposed Transformers/MUI tasks, but its
real 60-second parent-supervisor MUI check failed at 60.0365 seconds. The
separately versioned [r6 ASCII fast-path core](../research/g01-fast-live-v1/source-index-capacity-r6/ranked_source_hints_r6.py)
passed three focused tests, including 307 deterministic ASCII/Unicode
normalizer comparisons and small-index parity. Its unchanged 60-second
[worker](../research/g01-fast-live-v1/source-index-capacity-r6/ranked_source_worker_r5.py)
still failed the exposed MUI parent check at **60.0689 seconds** with
`worker-deadline` and no result. R6 is rejected for a 60-second campaign;
the fast path did not prove corpus-wide parity or live reliability.

The separately versioned [r7 core](../research/g01-fast-live-v1/source-index-capacity-r7/ranked_source_hints_r7.py)
is functionally the r5 core (docstring-only difference). The
[r7 worker](../research/g01-fast-live-v1/source-index-capacity-r7/ranked_source_worker_r6.py)
changes only the prospective parent deadline bound/default from **60 to 120
seconds**, retaining the 1.5 GiB address cap, output cap, Git identity checks,
and one-shot process-group settlement. Its three focused tests passed,
including rejection of a 121-second request. On the exposed MUI bare cache,
the real parent check completed **`ok: true` in 106.5822 seconds**, peak
worker RSS **193,144 KiB**, exit 0, no forced kill, process group absent,
and index digest
`b11dd953966f8d2d25df667b0d9a7a34a0e1f5918a619498ff385aa10325455d`.
The same logical core already matched the complete r3 MUI manifest and query
result in r5. This establishes only one local supervised success, with about
13.4 seconds of deadline margin; it is not actual-layout VPS reliability.

Source SHA-256: r6 core
`2df921be058e01efa5363bc83af9d29d9f73c46f2a26a759496f1e2ecba0b6b5`,
r6 worker `e0dd272c8148582ffdabac86af1feab472d3e02fcc72c73c10834af71ab9c6bd`;
r7 core `e39b8e6467fe8a8e49d15002bcf891174bb6f6cc70a712e3ca90c03fb734584d`,
r7 worker `3a6bf5b09bf69e589db573370f13ba236af98be8aa695cae51126f37a2c8b6d9`.

A read-only VPS capacity check during this experiment showed **1,156,603,904
bytes `MemAvailable`**, no swap, `/tmp` 6,885,937,152/8,381,816,832 bytes
used, `/dev/shm` 4,173,856,768/8,381,812,736 used, and only
1,658,920,960 bytes free on `/`. It fails the provisional 4 GiB host-memory
preflight. No evidence was removed and no VPS index rehearsal or model call
was attempted.

## Next gate

Qualify r7 or a faster bounded successor on the remaining exposed large-index
tasks through the actual native supervisor, then on the VPS under its actual
overlay and service load **only after a non-destructive capacity preflight**.
Preserve full output/manifest parity, memory, elapsed, and settlement receipts.
Any deadline extension must be prospectively frozen for both arms and included
in all-in time accounting. A new, distinct, clean 24-task population and
full native-reference admission remain separate prerequisites. R17 is not
retryable or top-uppable.

## Open Questions

- Can a bounded persistent Git object reader remove per-blob process overhead
  without changing output or weakening worker settlement?
- What exact separately authorized VPS storage action, if any, can create
  adequate memory headroom while preserving historical evidence?
- What fresh cohort supports the strict 24/24 superiority gate?
