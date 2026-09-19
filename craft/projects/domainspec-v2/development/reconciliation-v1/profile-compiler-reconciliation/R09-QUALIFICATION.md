# R09 qualification — safe coherent TypeScript project

2026-09-13. R09 completed against the original exit in
[remaining work](REMAINING-WORK-PLAN.md). Product-construction evidence only;
authority effect none. R10–R18 and the full CLI goal remain incomplete.

## Controlling context and decision

Task-session/context-builder scope: the original R09 exit, R08 completion,
R09 safety preparation matrix, resolved artifact plan, public reconciled
compiler, native module observer, publication implementation and its focused
49-check evidence. Existing owner authorization permits bounded local work.
No delegation, release, profile admission or default cutover was performed.

Owner decision: “yes maintain current behavior of the cli and optional handling
for the edge case”. Normal CLI output uses bundled atomic no-replace publication,
without extra flags or an end-user compiler. Optional Node permission mode permits
planning/currentness inspection and explicitly rejects these atomic output writes
before staging. No bypass or unsafe rename fallback. Exact scope and error codes
are in [the decision](R09-PUBLICATION-DECISION.md) and CLI COMPATIBILITY.md.

## Evidence and recovery

All TAP files below are in `evidence/r09-atomic-primitive/`. Original failures
remain unchanged. This is composite evidence, not a claim that each run passed.

| Run / terminal session | Result | Use |
| --- | --- | --- |
| normal-cli-final.tap / 97258 | 49/49, exit 0 | Native loader/helper, three public writers, real two-process conflict, source/snapshot/node/project/build/CLI, both layouts, tamper checks and optional permission mode |
| project-qualification.tap / 48018 | 17/19, exit 1 | All original resolved/project/module-surface tests and portable roots pass; two new order/root comparisons incorrectly require provenance equality |
| project-qualification-recovery.tap / 60506 | 1/3, exit 1 | Strengthened native AST mutation test passes, including reverse Rule-to-Policy import; two new comparisons still include target artifact hashes |
| project-qualification-semantics.tap / 19019 | 4/4, exit 0 | Both exact failing cases pass after separating structural/runtime meaning from provenance; source-identifier collision and existing reserved-node/root checks pass |
| legacy-hooks-qualification.tap / 16812 | 3/3, exit 0 | Original P01, P05 and P06 retain their intended safety behavior |

Current unique coverage: 49 writer/public checks + 20 resolved/project/scanner
checks + 1 configured reserved-name check + 3 original preparation probes = 73.
The strengthened AST case replaces its earlier passing version, not an extra
count. The two recovered cases replace their failures; failed runs are not
counted as whole-run passes. There are no skipped tests in these selected runs.

The new tests initially conflated provenance and meaning. Source inventory
reordering changes graph-bound descriptors; module-root relocation changes
dependency paths and derived hashes. Final assertions validate each import's
target hash against its actual artifact, compare paths/imports/exports/selectors
separately, and compile and execute both variants. No blanket hash stripping,
compiler change, source normalization or product-semantic relaxation was made.

## Original requirement audit

