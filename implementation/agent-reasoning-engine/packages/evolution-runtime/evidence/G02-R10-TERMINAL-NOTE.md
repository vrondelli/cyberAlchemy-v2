# G02 r10 development campaign — terminal before model dispatch

The r10 development-only 24-pair definition was frozen on 2026-10-02 at
SHA-256 `7a8517f8ffdcbd4997c01790d67e4dda0464d264738e618e151a636615049ee5`.
Its source-ranked population was six each from Ansible Pro, Django Verified,
Sympy Verified, and Svelte Multi. Evaluator-only eligibility and reference
reachability counts were inspected before selection; no task-specific model
score informed the cohort. The frozen definition and pair-1 raw evidence are
privately archived under
`/home/vlad_/are-benchmark-archive/g02-product-replication-r10-20261002/`.

The refreshed same-account GLM credential passed a tokenizer and tiny-generation
readiness check (HTTP 200/200), receipt SHA-256
`e8dc3d70cfe3a2082b6cafee5b92b6661cad411da965c20c9e01142e6e0a55c6`.
The serial coordinator's separate pair-1 readiness also passed. These were
readiness calls, not benchmark-arm model calls.

Pair 1 then failed source checkout in both arms **before either benchmark arm
made a model call**. The exact commit exists in the r10 bare cache, but that
cache has no Git ref or `HEAD`; the cloned arm worktrees therefore do not
contain the commit. The ARE result is `orchestration_error` on `git checkout`,
and DSH's settlement records the same checkout failure. The driver stopped
before prediction seals, native scores, or `PAIR-DECISION.json`. The coordinator
verified a full VPS-to-WSL checksum copy of pair-1 raw evidence, but its
independent scored-pair auditor correctly rejected the absent decision. The
VPS scratch remains intact; no failed evidence was reclaimed.

This is **terminal for r10** under its one-attempt, 24/24 validity rule: zero
scored pairs, one failed pre-model attempt, and 23 unattempted pairs. There is
no r10 quality or efficiency aggregate, and no G02 superiority claim. Do not
retry pair 1 or top up this frozen definition. The r10 manifest is conservatively
exposed for successor selection unless the approved exposure rule is explicitly
revisited.

## Next construction frontier

Version the cache builder so every exact commit has a deterministic local ref
and test the **actual arm clone-and-checkout path** for every candidate before
freeze. Then select a separately named development cohort under the exposure
rule, qualify all three source prefixes and the full driver path, check storage
and provider readiness, and freeze a new campaign. Keep private development
evidence separate from any product-page or general superiority claim.

## Open Questions

- Can a fresh 24-task development cohort be selected under the current
  conservative manifest-exposure rule after r10?
- Which no-model end-to-end check will catch clone/ref failures before a future
  model dispatch?
