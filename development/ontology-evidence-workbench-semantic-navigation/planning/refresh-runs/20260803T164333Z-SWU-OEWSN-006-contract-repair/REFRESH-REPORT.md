# Invoke Refresh — SWU-OEWSN-006 contract repair

- Result: PASS
- Activation: direct user, apply-approved
- Authorization: `confirmed binding006+0004`
- Targets: four canonical planning artifacts
- Material package: PASS and handoff ready
- Product mutation: not authorized by this refresh
- Next route: fresh Task Session for `SWU-OEWSN-006`

The repair preserves `OEWSN-BUILD.SWU-OEWSN-005.binding.json` and patch 0003
byte-identically. SWU-OEWSN-006 now declares only a new binding 006 and patch
0004 as material writes. `keyboard.ts`, `store.ts`, `OewApp.tsx`, and
`navigation.test.tsx` remain read-only historical-overlay inputs and are
logical patch targets only inside the isolated cumulative build.

The prior SWU-OEWSN-006 terminal BLOCK remains immutable history. Fresh
producer validation and consumer admission are mandatory before material
mutation, and SWU-OEWSN-007 remains unselected.

## Open questions

No planning/build-ownership decision remains for this seam. Implementation and
acceptance evidence belong to the next Task Session.