| R09 obligation | Evidence / exact coverage |
| --- | --- |
| Leaf imports and exported symbols | Resolved all-13 native compile; independent TypeScript AST import/export manifests; extra export and same-typed cross-feature import mutants compile but are detected; duplicate exports rejected by scanner |
| Architecture direction | Selected Policy closure contains Rules, not executed target Operations/Calculations; Query projection does not construct a factory; State Machine symbolic events do not construct Events. Native reverse Rule-to-Policy import compiles but differs from the selected manifest. This is selected generator architecture, not a new universal policy engine |
| Qualified name collisions | Same node basename in alpha/beta compiles and produces distinct numeric results. New public source case rejects alpha:a-b and alpha-a:b references collapsing to AlphaAB with MTCLI_TYPE_IDENTIFIER_COLLISION |
| Reserved names, traversal, portable aliases | Existing reserved Rule node/root tests and public all-13 roots reject con/aux/lpt9, package/class, traversal, absolute/backslash, uppercase and both NFC/NFD accented roots without outputs. Supported roots are lowercase ASCII; no claim of Unicode normalization or execution on case-insensitive filesystems |
| Conflicting support files / path overlap | Resolved-plan tests deduplicate exact shared files and reject incompatible plain/algebraic Enum files and duplicate requests. Legacy arbitrary-artifact writer rejects traversal and file/directory overlap, leaving no target/stage. Checked reconciled plans cannot be forged into arbitrary artifacts |
| Symlink escape and tampering | Existing public tests reject symbolic parents, artifact symlinks, changed bytes/receipts, extra paths and wrong views; restored outputs verify again. Held-directory helper tests cover parent/stage replacement and foreign entries |
| No overwrites, interruption and ownership | Native no-replace rejects existing files, empty/nonempty directories and symlinks. All three public atomic writers preserve an empty competitor inserted at final claim, preserve error families, and clean owned staging after interruption. Two OS processes yield one complete winner and one existing-target error; owner sentinel survives |
| Source order / module root preserve meaning | New fixture reverses project feature and feature node/edge inventories; new root is relocated/kernel. Both variants compile and execute exact UInt64, Mapping, duplicate-preserving Query, Policy branches, State Machine transition and Workflow/Operation commit behavior; all 13 module surfaces remain accounted for |
| Public entry matrix and layouts | Focused49 covers source/snapshot build, node/project instantiation, actual CLI commands, legacy signatures, default and application layouts, native declarations and relocated execution, positive/hostile/currentness cases. Project suite adds all-13 source/snapshot plan and every selected node's exact import closure |

P01–P06 reconciliation: P01 rerun unchanged; P02 interrupted staging is covered
by current public all-writer interruption tests; P03's two original red results
are repaired through kernel no-replace and new final-claim tests for all three
atomic writers; P04 foreign nonempty target remains covered by the current CLI
failure test; P05/P06 rerun unchanged on the separate legacy per-file publisher.
Old rename/path-write interception probes are historical, not silently rewritten
or treated as passing against a different interception seam.

## Currentness and scope limits

All 18 selected inputs from `normal-cli-result.json` were checked unchanged at
this closure. Only `test/generation/reconciled-project.test.ts` and
`test/generation/resolved-artifact-plan.test.ts` changed in this qualification
step. Source typecheck passed (session37586, exit0); all six materializers passed
(session93634, exit0). Native compilation uses the pinned Node26.8.1/TS7.0.2
container. Tests execute local fixtures; no live external service is involved.

This is not a full transitive dependency attestation, universal hostile same-UID
filesystem proof, hardlink/mount-race qualification, power-loss/fsync guarantee,
cross-platform claim or installed-package approval. Those are not silently
implied by atomic no-replace. Clean installed-product qualification remains in
the original later plan. Legacy per-file project publication keeps its separate
partial-visibility contract and retains incomplete public targets on failure.

Exact TAP SHA-256 identities:

```
normal-cli-final.tap fd8abcab97917232a10cfd89d0edefa7127927890a8506115c27ffbb383b5557
project-qualification.tap 50c8a09b6ecbe24a21a01cd9eb47695fff2f4ef7f55f906fcc3b1d89adaaf4d8
project-qualification-recovery.tap fdc3f3bfdcd276e86c36be4a9b54dba895b2bd146ed6bd0ec16fa5b28277a5f1
project-qualification-semantics.tap 1ea9cb907494f430c009a807beb28b2c144ae1379e9f68a6d7a921f79dd0984e
legacy-hooks-qualification.tap 445226afabfec6336e9c75b2c9bbf6445662901e5831e8f2effc04c639f41e6b
```

Final selected test SHA-256 identities:

```
reconciled-project.test.ts 021ac3ef050cc5170f8105d70c4abd7d8568f9139802feba9921a13ce091e638
resolved-artifact-plan.test.ts 792d7fec29415ae7b8af5bb045e37722da13f1d4727981d661d55a1c2ac3fb71
```

Next: R10 Python adapters; R11 is dependency-ready but not separately dispatched.
No remaining owner decision blocks this transition. Experiment harness and
runtime handoff are not applicable to this local bounded compiler task.
