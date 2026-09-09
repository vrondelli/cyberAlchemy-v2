# Context Pack — SWU-OEW-007 Preflight

## Intent

Preflight the first selected L1 unit without mutating implementation source.

## Selected scope

- Selector: `SWU-OEW-007`
- Primary behavior: load and verify the presentation graph, evidence sidecar,
  and receipt into an exact-source UI store.
- Captured frontier: `SWU-OEW-007` through `SWU-OEW-014`.
- Stop condition: first blocker or `G-OEW-L1`.

## Bound evidence

- G-OEW-L1 selection receipt:
  `b4b1043ca20b460c2d7c17426a0ec2901f17d5f5062f569dbd2beb2519999f03`
- L1 selection refresh receipt:
  `9a418e28b9d356bf00b152853ff5afa1250b355649fffb1afb48c9354de2f419`
- Live SWU manifest:
  `a5b7cb61faa65e7e0edc9e9bdf006bc456228de1515f0e60d15769ce56ea92ea`
- Live OEW package:
  `2e2d593ede66572ab0fd2760b27aa53a19f60aa01e40f8c231be01b34b7b2c70`
- Pinned Understand-Anything source archive:
  `1e00e541b494cb5538ba4ef19e1661e80312b128be5d32a89ae8a6ad56b40e16`

## Preflight finding

`npm run test:ui-store` exits 1 because the script is absent. The same package
also lacks the seven remaining L1 acceptance scripts. `package.json` is outside
all eight selected L1 target inventories, so implementation cannot begin
without an owner-approved scope repair.

No implementation target was mutated.

## Next route

Decision Gate `DG-OEW-007-L1-VALIDATION-SEAM`.

This pack grants no L2, authority, promotion, publication, deployment, release,
or production effect.
