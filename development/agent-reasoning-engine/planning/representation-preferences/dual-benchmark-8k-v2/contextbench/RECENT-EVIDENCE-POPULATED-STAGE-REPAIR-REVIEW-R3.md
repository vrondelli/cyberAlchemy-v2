# Populated-tokenizer R3 capacity repair review

Approved for bounded construction; no live tokenizer execution admitted.

All nine tests passed independently. The real guard accepts 64 MiB for both output and supervision and rejects the former 96 MiB setting. The prior R2 review missed this capacity constraint. R2 failed before child/provider dispatch; its failure and all 2,948 launch bindings remain preserved.

R3 changes capacity, additive stage routing and failure lineage only. The reviewed R2 measurement core remains unchanged. Each stage retains an 8 MiB final reserve within 64 MiB; combined prospective storage reservation is 128 MiB. Fixed schedule, no controls, two workers, exact source/review gates and bounded process settlement remain intact.

## Open Questions

Review a freshly prepared R3 freeze and current storage before execution. Supported capacity is not a guarantee of fit; oversized evidence must fail honestly. Real token fit, quality, savings and untouched confirmation remain unproven.

Exact hashes are in [RECENT-EVIDENCE-POPULATED-STAGE-REPAIR-REVIEW-R3.json](RECENT-EVIDENCE-POPULATED-STAGE-REPAIR-REVIEW-R3.json).
