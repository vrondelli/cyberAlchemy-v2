# Plan transport and continuation handoff

## Start here

1. Read `PLANNING-CONTEXT.md` for boundaries.
2. Read `WORK-PACK.md` for the whole decomposition.
3. Select exactly one task from `work-pack/tasks/` in wave order.
4. Execute it through `EXECUTION-PACK.md`.
5. Record its result under `runs/<SWU-ID>/RESULT.md`.

## Daily use after implementation

After an authorized Craft or manifest update:

```bash
python3 projects/domainspec-v2/development/first-production-release/visibility/tools/build-roadmap.py
```

To prove generated files are synchronized without changing them:

```bash
python3 projects/domainspec-v2/development/first-production-release/visibility/tools/build-roadmap.py --check
```

## Which source to edit

| Desired change | Edit | Do not edit |
|---|---|---|
| current gate, next move, gap state | `.craft/ledger.yml` through Craft governance | generated JSON/HTML |
| roadmap node, edge, frontier, critical sequence | `expected-node-edge-manifest.yml` through its owner route | generated JSON/HTML |
| layout or interaction | `roadmap.template.html` and tests | embedded payload in HTML |
| normalization contract | `build-roadmap.py` and tests | output files by hand |

## Research continuation

An observed new frontier is first recorded and triaged through the manifest's persistent
protocol. It becomes research only when material to a node/applicability dependency and
after the domainspec-subagents-strategy trigger, tension sheet, explicit confirmation,
registration, and append-only closeout. Refreshing the HTML does not bypass that gate.

## Handoff residue

- Parent continuation: `CTX-DSV2-FIRST-PRODUCTION-RELEASE`, next move FPR-01.
- Feature continuation: `CTX-DSV2-FPR-VISIBILITY` after Craft integration.
- Future CI owner: repository verification route; consume `--check`, do not duplicate
  generation logic.
- Future composition owner: Whisper, after observation evidence justifies transport
  promotion or revision.
