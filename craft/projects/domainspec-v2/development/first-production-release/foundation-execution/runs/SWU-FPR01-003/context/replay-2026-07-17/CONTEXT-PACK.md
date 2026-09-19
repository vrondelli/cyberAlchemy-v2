---
task: SWU-FPR01003-REPLAY-001
parent_task: SWU-FPR01-003
mode: standard
strict: true
status: pass
evidence_kind: task-session-replay-context
created_at: 2026-07-17
---

# Replay Context Pack — SWU-FPR01-003

## Objective

Join the two repair PASS receipts, consume the completed definitions reconciliation,
and replay the existing authority-baseline package. Replace the blocked FPR01-003
receipt only when the canonical result repeats exactly, all five mutants remain
killed, and full DomainSpec implementation validation passes.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| R1 | Verify both repair dependencies are PASS and digest-bound. | guard and sample human/machine receipts | covered |
| R2 | Verify baseline, schema, validator, and fixtures are the implemented package, not a new repair. | original blocked receipt and current SHA-256 values | covered |
| R3 | Run the canonical validator twice and require identical normalized output. | validator CLI and task contract | covered |
| R4 | Kill all five named mutants with their distinct error codes. | fixture files and validator mutant mode | covered |
| R5 | Run the complete implementation `validate` chain. | task contract and package scripts | covered |
| R6 | Supersede the blocked receipt only on full PASS. | write scope and done criteria | covered |
| R7 | Preserve validation-candidate and all false authority/production flags. | baseline schema and validator fixed contract | covered |
| R8 | Do not synchronize Craft, roadmap, work-pack, or select FPR01-004. | handoff and authority boundary | covered |

Coverage: 8/8, 100 percent. Blockers: none. Fallback search: none.

## Selected Evidence

| Source | Selector | Obligations |
|---|---|---|
| remediation task contract | replay dependencies, write scope, done criteria, validation, handoff | R1-R8 |
| root work-pack | replay blocked behind both repairs; FPR01-004 blocked | R1, R8 |
| guard SWU human/machine receipts | PASS, exact guard validation, manifest equality, allowlist digest | R1 |
| sample SWU human/machine receipts | PASS, deterministic lint, one concept/zero edges/one obligation | R1 |
| definitions reconciliation receipt | canonical validator PASS and former blocker closure | R1, R3 |
| existing FPR01-003 blocked receipt | implemented artifact hashes, original blockers, mutant matrix | R2-R6 |
| `authority-baseline.yml` | candidate status and false boundary flags | R2, R7 |
| `schemas/authority-baseline.schema.json` | closed boundary and shape contract | R2, R7 |
| `tools/validate-authority-baseline.cjs` | canonical, fixture, mutant, live-source, and normalized-hash logic | R3-R4, R7 |
| five `fixtures/authority-baseline/*.json` files | `E_STATUS`, `E_DIRECTION`, `E_OWNER`, `E_COUNT`, `E_SOURCE_PATH` controls | R4 |

Unique source files: 14.

## Dependency And Artifact Digests

| Artifact | SHA-256 |
|---|---|
| guard human receipt | `590a59052aefaed1ace5f9fc0e5bf34786977224aeacdd8f0e0506f5a20ba58f` |
| sample human receipt | `290e031fff1e28f3fad5ac3a8db59d82b544f278387f5dbb556991cfd575f375` |
| definitions reconciliation receipt | `8c390dfbdf0e92a362874ac569903ac65f1db8d9e169e9084aa06939e8994570` |
| baseline | `7accea7412228999575e9c6a566c01c4cfa3424ece03451fd8a8721dcdacc63a` |
| schema | `159e48f83251b1e2a868a2088c8cdf22eb1c8648173c27125f1163de3adf997b` |
| validator | `daa8971074bb87dc8c471f316e6234baa995271e6d0b445dc946e655d21a0db6` |
| changed-status | `c9997d610818f7e6860cfffe62227f9630c852c0d7a91eb48f593a0989909df3` |
| conflicting-direction | `e43d0f6bbb9d2354fa64c7757b8e9b86a07a7cec6102f3a9b184b7d32b0bafdd` |
| missing-owner | `d5f888c4c49746f4cef52614c88f4a6fd696cc15e9659acef31da92ca4e53cd4` |
| stale-count | `4e409fd9f0144cf06b89f167b58ef69f18f6f9b1ad2ec51ec2443dcf31711c79` |
| stale-source-path | `16404033b300faa1e7d34240d41eae4b98522c65ebac4754db3d5af650980729` |

Machine receipt and pre-replay blocked-receipt hashes are recorded in the companion
index from live `sha256sum` output.

## Decision Pack

There is no implementation choice. The baseline package is read-only unless replay
discovers a new code defect. The Task Session must:

1. run the positive validator twice;
2. compare exit codes and complete outputs;
3. run the five-mutant suite;
4. run full implementation validation; and
5. write a PASS receipt only if every check succeeds.

A new defect, changed normalized digest, surviving mutant, aggregate failure, or write
scope expansion returns a named blocker.

## Write Scope

Allowed:

- `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01-003/TASK-SESSION-RESULT.md`
- replay evidence under the same `runs/SWU-FPR01-003/` directory.

Everything else is read-only. In particular, do not mutate baseline implementation,
FPR01-004 evidence, work-pack, Craft, roadmap, definitions, sample, guard, or
production flags.

## Validation Surface

1. canonical authority-baseline validator, twice;
2. exact complete-output equality and normalized digest equality;
3. five-mutant suite;
4. `npm --prefix projects/domainspec-v2/impl run validate`;
5. receipt JSON/Markdown integrity and scoped diff hygiene.
