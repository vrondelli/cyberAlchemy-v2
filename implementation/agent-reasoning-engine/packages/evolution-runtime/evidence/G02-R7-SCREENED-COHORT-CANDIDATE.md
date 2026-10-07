# G02 r7 performance-unseen screened cohort candidate, 2026-10-01

Status: **terminal failed campaign**: frozen before model dispatch, one pair
attempted without a matched score, and 23 pairs unattempted. No superiority
result. It excludes all 24 evaluator-exposed r6 IDs as well as
earlier G01/G02 manifests, r4/r5 IDs, and smoke IDs.

The [source-only pool derivation](../research/g02-product-r4/derive-g02-r7-screening-pool-r1.py)
fixed a new four-repository population before evaluator access: Ansible
(`Pro`), Django and Astropy (`Verified`), and Svelte (`Multi`). It ranked
available rows by a fixed SHA-256 seed and placed the first ten per repository
in a 40-task pool. The rule was predeclared to choose the first six tasks per
repository with **nonempty native gold**, or fail if a stratum had fewer than
six. The pool SHA-256 is
`156689120479c17f96ae0052fc5247af6dcae0b8f5bda69c6a7d9df43beafa62`.

The independent [evaluator screen](../research/g02-product-r4/screen-g02-r7-native-nonempty-r1.py)
exported only boolean nonempty bits, not reference paths or scores. All
**40/40** pool rows were nonempty: ten each for Ansible, Django, Astropy, and
Svelte. Its receipt SHA-256 is
`d9c7b2040e988aefa88e7ce64175c742b9ffb5bb40f64b92c8be399e7911bc1b`.
The [candidate selector](../research/g02-product-r4/select-g02-r7-candidate-r1.py)
therefore chose the first six source-ranked rows per repository without an
eligibility skip; candidate SHA-256
`6ddfcd55f1a05f87ea4bcbe44ac3b0a7246ade41689b9195d33be2f6e8c8708d`.
This is a changed population and can support at most an explicitly scoped
mixed ContextBench claim, not the old Pro-only four-repository claim.

The three candidate receipts passed a remote-to-WSL checksum comparison under
`/home/vlad_/are-benchmark-archive/g02-r7-screening-pool-20261001/`.
All 24 selected exact commits were hydrated from the original Git sources and
each task-specific shallow cache passed a pinned-image offline checkout test
(`TASK-CACHE-HYDRATION.json`, SHA-256
`8c3c351d131c266b758d72d44010fa3a66da5d7b6e86c261c54af194387e8f2e`).
The fixed 64 MiB source index passed **24/24** tasks
(`SOURCE-INDEX-PREFLIGHT.json`, SHA-256
`fc9b73cad1c55dd14d15f59ccbda6fe3abb8e5d6fa3a3047d5606151f6856399`).
The unchanged-policy r7 adapter passed **24/24** source-binding guards and
**24/24** no-model prepares. An evaluator-only replay of the *actual checked-out
worktree* reproduced the Node index file counts and byte totals on **24/24**
tasks; **88/89** native-gold reference-file occurrences were inside it
(`WORKTREE-INDEX-REACHABILITY-R2.json`, SHA-256
`d345af29c6a9684346379904c2f574969327b906a070198f8511115049074c25`).
This evaluator audit exposed all r7 IDs for reachability, so they cannot be
replaced or retuned and then called fresh under the same cohort. It did not
export reference paths to the selector or inspect model scores.

A no-model four-checkout rehearsal on the largest observed index task also
passed with an additional **631,209,984 bytes** of tmpfs use; the index probe
ran inside the pinned 1 GiB Docker limit and observed 239,550,464 bytes of
Node RSS (`FOUR-CHECKOUT-CAPACITY.json`, SHA-256
`9f8c802d5c5aa59e22d3ab9ba5aa65cb268208171b23af73d5ad99ea5568317f`).
This does **not** prove whole-arm memory or 24-pair reliability. After the
credential refresh, the same-account tokenizer and tiny-generation readiness
probe returned HTTP **200/200** (`READY.json`, SHA-256
`9e575c51b3508c6f11500dc452b77353efe4b3d39c44882bb95ce8464e6dbf88`).
No benchmark arm or native score was dispatched by those qualifications.

## Frozen r7 outcome

The 24-task definition was frozen before pair 1 at SHA-256
`7bf6328b48d6f519984809ebcb66ec950d2ff883a2a0ad68e067e4397d57bf00`.
Pair 1 was then dispatched once. ARE exited with `orchestration_error`,
**zero model calls and zero known tokens**: its non-root container received
`EACCES` while opening `/cache/ansible-96c19724`. The inherited Git trust
configuration also listed legacy cache paths rather than the per-task leaf;
an exact non-root/no-model check reproduced Git's dubious-ownership failure
and passed only with an explicit safe-directory binding. These are distinct
infrastructure defects that the earlier root-user offline preflight did not
cover. The operator stopped the still-running DSH containers after ARE's
pre-model failure to limit pointless provider spend. The partial DSH transport
record reports nine model calls, 66,387 known tokens, and one dispatched
request with unknown usage; its stopped exchange could not be sealed or
exported. No native score or pair decision exists.

The failed pair's complete raw root and driver output were copied to
`/home/vlad_/are-benchmark-archive/g02-product-replication-r7-20261001/`
and compared to the VPS source with `rsync --checksum` (archive receipt
SHA-256 `4f0b004b749898dca62abb06520bc98aa817a38843d9ea7b85fe94f3914cd34f`).
The ordinary scored-pair auditor correctly rejected the missing decision;
do not count this as an independently scored audit. The exact VPS failed root
remains for diagnosis. The frozen **24/24 validity gate failed**, so r7 will
not dispatch the remaining 23 tasks. No r7 quality estimate or superiority
claim is admissible. A new source-ranked r8 candidate excludes all 24 r7
selected IDs and will separately qualify the non-root mount and exact Git
trust paths before any model dispatch.

## Exposed cache-access repair diagnostic (separate from r7)

After terminal r7, a separately frozen rerun of its already attempted task
tested the non-root cache access and exact Git trust repair (freeze SHA-256
`b590a6b7573b9b10729a7172997348945e40a1c568006840fa94b0236a42ae7b`).
Both arms completed, sealed predictions before native scoring, and passed an
independent receipt/metric audit (SHA-256
`269bc3d6c15809cce500b8aaa5c3035f8c56e16c10a730abaf52c4410d17b364`).
ARE used **136,614** known tokens and **148.14 s** versus DSH's **364,480**
tokens and **170.07 s**, but scored lower: native File-F1 **0.53333 vs
0.62500** and Span-F1 **0.38491 vs 0.57520**. The per-pair four-condition
gate failed. The complete 188 MB private WSL archive under
`/home/vlad_/are-benchmark-archive/g02-r7-cache-access-dev-pair-20261001/`
passed remote-to-local checksums for raw output, freeze, and tools. Only
after verification was its exact VPS scratch root reclaimed; the cold copy
is recoverable. This proves one repaired full-path completion, not r7
campaign recovery, general reliability, or superiority.

## Open Questions

- Will the corrected non-root path generalize beyond the one exposed task?
- Will a separately frozen r8 matched campaign complete 24/24 and pass both
  native quality and known-token/all-in-time interval gates?
