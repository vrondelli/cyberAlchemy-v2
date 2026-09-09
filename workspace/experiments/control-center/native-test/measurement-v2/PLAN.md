# Measurement loader repair epoch v2

Product construction: normalize the WDIO/Mocha cache-busting URL before exact
spec matching. Reuse the original source-hash-checked transform; do not alter
functional assertions, minimum samples, ordinary smoke behavior or budgets.
Files: loader.mjs, register.mjs, loader.test.mjs, wdio.conf.mjs, this plan and
RESULT.json/README.md evidence. CC004 and original loader files remain immutable.

Sequence: reproduce v1 miss through installed Mocha loadFilesAsync; prove v2
matching and hash rejection; bind the exact v2 apparatus bytes; run one isolated
native integration probe with the retained, digest-checked CC004 executable and
current CC004 source validation. Preserve raw output and all host observations.
This is a new harness epoch, not a replacement CC004 PASS or full product test.

Operational support: current agent owns temporary test storage/process cleanup,
affecting native integration proof only. No rebuild or app restart is required.
Stop on native failure; host rejection remains visible. Qualified population,
successor full candidate/build closure, collector selection, previous-candidate
differential, approval and publication remain separate pending work.
