# SWU-OEWSN-006 typed-test failure findings

## Direct answer

Two causes are independently proved.

First, the bound candidate has a **test/configuration incompatibility**. Patch0004 adds two `navigation.test.tsx` tests that use `document`, focus, and `activeElement`, while the builder generates `vitest.oew.config.mjs` with `test.environment: "node"`. In the bound Node v22.12.0 environment, the first `document.body.innerHTML` statement necessarily raises `ReferenceError: document is not defined`; therefore the binding006 focused suite cannot pass as configured. This is a static proof from the bound postimage and builder, not an inference from the generic terminal error. It does not decide whether the later repair belongs in the test or generated configuration, and it does not prove that `restoreRelationFocus` product semantics are defective. [research.md §Hewitt/Verdict, lines 7-16; §Binding and hash closure, lines 36-46; §Minimal static/no-network witness, lines 62-78](research.md)

Second, the missing actionable report has a proved **diagnostic-loss cause**. `command()` held complete Vitest stdout and stderr; `commandReceipt()` reduced those streams to hashes; `buildThinPrototype()` threw only `TYPED_TESTS_FAILED`; and mandatory cleanup removed the candidate workroot and isolated store. No failure artifact or exception payload survived. The first semantic loss was the hash-only conversion, while cleanup made the loss operationally irreversible. Cleanup itself remains required. [research.md §Beer/Verdict, lines 91-108; §Causal timeline, lines 110-126](research.md)

The exact Vitest reporting order, focus behavior once a DOM is supplied, and any additional selected-test or import failure remain unproved. The consumed attempt does not authorize a retry, SWU006 remains blocked and selected, and SWU007 remains stopped. [receipts/evidence-closure.json `/unproved`, `/writer_repairs`](receipts/evidence-closure.json)

## Binding and execution path

The evidence closes over binding005 `d66c0262994fd3ace8335b67da260663f307bd6708d4bc5089c6a8c07f738275`, binding006 `1cf2f37ca9e675b15e39a5734beab0e56c11ec9155594328e145810bbb14c756`, patch0003 `f862611f93e718997aedf2eb987fc5f6d018facad8096b357095caafaf4c5f58`, patch0004 `3115eecc439dd0288977883941a15bcb27ca5d2d544abeeeeb97b2113714749a`, builder `6a762811808932c698ebebb7eb176b27bf7f65c5153ef03edc9010a26c9aee24`, builder tests `bdb5d6440533134c23fd6504f45ae4214ec59f12b751e68574b2ba327134de18`, and the bound `navigation.test.tsx` postimage `1d0f6e569872709b124026e5b1bde970428df0a478e144142569014eab9ba4cf`. [research.md §Binding and hash closure, lines 36-46](research.md)

1. Binding006 validates binding005 and cumulative patch order 0003 then 0004.
2. Patch0004 transforms `keyboard.ts`, `store.ts`, `OewApp.tsx`, and `navigation.test.tsx`.
3. Binding006 `/typed_test_contract` selects seven files and requires fifteen tests: the eleven predecessor tests plus four navigation tests.
4. The builder creates the isolated workroot, applies the candidate, and generates `packages/dashboard/vitest.oew.config.mjs` with `environment: "node"`.
5. It invokes dashboard Vitest over the seven exact files.
6. The new activation-key test is environment-compatible. The following DOM test reaches `document.body.innerHTML` and necessarily raises `ReferenceError` under Node.
7. The nonzero exit is mapped to `TYPED_TESTS_FAILED`; the receipt conversion strips streams; the thrown error omits the receipt and diagnostics.
8. `finally` removes workroot and isolated store, and the CLI can emit only `TYPED_TESTS_FAILED: TYPED_TESTS_FAILED`.
9. Task Session correctly records BLOCK, consumes the one authorized attempt, emits no success artifacts, and does not advance to SWU007.

This path and its exact code selectors are established at `build-thin-prototype.mjs:869-910,1673-1708,1888-1894,1945-1947`. [receipts/synthesis-return.md §Exact execution path](receipts/synthesis-return.md)

## Candidate/test matrix

| Candidate/test | Required facility | Generated environment | Finding |
| --- | --- | --- | --- |
| Existing navigation deep-link test | Pure JavaScript | Node | Compatible |
| `admits only native Enter and Space activation keys` | Pure JavaScript | Node | Compatible |
| `restores one selected actionable relation and excludes inert geometry` | `document`, DOM focus, `activeElement` | Node | Proved incompatibility and sufficient failure cause |
| `uses the scene heading fallback and blocks ambiguous relation focus` | `document`, DOM focus, `activeElement` | Node | Proved incompatibility and sufficient failure cause |
| `binds restoration to one exact relation instance` | Store only | Node | Environment-compatible |
| Other six files / eleven predecessor tests | No newly observed direct DOM requirement | Node | No incompatibility found; additional failure remains possible |
| `restoreRelationFocus(root = document)` | Browser default global | Browser-targeted code | Not proved defective; the tests explicitly pass `document` |

