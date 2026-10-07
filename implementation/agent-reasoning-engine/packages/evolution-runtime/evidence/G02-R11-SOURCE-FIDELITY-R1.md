# G02 r11 exposed source/label fidelity audit r1

## Scope and diagnostic contract

The [bound-call development result](G02-R11-BOUND-CALL-EXPOSED-R1.md) found one
absent gold path. Audit all39 gold-file occurrences for all12 already-exposed
tasks, not only undelivered files. Use the pinned dataset SHA256
`2f56535bdc73eb8a68bf4ebb49789d8e9cd4f219ea60df6290b85278aee61ca8`
with an explicit exposed-ID row filter. No fresh partition, provider requests,
reference patches, fixed revisions or gold-to-model exports.

Check exact task/base identities, clean tracked trees, tracked regular safe
gold paths, worktree bytes versus Git HEAD blob, and integer one-based inclusive
span bounds. Compare annotated content with its stated source interval after
normalizing line endings/exterior whitespace only; report per-line trailing-
whitespace agreement separately. Search a mismatched content block elsewhere in
the same file only as diagnostic, never a remapping or new prediction.
Empty annotated content is unknown, not a match. Preserve all file/span counts,
missing/out-of-range/content disagreement cases, hashes and immutable receipts.
Do not change labels, sources, native scorers, thresholds or historical scores.

The upstream benchmark scores gathered context, not merely modified/faulty
files; see its [primary overview](https://github.com/EuniAI/ContextBench).
An AST dependency is consequently not proof of gold-context responsibility.
Content disagreement is a diagnostic until the pinned loader's exact contract
and annotation provenance are established; it must not automatically invalidate
an otherwise valid path/line label or become an excuse for poor retrieval.

## Construction lanes

Product frontier: tested interval/content checker, complete exposed audit and
source/loader provenance. Operational support: existing WSL Git/Python/pyarrow,
archived source trees and read-only pinned VPS evaluator inspection. No install,
source transfer, GLM spend, publication or deployment. This supports benchmark
validity; it is not an ARE capability-quality or superiority milestone.

## Terminal exposed audit

All12 base identities and tracked clean-tree checks pass. All38 present gold
file occurrences match their Git HEAD blob bytes. Across39 gold-file occurrences
and114 annotated spans, one path/one span is absent (`six.py`, task5). The strict
logical-line checker initially classifies108 spans as in range and5 as overruns;
all5 end exactly one line beyond the ordinary logical-line count.

The separately tested pinned native helper explains all5 as valid terminal-
newline offsets. Native semantics represent **113/114** spans, dropping only
the absent file; no present-file span is dropped. Therefore the strict checker
is not a native scoring admission test, and the5 logical overruns are **not**
5 scoring-invalid annotations. Native end-range clipping must remain distinct
from literal source-evidence slicing. No label/source/old score rewrite occurred.

Annotated content agrees with the exact normalized interval for85/108 ordinary
in-bounds spans;23 disagree, with10 content blocks found elsewhere in the same
file. All114 annotations have nonempty content. The pinned Gold loader ignores
`content`, deriving intervals from file/start/end fields. These disagreements
are provenance diagnostics, not automatically native scoring defects or proved
wrong revisions. In particular, no private relocation/alias repair is admitted.

Six logical checker tests and4 pinned native-helper regression tests pass.
Private archive: `/home/vlad_/are-benchmark-archive/g02-r11-source-fidelity-exposed-r1-20261006`.
Original protocol retained as `PROTOCOL.md`.
Logical audit SHA256: `f5d1c9ea770cd4aab202b54e4279813221e7cdf7b22c48e213bbd2240725614f`.
Native supplement SHA256: `daa339520a5c969945557a4c1087583aaa64f354a5447ee8fdf03124739ea306`.

Pinned evaluator commit: `1436c28a8eb95496da4ea69ad458b9f8a8eb7d61`.
Gold loader SHA256: `3eee61cfe239590d069f03fdbf38a70a74efc6d170b37ca17e39ba7f9742e1a7`.
Native file-I/O helper SHA256: `aba937cdd6dc7096a2fdd4435788ebedec5e92d42a98d3091a929dae47c18b48`;
exact copy retained as `UPSTREAM-FILEIO.py` and hash-verified before execution.
Gold file enumeration still includes the missing path, while byte-span
construction drops it. File- versus Span-F1 consequently have different
representability limits; do not silently align their denominators.

## Consequence for continued research

This does not reverse r11 or the bound-call pilot's failed quality gates. Source
identity is verified for all present gold files; further retrieval work can
continue on the exposed corpus with the missing-path and content caveats visible.
No current provider job is active. The next acquisition hypothesis should cover
native-language/template and implementation responsibility rather than repeat
Python-only dependency rankings. Before untouched confirmation, use a separately
frozen evaluator-only source/label admission check that exposes no task-specific
gold hints; retain native scoring and reject silent post-score case replacement.
The single unresolved path does not block safe G01/G02/G03 research in general.

## Open Questions

Are label paths/spans representable in their pinned bases? Is annotated content
literal source, formatted evidence, or another revision? Does any mismatch need
an upstream clarification rather than a private alias? What prospective contract
supports a later native-score claim without retroactively repairing r11?
