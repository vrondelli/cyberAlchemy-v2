# OEW Typed-Test Recovery Prototype Validation

- Attempt: `20260803T222716Z`
- Mode: candidate-local prototype fast lane
- Work Pack: `ontology-evidence-workbench-typed-test-recovery`
- Result: PASS for the seven-SWU implementation package
- Deferred governance notice: `HN-7362EC2F08B7` (supersedes the pre-execution
  notice `HN-2E516134F7B7`)

## Implemented frontier

| SWU | Implemented behavior | Evidence |
| --- | --- | --- |
| OEWFR-001 | deterministic UTF-8 diagnostic hashing, redaction and head/tail bounds | sanitizer exact-limit, oversized, secret/path and invalid-UTF-8 fixtures |
| OEWFR-002 | contained exclusive artifact writer with re-read/digest validation and partial cleanup | parent creation, collision, traversal, symlink and re-read mismatch fixtures |
| OEWFR-003 | injected command-runner and evidence-writer seams with production defaults | injected pass/failure/throw fixtures; no live command invocation |
| OEWFR-004 | nonzero typed gate writes evidence, stops later work and throws a typed blocker with one reference | actionable failure, empty diagnostics and writer-failure fixtures |
| OEWFR-005 | cleanup always resolves after the primary result and overrides it on failure while preserving the evidence reference | terminal precedence matrix |
| OEWFR-006 | failure-only output slot with schema, path, size, privacy, collision and mutual-exclusion bounds | parent admission/closeout JSON checks plus three negative contract fixtures |
| OEWFR-007 | generic terminal reference and missing/invalid fail-closed consumer contract | parent work-pack/task link, field and authority checks |

## Validation-contract closure

| Contract | Result | Evidence |
| --- | --- | --- |
| V01 passing injected command | PASS | one call, discovery pass, zero writer calls |
| V02 nonzero typed command | PASS | one call, one reference, no successor command |
| V03 empty diagnostics | PASS | `DIAGNOSTIC_EVIDENCE_MISSING`, zero writer calls |
| V04 oversized diagnostics | PASS | deterministic retained head/tail within 96 bytes with original digest/size |
| V05 secret/environment marker | PASS | synthetic token and temporary paths redacted; environment/cwd omitted |
| V06 escape/collision/symlink | PASS | path, collision and symlink negatives reject before persistence |
| V07 writer failure | PASS | `FAILURE_EVIDENCE_PERSIST_FAILED`; cleanup contract preserved |
| V08 cleanup failure | PASS | `CLEANUP_FAILED` is strongest and retains the evidence reference |
| V09 missing/invalid reference | PASS | parent contract requires BLOCK and all nine reference fields |
| V10 inner BLOCK continuation | PASS | SWU006 successor policy requires terminal and owner PASS; failure evidence grants no advance |
| V11 observer recommendation | PASS | planning task states observer evidence has no mutation/retry/root-cause authority |
| V12 compatibility packet | PASS | both test-side and config-side branches remain visible; no option selected |
| V13 DOM under Node | PASS | dependency-free Node probe reproduces `ReferenceError`; no product-defect or repair-side inference |

## Exact postimages

| Artifact | SHA-256 | Bytes |
| --- | --- | ---: |
| `scripts/build-thin-prototype.mjs` | `2ae10b97a60f924c82c5da068dab23a9ad61c9c1be2f152d35dca57a93fab86e` | 81021 |
| `test/thin-prototype-build.test.mjs` | `3f94699d92a0e06a0d33710cd7e8771f98055c560ba31ad9056cc5dd2bf402bd` | 35824 |
| `planning/MUTATION-ADMISSION-CONTRACT.json` | `4cbfc3aba3d1cdb5c85d2742d8a75f2cbd7dd8c0cb3e9fa8f5cff28c4bbc5a5f` | 15038 |
| `planning/CLOSEOUT-SYNC-INVENTORY.json` | `f48f7a940e5b6680df94aaa428e938e2ba99a08bc61c09f07f0e3fade84b148c` | 8554 |
| parent `planning/WORK-PACK.md` | `8eacd4209d5176e7e8c8904fa9ed8989e82dfc11bf94c6610b8ec9ed82c16d48` | 22401 |
| parent `TASK-OEWSN-01B-SEMANTIC-BUILD-EVOLUTION.md` | `0116f495221a81acb42a5338827c86454c7a9fc9700c5fba237e9a6ed53f377c` | 5043 |

Frozen patch0004, binding006 and accepted-findings digests remain respectively
`3115eecc439dd0288977883941a15bcb27ca5d2d544abeeeeb97b2113714749a`,
`1cf2f37ca9e675b15e39a5734beab0e56c11ec9155594328e145810bbb14c756`,
and `714871d3e4f4bc310f272e40f17bea8a720476280f91e15731cec200631793ad`.

## Commands and outcomes

- `node --check .../build-thin-prototype.mjs` — PASS.
- `node --test .../thin-prototype-build.test.mjs` — PASS, 25/25.
- Admission/closeout positive checks and three negative mutations — PASS.
- Both modified planning JSON files through `python3 -m json.tool` — PASS.
- Both modified Markdown files through `tools/check_markdown_links.sh` — PASS.
- Seven-target JSON/whitespace/contract/secret-shape audit — PASS.
- Dependency-free Node/DOM negative probe — PASS.
- Patch0004/binding006/findings identity check — PASS.
- Generated-output and temporary-workroot residue scan — empty.

The first new sanitizer run failed two fixtures because bare `TOKEN=...`
identifiers escaped the initial detector. The detector was corrected before
advancing; the complete suite then passed.

## Preserved boundaries and remaining work

- No generalized build, dependency fetch, browser run, SWU006 retry or SWU007
  execution occurred.
- The Node/DOM compatibility repair remains an owner decision. This package
  implements diagnostic survival; it does not select or implement that repair.
- Binding006 remains byte-exact historical failure evidence. Any later
  owner-selected compatibility successor must bind the new builder/test
  postimages above before a fresh attempt can pass builder identity checks.
- Public Arcanum and the generic Task Session implementation were not changed.
- Lifecycle reconciliation, per-SWU receipts and Invoke Refresh closeouts are
  deferred to the owner named by `HN-7362EC2F08B7`.

## Claim ceiling

The seven-SWU candidate-local failure-recovery implementation and its
no-network fixtures pass. This is not evidence that SWU006, the keyboard UI,
browser acceptance, release, deployment, production readiness or public
maintenance is complete.