The matrix is bound by the exact seven-file/fifteen-test contract; it does not generalize “no incompatibility found” into proof that all remaining tests pass. [research.md §Candidate-test contradiction matrix, lines 48-60](research.md)

## Diagnostic-loss chronology

| Moment | Evidence then available | Persisted result |
| --- | --- | --- |
| Admission | Exact writes and one build attempt | No failure-evidence path admitted |
| Builder contract validation | 21/21 tests passed | Pass summary only; the actual nonzero typed-test branch was not driven |
| Vitest child completion | Command identity, exit, duration, stdout, stderr | Nothing persisted |
| `commandReceipt()` | Full result still transiently available | Hash-only receipt in memory; first semantic loss |
| Generic throw | Hash-only receipt and transient full result | Only `TYPED_TESTS_FAILED` attached to the exception |
| Cleanup | Patched workroot as alternate forensic source | Workroot/store correctly removed; no retained failed workspace |
| Task Session | Generic mapped issue and absent success outputs | BLOCK and consumed authorization, without a diagnostic reference |
| Closeout and continuity | Terminal blocker | SWU006 selected, `next_swu: null`, SWU007 stopped |
| Signal Observer | Cross-artifact fact that diagnostics were absent | Correct recommendation only; no mutation or retry authority |

The 21 passing builder-contract tests prove existing binding and discovery guards, not diagnostic preservation on the actual failure branch. SWU005 shows that a success handle can retain command identity and stream hashes, but SWU006 failed before handle construction. [research.md §Causal timeline, lines 110-126; §SWU005 comparison, lines 128-137](research.md)

## Existing-owner delta map

No new skill or capability is warranted. Every prevention belongs to an existing owner, and the test/configuration repair remains unselected. [receipts/skeptic-precedent-return.md](receipts/skeptic-precedent-return.md)

| Owner | Classification | Bounded delta | Must not become |
| --- | --- | --- | --- |
| Private OEW builder and builder tests | Build from owned | Add a narrow injected command-runner seam; pre-admit, sanitize, persist, digest-bind, and reference one failure artifact before cleanup; add pass, nonzero, and single-fault fixtures | A diagnostic skill, raw-output success handle, retained workspace, retry mechanism, or false success |
| OEWSN planning/admission | Build from owned | Predeclare one bounded mutually exclusive terminal-evidence slot with normalized path, schema, size, redaction, collision, and producer constraints | Execution or retry authority; an undeclared/unbounded output |
| Task Session | Build from owned | Fill an existing terminal-receipt field/negative-fixture gap by joining a producer-owned `failure_evidence` reference, authorization state, and cleanup summary | Builder-specific capture, private OEW schema ownership, workspace retention, or completion evidence |
| Task Session Until Blocker | Already deployed | At most add a fixture or clarification that an inner BLOCK retains its joined evidence reference and prevents advance | Duplicate artifact/schema or a new implementation owner |
| Signal Observer | Already deployed | Continue observing presence/absence and recommending a targeted update | Root-cause inference, mutation authority, or retry authority |
| Sigil Maintenance Loop | Already deployed | A separately approved route may later consider only a project-agnostic Task Session reference contract | Direct OEW builder repair, premature maintenance claim, or private-to-public prose transfer |
| Patch0004 tests / builder-generated config | Build from owned, not selected | A later decision must choose whether to make the per-file DOM requirement explicit or supply an appropriately bounded generated test environment | A research-side choice or product-semantics edit |
| `oew.failure-evidence.v1` | Precedent-clean project-local schema | Keep as a private producer artifact schema | A capability, skill, or public Arcanum schema |

## Project-local failure-evidence contract

The private OEW producer should eventually emit exactly one pre-admitted `oew.failure-evidence.v1` artifact for an acceptance-critical command failure, outside the temporary workroot and before cleanup. Its minimum fields are:

- immutable work-pack, SWU, and attempt identity; `result: "block"`; issue and gate;
- allowlisted command identity, cwd role, exit code, and duration;
- stdout/stderr original SHA-256 and byte size plus deterministic redacted, bounded head-and-tail text and truncation state;
- exact candidate inputs by relative path, digest, and size;
- cleanup results including workroot and isolated-store removal and `source_retained: false`;
- authorization identity, attempts allowed/used, `consumed: true`, and `retry_authorized: false`;
- privacy fields recording no environment capture, redaction version, and a secret scan over sanitized bytes;
- a claim ceiling and `authority_effect: "none"`.

Creation must use a normalized contained collision-reject path, fixed stream and artifact ceilings, and exclusive creation. It must exclude environment dumps, credentials, tokens, absolute temporary paths, `node_modules`, lockfile contents, and the failed workspace. Evidence-persistence failure must produce a stronger `FAILURE_EVIDENCE_PERSIST_FAILED` blocker; cleanup failure must also remain a distinct stronger blocker. Neither may become success. [research.md §van Lamsweerde/Smallest reusable fail-closed contract, lines 166-168](research.md)

Task Session should reference this producer artifact through generic fields such as status, path, SHA-256, schema, producer, gate, issue, and unavailable reason, together with authorization and cleanup state. It must remain BLOCK with `diagnostic-evidence-missing` when expected evidence is absent or invalid. The private schema must not cross into public Arcanum; only a project-agnostic evidence-reference contract may later cross after its own approval gate. [receipts/skeptic-definitional-return.md](receipts/skeptic-definitional-return.md)

