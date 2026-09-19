# Candidate bounded ContextBench execution amendment

Status: proposed implementation and review scope only. No runtime file, previous freeze or completed trial is changed by this document. User authorization to continue bounded benchmark work motivates this proposal; LongMemEval's operational amendment does not automatically modify ContextBench's policy. This amendment must be explicitly adopted in the next ContextBench protocol and exact-source review.

## Objective and unchanged experiment

Resume the request-complete archived-terminal component diagnostic: eight fixed archived donors, legacy/diversity variants, sixteen planned slots, two workers, one new model request per slot, exact native8K admission and128000 new-token reservation. Preserve prefix receipt identity, retained reasoning, suffix-only new-cost accounting, AB/BA order, deterministic packet policy, source-complete restoration, native validity/coverage and fixed failure denominators. This is not a fresh full-trajectory run, a full-benchmark score or proof of15% whole-task savings. The original stopped trial remains counterevidence/infrastructure history.

## Measured source and artifact footprint

Read-only inspection of existing manifests and filesystem metadata found:

| Retained artifact | Logical bytes | Allocated bytes |
|---|---:|---:|
| `preflight-r1` | 5177223 | 5763072 |
| `source-validation-r1` | 2290585 | 2568192 |
| `live-r1` stopped trial | 5214076 | 5398528 |

The eight request-complete source manifests contain2266204 source bytes. Deduplicating exact repository-cache/commit/path identities gives83 paths and1877941 source bytes. Four retained repository caches occupy284434432 allocated bytes. These are observed existing footprints, not an upper bound for a future native run. In particular, stopped-live size does not predict sixteen complete outputs.

Current source restoration permits32MiB per donor, up to256MiB over eight donors, while current launch guards reserve512MiB beyond12GiB host/8GiB guest. Neither512MiB growth nor12GiB host reserve is an intrinsic requirement of this measured source set; both are conservative policies. Current code nevertheless enforces them and must not be bypassed by merely replacing a runtime callback.

Minimum source evidence for unchanged restoration includes all terminal-delivered base files, exact Git commit/tree/blob objects, bound donor result/completion records, transport ledgers, start configuration and snapshots. The current restorer uses local `git rev-parse`, `ls-tree` and `cat-file`; no clone/download is necessary. Existing caches and archival evidence remain retained. A standalone reduced Git/source package would need its own identity-preserving implementation/review and is outside this amendment.

## Proposed operational contract

Use verified physical D: identity with1GiB host reserve, unchanged8GiB guest reserve, and32MiB additional launch headroom. Preserve mount/registry provenance checks and no-C/no-guest-substitution behavior. Enforce a separate32MiB total output budget for each preparation, generation and evaluator stage, with ordinary output limited to24MiB and8MiB reserved for the final result/seal. Shared generation accounting spans both workers. Existing input archives/caches are read-only and outside new-output budgets; all newly created temporary/worktree files must count toward their producing stage, rather than escape the cap through another directory.

## Exact implementation boundaries required

1. Add named bounded successors of `preflight-v2.mjs`, `live-v2.mjs`, `run-v2.mjs`, `score-v2.mjs` and `freeze-live-v2.mjs`. Import the independently reviewed small-run D: guard or an exact reviewed equivalent. Change512MiB growth to32MiB only in these successors. Preserve current v2 files and all prior evidence.
2. Introduce a single stage-owned synchronous budget writer/allocator shared by both workers. Sum `max(logical size, allocated blocks *512)` for every retained file plus directories, reserve conservative filesystem allocation/metadata rounding, and reject before writes. Exclusive-create, append, atomic replacement and temporary-plus-old-file peaks must all be checked. Keep directory containment/symlink checks. Final fsync'd result/seal writes alone can access the reserved8MiB; oversized finals fail with the in-memory cost result attached.
3. Route **every** write through budget admission, not just wrapper JSON: preparation source restoration (`prepare.mjs` descendant), index receipts, prepared packets and wire directories; request prefix ledger import, prompt/admission/result files and timing appends (`run-v2.mjs` descendant); native transport ledger temporary write/fsync/rename (`holdout-v1/transport.mjs` persistence boundary); recycler state/journal/snapshots (`coding-agent-runtime/context-recycling.mjs` and its storage dependencies). Add narrowly scoped injected persistence hooks or isolated descendant modules without altering frozen native dependencies. A periodic `du`/storage guard after writing is insufficient to enforce the proposed bound.
4. For native evaluator subprocesses, budget prediction/output files and temporary native worktrees. Current `score-v2.mjs` sets `CONTEXTBENCH_TMP_ROOT` but that only selects a directory; it does not limit growth. Inspect scorer/cache mutation paths and provide reviewed byte-bounded writes or a hard aggregate quota for the owned stage. A per-file limit or after-process scan does not establish32MiB aggregate enforcement. Reject before launch if all native writes cannot be bounded; do not silently omit native scoring or redirect unbounded output outside the stage.
5. Preserve shared-health stop, no retry, actual AbortSignal handling, bounded real-promise drain and all sixteen slots. A budget rejection after a received response must preserve its usage in memory and final evidence. Unknown transport expenditure keeps its reservation. Do not relabel a storage failure as model-selection counterevidence.
6. Create separate prospective protocol/native continuity records explicitly adopting this ContextBench reserve amendment. Freeze the bounded successors, writer/native persistence dependencies, host binding/provenance, source closures and exact reviews. Fresh tokenizer-only preparation is necessary after code stabilization; the old preflight cannot authorize new source/runtime bindings.

## Required validation and execution order

Synthetic tests must cover D: identity/reserve rejection, stage aggregate exhaustion across two workers, sparse/allocated-file accounting, append and atomic ledger rewrite peaks, no off-root temporary/cache writes, budget rejection before network dispatch, rejection after known usage, unknown-cost holds, final8MiB persistence, interruption and all sixteen slots. Native fixture tests must actually traverse transport/recycler persistence. Evaluator output/temp enforcement needs a bounded synthetic subprocess test without gold or external calls.

After independent review: fresh bounded preparation; confirm all eight source closures and zero model calls; exact live review; create a new separate freeze; execute sixteen component slots; then isolated native scoring and reconciled observation/decision. Names/commands should be finalized with the successor modules, not borrowed from the existing v2 CLI before implementation.

## Open Questions

Can the existing native scorer's complete temporary footprint remain within32MiB under a hard stage quota? Which recycler storage functions need narrow injection to cover every write without a broad native-runtime fork? These are implementation gates, not evidence that current wrappers already enforce the proposed cap. If the bound cannot be met, report the measured minimum and obtain an explicit prospective policy decision rather than silently weakening it. Full-trajectory ContextBench quality and15% savings remain separate subsequent work.
