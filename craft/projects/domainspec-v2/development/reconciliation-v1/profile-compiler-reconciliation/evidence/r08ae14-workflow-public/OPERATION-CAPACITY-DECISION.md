# Operation verification transport capacity

Task: R08ae14 / remaining R08 CLI reconciliation

Classification: product-construction; authority effect: none.

Recorded: 2026-09-13 10:59:50 UTC. Updated: 2026-09-13. Status: historical capacity options; no longer required for the current mixed R08 fixture.
Selected option: none. Recommendation is not approval.

The subsequent [generic direct-provider selection integration](../verification-efficiency/SELECTION-INTEGRATION.md) preserved the complete semantic cases, versioned the finite direct-provider coverage policy, and passed the actual mixed public verifier under the unchanged limits. Its registered four-Operation observation is 15,763,458 bytes. No batching or capacity option below was selected. The historical full-family failure remains evidence; it is no longer a current blocker for this fixture. Reopen this decision only if an exact required model still needs a change to supported capacity behavior.
Decision-gate result: BLOCK for changing Operation verification capacity semantics,
not for unrelated dependency-ready construction or finishing already-running tests.

## Question

Should the CLI verify independent Operations in bounded per-Operation batches,
preserving each complete case family, or retain the existing 16 MiB limit over
their combined observation and report over-capacity verification as unavailable?

## Current evidence

- The existing execution contract declares `input_bytes` and `output_bytes` of
  16,777,216. The shared native executor uses that output size as `spawnSync`
  `maxBuffer` and executes all ready Operation rows together.
- The Operation protocol independently permits up to 8,388,608 bytes per source
  family and preserves all source-derived cases. Neither limit was changed.
- The mixed fixture preserves the original complete commerce Workflow and adds
  a lawful distinct64-step Workflow with separate Operation/Event roots and shared
  value/Rule dependencies. Its Workflow source family is correctly unavailable
  at the existing32MiB whole-family boundary.
- Native suite96659 passed4/5 tests with522 unchanged inputs. Its mixed public
  case returned `fail` instead of the originally assumed `incomplete`.
- Diagnostic5530 isolated the actual independent failure to the Operation family:
  `CROSS_GENERATOR_EXECUTION:native-behavior:spawnSync /usr/local/bin/node ENOBUFS`.
  Six other native families, including the original Workflow, were retained.
- Source-size probe41144 independently predicted the full canonical Operation
  observation as19,834,753 bytes, greater than16,777,216. The four individual rows
  are4,985,234 /4,969,583 /4,947,754 /4,932,083 bytes, with1804 /1807 /1804 /1807
  complete cases. This is source-predicted observation size, not native output.
- The mixed coverage assertion now explicitly preserves the independent failure
  and tests the ready/unavailable Workflow roots and each facet's own complete
  path denominator separately. Focused repair84652 passed1/1, retaining six
  shared dependency paths, seven missing effect/module paths and the unverified
  Workflow root. It cannot close the Operation capacity issue. Its TAP SHA256 is
  `20b45bba4500ce402b34265550561cd754567703ae3af01f237d6a5a9aa495ab`.

Sources: `cross-generator-operation-protocol-contract.json`,
`cross-generator-execution-contract.json`,
`impl/cli/src/verification/reconciled-cross-generator-operation.ts`,
`impl/cli/src/verification/reconciled-cross-generator-execution.ts`,
`coverage-native.tap`, and the terminal/diagnostic entries in `progress.json`.
Contracts above are relative to the reconciliation work-pack; implementation
paths are relative to the DomainSpec project root.

## Options

1. **Bounded per-Operation verification (recommended).** Keep each full source
   case family and existing per-Operation limit. Execute complete independent
   rows through bounded native observations and join their exact registered
   receipts. Never drop cases, accept a prefix, hide failures, or grant whole
   project success from one row. This supports larger composed models without
   increasing a single child's buffer. Cost: a separately defined transport
   contract, explicit aggregate resource budget/currentness, batching and
   receipt-join tests, and affected public/CLI regressions. This changes the
   current whole-aggregate transport ceiling; it is not merely a larger buffer.
2. **Preserve the combined16MiB ceiling.** Detect known aggregate overflow before
   native execution and expose the exact unavailable obligation. Simpler bounded
   behavior, but models can remain unverifiable even when every Operation fits
   its individual limit. Documentation must state that composed-model limit.
   Actual native mismatches and unexpected runtime failures must still fail.

Blindly raising the buffer, silently reducing cases, simplifying the original
commerce fixture, or relabeling a failed native run as successful are excluded.

## Boundaries and remaining work

No user choice has been received and no capacity contract/runtime has been
changed. The user requested continuation until a meaningful product decision;
this choice determines which composed models the CLI promises to verify.

After the choice: define the selected behavior and scaffold before implementation,
retain old limits/receipts as predecessor evidence, validate exact new cases,
then qualify actual compound CLI and compiled-snapshot paths and every affected
public regression. R08 and R09-R18 remain open; AlchLang remains separately
deferred. No release, default cutover, publication or operational authority.

Effect assessment: af32f957441e3293d576a934e7e653e658250ce30b5cfe441cb7a2c11123cfc4.