## Mandatory later no-network fixture suite — not yet implemented

This suite is mandatory acceptance evidence for a later implementation, but no present test demonstrates it: `command()` currently calls `execFile` directly and existing tests do not drive the real nonzero `typed-tests` branch. The prevention candidate is **not implemented, executed, or passing**. [receipts/skeptic-non-vacuity-return.md](receipts/skeptic-non-vacuity-return.md)

1. Passing injected command: one invocation, normal success handle, no failure artifact, cleanup proved.
2. Failing focused command: inject exit 1, deterministic failing file/test identity, `ReferenceError: document is not defined`, a secret marker, and oversized streams; require exactly one invocation, zero following commands, typed BLOCK, bounded actionable evidence, one consumed attempt, no retry, no success outputs, and absent workroot/store.
3. Empty diagnostics: stronger missing-evidence blocker, no success.
4. Oversized diagnostics: deterministic head-and-tail truncation with original sizes/digests; cleanup remains mandatory.
5. Secret/environment injection: token is redacted, environment is absent, and leakage blocks.
6. Relative, absolute, normalized, and symlink path escape: reject before command invocation.
7. Evidence-writer failure: `FAILURE_EVIDENCE_PERSIST_FAILED`, one attempt, no handle, cleanup proved.
8. Cleanup failure: distinct blocker; retained source never substitutes for failure evidence.
9. Missing admitted evidence: Task Session remains BLOCK with `diagnostic-evidence-missing`.
10. Until Blocker propagation: preserve the inner evidence reference and do not advance.
11. Observer negative: recommendation cannot mutate, retry, or infer root cause.
12. Static candidate witness: in Node, `document` is undefined and the first bound DOM statement raises `ReferenceError`, without dependencies, network, build, or retry.

## Rejected alternatives

- Selecting test-side versus config-side repair in research: rejected because evidence closure leaves that owner decision open.
- Calling the product semantics defective: rejected because the environment incompatibility prevents reaching those behavioral assertions and no admitted product requirement violation is proved.
- Renaming `TYPED_TESTS_FAILED` or preserving hashes only: rejected because neither retains actionable evidence.
- Retaining the failed workspace: rejected on privacy, boundedness, and cleanup grounds.
- Weakening cleanup or allowing persistence/cleanup failure to pass: rejected because fail-closed cleanup is invariant.
- Retrying the generalized build or using network to diagnose the consumed attempt: rejected because this research has no retry authority.
- Making Task Session capture streams or own `oew.failure-evidence.v1`: rejected as owner collapse.
- Creating a new diagnostic skill/capability: rejected because builder, admission, Task Session, Until Blocker, observer, and maintenance already own the relevant responsibilities.
- Treating observer recommendation as implementation authority or research acceptance as SWU completion: rejected by the authority boundary.

These exclusions implement the precedent, non-vacuity, and definitional skeptic gates. [receipts/skeptic-precedent-return.md](receipts/skeptic-precedent-return.md) [receipts/skeptic-non-vacuity-return.md](receipts/skeptic-non-vacuity-return.md) [receipts/skeptic-definitional-return.md](receipts/skeptic-definitional-return.md)

## Adoption order

1. Separately approve the prevention contract and existing-owner split.
2. Extend OEWSN planning/admission with the bounded terminal-evidence slot.
3. Implement private builder persistence and the complete injected, deterministic, no-network fixture suite.
4. Validate failure behavior through those fixtures only—without a generalized build or another SWU006 attempt.
5. If separately approved, route the project-agnostic Task Session evidence-reference field and negative fixture through maintenance; do not export the private OEW schema or prose.
6. Confirm existing Until Blocker propagation and observer non-authority with fixtures or clarification only if absent.
7. Through a separate decision/admission route, select the test-side or config-side correction.
8. Require fresh explicit authorization for any later SWU006 build attempt.

## Residue and bounded later implementation route

Unresolved residue is explicit: focus behavior under an admitted DOM environment is untested; either focus assertion may still fail; another selected test or import may also fail; and the mandatory failure-evidence fixtures have not been implemented or run. None of that residue weakens the proved environment incompatibility or diagnostic-loss sequence. [receipts/evidence-closure.json `/proved`, `/unproved`](receipts/evidence-closure.json)

One bounded later implementation route may be proposed after separate approval: **private OEW failure-evidence implementation**, limited to the existing builder, its builder tests, and the predeclared OEWSN terminal-evidence slot. Its acceptance boundary is the mandatory no-network fixture suite above; it must not change patch0004 product semantics, choose the DOM repair, invoke a generalized build, use network, retry SWU006, change public Arcanum, complete SWU006, or advance SWU007. A generic Task Session reference delta, if desired, remains a separate maintenance route.

These are research findings with `authority_effect: "none"`. They diagnose and bound later work; they do not authorize mutation, retry, promotion, SWU006 completion, or SWU007 advancement.
