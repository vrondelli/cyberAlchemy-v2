# Full-trajectory storage limits

Candidate implementation; no live launch approval. The measured predecessor retained about 67 MiB of non-source files. This additive evidence guard therefore permits 128 MiB total, with 8 MiB reserved for final records and 120 MiB for ordinary writes. It retains shared pending-write reservations, temporary replacement overlap, entry limits, symlink rejection and final-phase closure. Frozen tokenizer stages remain at 32 MiB.

The separate disposable-source envelope is 2 GiB. Shared checks scan allocated/logical source usage, reject unassigned roots and symlink aliases, and reserve all remaining source plus evidence growth against the verified D: backing drive and WSL guest. The inherited physical reserve remains 1 GiB on D: and 8 GiB in the guest. C: is excluded. Every source clone preparation and provider dispatch must use the same storage object. Once a check fails, it stays stopped.

Source checks are admission and monitoring, not a kernel filesystem quota. Git subprocesses and repository tool writes must settle before final accounting; transient growth between checks is not hard-limited by this module. The launcher must preflight the pinned source footprint, use bounded commands, and retain the full reservation before any source effect. A host reserve is not exclusive against unrelated processes. Existing evidence is never deleted by the guard.

## Open questions

The two-worker supervisor must bind the storage object's exact persistence/root identity, use its source callback and check before every physical HTTP request, and wait for both workers before final persistence. Validate the declared source envelope against actual prepared sources before provider generation. Native scoring requires its own bounded source/output envelope after generation settlement. These joins and launch records remain required before live use.
