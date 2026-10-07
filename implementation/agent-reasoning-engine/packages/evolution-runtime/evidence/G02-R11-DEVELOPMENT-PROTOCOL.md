# G02 r11 development successor — predeclared selection and qualification

R10 is terminal before benchmark model dispatch because its exact-commit
shallow cache had no ref for the arm clone. R11 is a **new development-only
campaign**, not a repair, retry, or top-up of r10. The r10 pool's 32 screened
IDs are conservatively excluded even though no r10 benchmark arm reached GLM.
The 233 ContextBench reserved-confirmation IDs remain excluded.

## Objective and population

Test whether the fixed selection-only ARE policy can outperform the pinned
read/search-only DSH comparator on matched native File-F1 and Span-F1 while
using fewer known model tokens and less all-in arm time. This is development
evidence, not original ContextBench confirmation or general ARE superiority.

Use six tasks each from Pro/Ansible, Verified/Django, Verified/Sympy, and
Multi/nlohmann JSON. The last stratum replaces exhausted Multi/Svelte, so
comparisons to prior G02 campaigns are not pooled. The source-only census
before this protocol found 14, 69, 28, and 13 unused source-valid development
rows respectively under the conservative exposure exclusion.

## Selection, before any model or score

From the pinned 1,136-row ContextBench dataset, project only public source
fields. Exclude all registered G01/G02 manifested IDs, G01 r14's candidate,
G02 r7/r8 screened pools, r9's candidate, r10's full screened pool, and all
reserved IDs. Within each of the four strata, rank IDs by SHA-256 of the
versioned r11 seed, source, repository, and instance ID; seal the first eight
per stratum in round-robin rank order. Only then may the evaluator emit one
native-gold-nonempty Boolean per selected pool row, without exporting gold
paths, content, or scores. Take the first six true bits per stratum in pool
order. If any stratum has fewer than six, fail this candidate; do not adapt
the selection rule after inspecting bits.

## No-model qualification before freeze

For all 24 selected tasks, verify exact commit and tree, origin, and a
deterministic local Git ref; run the **actual arm path** of `git clone
--no-local --no-checkout` followed by detached checkout for both arm
worktrees. Verify clean tree and bounded 64 MiB index. An evaluator-only
reference-reachability audit may report counts but not paths or scores. The
three source prefixes' packet/projector/scorer paths and the full driver
source binding must be checked without model calls. Storage floors, fresh
same-account tokenizer/tiny-generation readiness, exact tool hashes, and a
new immutable definition are required before any matched pair dispatch.

The frozen run, if reached, is serial, one attempt per ordered pair, with no
replacement or adaptive retry. Each pair's raw predictions and known usage
must be sealed before native scores are read. Preserve and checksum-archive
all failed evidence; never patch a frozen pair in place.

## Claim gate

All 24 pairs must be valid and independently audited. Paired stratified
bootstrap 95% intervals must be wholly positive for ARE-minus-DSH native
Span-F1 and File-F1, and wholly below one for ARE/DSH known-token and all-in
time ratios. Vlad and Dave review any product-page claim separately. Passing
this changed development population still does not prove full ContextBench
or general ARE superiority.

## Open Questions

- Does the source-ranked JSON stratum yield at least six native-nonempty tasks?
- Can fresh exact commits and actual arm clones pass 24/24 without exhausting
  VPS storage?
- Will the fixed ARE policy improve both native quality metrics and efficiency
  on this new population?
