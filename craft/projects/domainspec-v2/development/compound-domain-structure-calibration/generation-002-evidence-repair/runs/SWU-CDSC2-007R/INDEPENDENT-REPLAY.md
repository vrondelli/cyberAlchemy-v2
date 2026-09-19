---
task_session: SWU-CDSC2-007R
audit_state: pass
fresh_process: true
target_mutation: none
---

# Generation 2 Independent Replay

## Result

A run-local Node process independently loaded and validated the parent F3
receipt, M1, M2, adjudication overlay, compatibility projection, generation-2
results, provenance manifest, run receipt, and two-entry generation index. It
did not import or invoke the generation writer.

All thirteen audit checks passed twice. The second run produced the same
`replay-result.json` bytes with SHA-256
`14aea6d511fbbdb165e926e58af9a410cab4bf3012dc6e0ea05180a2ddeed7c8`.

## Exact Replay

| Artifact | Replayed handle |
| --- | --- |
| Parent F3 | `record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a` |
| M1 | `record:sha256:26cbc95a46c790b819ac0c9ebbef94771eed89a5457927fa0fd0967d32ec0140` |
| M2 | `record:sha256:55f0f6a99f8df7f5d9c4bf6da8c218f9366733a300e689c24ff8a2672e4309bd` |
| Overlay | `record:sha256:668ea537da92ee33b4640fe34175aaffa1b387b0809352984b552a7530dae8b5` |
| Compatibility projection | `record:sha256:8fa5b9015945b56aa2a9cdbf47d0743281a1a299fe1f0e8751b33518cbb03ccd` |
| F3 result | `record:sha256:8000b77fa0a60967707f5b830b8320fe92bee9965edbb3ff21e12f834620bd1a` |
| Suite result | `record:sha256:2953bb722b9d729c7c6126ef31331a2d652781020a999d2d9a0f466691763e52` |
| Provenance | `record:sha256:d7f4353c339cb2826e29860d17367c75737ff7f96c3367f856957ff4e98f47e2` |
| Generation 2 | `generation:sha256:24c4e0292197d0d8895bd5a668813437ba6d5c6f02cf6b549d85b2ae350ce683` |

The compatibility projection matched complete canonical bytes, content digest,
record ID, and generation ID. Fresh F3 and suite evaluation matched the stored
outputs exactly. Generation 2 has generation 1 as its sole predecessor and the
index contains exactly two entries.

## Provenance And Uncertainty

Q-06 and Q-07 equal statements derived from parent `S.permitted` and
`S.breaking`; neither contains the corresponding observed consequence. The
overlay remains total with two `explained`, four `not-explained`, and six
`indeterminate` coordinates.

F3-U-01 and F3-U-02 resolve through exact M1/M2 handles. F3-U-03 and all four
observation limitations remain `non-portable`. Target hashes for evidence,
results, index, evaluator, materializer, and validator files were identical
before and after replay.

All passing SWU001-004 and refreshed 005A-006R receipts are closed without
blockers. The old blocked SWU005 receipt remains truthful history, but its
reroute was completed and its L2/L3 contract is explicitly superseded; it is
not an open execution blocker.

## Outcomes

- F1: `EXPLAINED`
- F2: `EXPLAINED`
- F3: `INSUFFICIENT-EVIDENCE`
- Suite: `CALIBRATION-DEFER`
- Bounded machine route: `evidence-repair`

This replay establishes reproducibility of the bounded calibration result. It
does not establish identity, irreducibility, portability, Page kind, compound
DS-D1 type, DS-D8 relationship, pattern admission, candidate state,
activation, or promotion.
