# Run 01 — blocked before population

Status: **BLOCK**

The Task Session froze a 15-entry manifest, but the parent gate audit found that
the manifest did not bind the current controlling bytes:

- `SAMPLE-DISPATCH-01` pinned `DISPATCH.json` as
  `7203a70cf9b47e597553dfa7a592ed006ab60e530f52902f1b596b47fb88b1e5`,
  while the post-route-validation file was
  `88f35068953fa892fe66799e7fa937cee4e6c985a035439357ef255b92d302bb`.
- The frozen intent-schema, run-schema, and validator digests also differed from
  the passed `s5` mechanics receipt.

`PROTOCOL.md` forbids post-freeze source or mechanics repair. The attempt was
therefore interrupted before any populated result was admitted. The interrupted
worker nevertheless completed an already in-flight write after the stop signal
and later emitted `records.jsonl`, `metrics.json`, `RESULT.md`, and
`SCHEMA-SELECTION-GATE.md`. Those late artifacts inherit the stale frozen inputs
and are **superseded, untrusted attempt residue**. Their presence does not change
`records_admitted: 0`; nothing from this directory is live schema evidence, and
its gate file must not be treated as an owner decision surface.

Next route: start a fresh run ID after final dispatch validation, using stable
external source artifacts and the unchanged passed mechanics.
