# Exact-Binding Synthesis Return

## Direct verdict

Three truths must remain distinct:

1. **Proved immediate incompatibility:** patch0004’s bound `navigation.test.tsx` postimage adds two tests that use `document`, focus, and `activeElement`, while the builder generates a Vitest configuration with `test.environment: "node"`. In Node v22.12.0 the first `document.body.innerHTML` statement necessarily raises `ReferenceError: document is not defined`. The binding006 suite cannot pass as configured. This is proved statically from the bound candidate and builder, independently of the destroyed runtime report. Sources: `research.md` Hewitt verdict and execution path; binding006 `/typed_test_contract`; `build-thin-prototype.mjs:1679-1689`; bound postimage SHA-256 `1d0f6e569872709b124026e5b1bde970428df0a478e144142569014eab9ba4cf`.
2. **Proved diagnostic-loss cause:** `command()` captured complete Vitest stdout/stderr, but `commandReceipt()` reduced them to hashes; `buildThinPrototype()` then threw only `TYPED_TESTS_FAILED`, and `finally` removed the candidate workspace. No failure artifact or exception payload survived. Sources: `research.md` Beer verdict and chronology; `build-thin-prototype.mjs:869-910,1673-1708,1888-1894,1945-1947`.
3. **Still unproved:** exact Vitest reporting order, whether either focus-behavior assertion would fail after supplying a DOM, and whether another selected test/import would also fail. The original terminal receipt alone could not establish the environment contradiction. Later static reconstruction establishes it but cannot reconstruct destroyed runtime ordering or secondary failures.

This is presently a **test/configuration-boundary defect**, not evidence that `restoreRelationFocus` product semantics are wrong. The smallest candidate correction would make `navigation.test.tsx`’s DOM requirement explicit or supply an appropriately bounded DOM test environment. Research authority does not select or implement that correction.

## Exact execution path

1. Binding006 validates binding005 and cumulative patch order 0003 then 0004.
2. Patch0004 transforms `keyboard.ts`, `store.ts`, `OewApp.tsx`, and `navigation.test.tsx`.
3. `/typed_test_contract` selects seven files and requires fifteen tests.
4. The builder creates the isolated workroot and applies the candidate.
5. It generates `packages/dashboard/vitest.oew.config.mjs` with `environment: "node"`.
6. It invokes the dashboard Vitest command over the seven exact files.
7. The activation-key test is pure JavaScript and environment-compatible.
8. The first new DOM test reaches `document.body.innerHTML`; Node has no `document`, so the command necessarily exits nonzero.
9. Line 1708 maps every nonzero typed-test exit to `TYPED_TESTS_FAILED`.
10. `commandReceipt()` has reduced output streams to hashes.
11. The thrown error carries neither the command receipt nor diagnostics.
12. `finally` removes workroot and isolated store.
13. The CLI emits only `TYPED_TESTS_FAILED: TYPED_TESTS_FAILED`.
14. Task Session correctly remains BLOCK, consumes the one authorized attempt, emits no success artifacts, and does not continue to SWU007.

## Candidate/test matrix

| Candidate/test | Facility | Environment | Verdict |
| --- | --- | --- | --- |
| Existing navigation deep-link test | Pure JS | Node | Compatible |
| `admits only native Enter and Space activation keys` | Pure JS | Node | Compatible |
| `restores one selected actionable relation and excludes inert geometry` | `document`, DOM focus, `activeElement` | Node | Proved contradiction and sufficient failure cause |
| `uses the scene heading fallback and blocks ambiguous relation focus` | `document`, DOM focus, `activeElement` | Node | Proved contradiction and sufficient failure cause |
| `binds restoration to one exact relation instance` | Store only | Node | Environment-compatible |
| Other six files / eleven predecessor tests | No new direct DOM requirement observed | Node | No contradiction found; other failure is not disproved |
| `restoreRelationFocus(root = document)` | Browser default global | Browser-targeted code | Not proved defective; tests explicitly pass `document` |

## Diagnostic chronology

| Moment | Evidence available | What survived |
| --- | --- | --- |
| Admission | Exact allowed writes and one build attempt | No failure-evidence path admitted |
| Builder contract validation | 21/21 tests passed | Pass summary only; no nonzero focused-test fixture |
| Vitest child completion | Full command identity, exit, duration, stdout, stderr | Nothing persisted |
| `commandReceipt()` | Full result still in local variable | Only hashes in an in-memory receipt |
| Generic throw | Hash-only receipt plus transient full result | Only `TYPED_TESTS_FAILED` in exception |
| Cleanup | Complete patched workroot as alternate forensic source | Workroot/store correctly removed |
| Task Session | Mapped issue and absent success outputs | BLOCK and consumed authorization; no diagnostic reference |
| Closeout/continuity | Terminal blocker | SWU006 selected, `next_swu:null`, SWU007 stopped |
| Observer | Cross-artifact evidence of diagnostic loss | Correct high-severity recommendation; no mutation authority |

The first semantic loss is `commandReceipt()`; cleanup makes it operationally irreversible. Cleanup must remain mandatory.

## Owner decisions

### Builder code and tests — should change

- Pre-admit one failure-artifact path outside the workroot.
- On an acceptance-critical child failure, sanitize and persist exactly one artifact before cleanup and without retry.
- Use contained-path checks, collision-reject creation, and fixed stream/artifact ceilings.
- Always clean workroot and isolated store.
- Throw the typed blocker with a digest-bound artifact reference.
- If persistence fails, return a stronger `FAILURE_EVIDENCE_PERSIST_FAILED` blocker; never false-success.
- Keep the success handle free of raw output and emit no failure artifact on pass.
- Add an injected, no-network command seam and real nonzero focused-test fixtures.

### Planning/admission — should change before another attempt

Predeclare `generated/runs/SWU-OEWSN-006/<attempt>/failure-evidence.json` or a mutually exclusive terminal-evidence slot. Bind schema, normalized path, size ceiling, redaction policy, collision behavior, and producer. Reject undeclared, escaping, or unbounded paths. This does not authorize retry or candidate mutation.

### Task Session — small reusable change

Require a terminal `failure_evidence` reference with status, path, SHA-256, schema, producer, gate, issue, and unavailable reason; also bind authorization consumption, retry authorization, and cleanup. If expected evidence is absent or invalid, remain BLOCK with `diagnostic-evidence-missing`. Task Session joins producer evidence; it does not capture output or retain workspaces.

### Until Blocker — no demonstrated implementation change

Add only a fixture or clarification, if absent, that an inner BLOCK preserves its evidence reference and missing/unjoined receipts block the chain. Do not duplicate the artifact/schema.

### Signal Observer — no implementation change

It correctly detected the gap. It may observe presence/absence but must not infer root cause or convert recommendation into mutation/retry authority.

### Sigil Maintenance Loop — no direct change now

A separately approved maintenance route may later update the generic Task Session receipt contract. The OEW builder repair is project implementation. Observer evidence alone is not authority.

## Minimal `oew.failure-evidence.v1`

The bounded artifact needs:

- immutable attempt identity and result `block`;
- issue and gate;
- allowlisted command identity, cwd role, exit code, duration;
- stdout/stderr original SHA-256 and byte size plus deterministic redacted, bounded head-and-tail text;
- exact candidate inputs with relative path, digest, and size;
- cleanup results with `source_retained:false`;
- authorization with attempts allowed/used, consumed true, retry false;
- privacy fields proving no environment capture, redaction version, and secret scan;
- claim ceiling and `authority_effect:"none"`.

It must exclude environment dumps, credentials, tokens, absolute temp paths, `node_modules`, lockfile contents, and retained failed workspaces.

## Deterministic no-network fixtures

1. Passing injected command: success handle, no failure artifact, cleanup proven.
2. Failing focused command: deterministic test text retained within bounds, typed BLOCK, one attempt, cleanup proven.
3. Evidence write failure: stronger blocker, no handle/false success, cleanup proven.
4. Missing admitted evidence: Task Session BLOCK plus `diagnostic-evidence-missing`.
5. Path escape/unbounded output: admission rejects before execution.
6. Secret fixture: token redacted, environment absent, secret scan on sanitized bytes.
7. Cleanup regression: stronger blocker; retained workspace never substitutes for evidence.
8. Until Blocker propagation: inner evidence reference retained and no advance.
9. Observer negative: recommendation only, no mutation/retry authority.
10. Static candidate witness: Node has no `document`; first bound DOM statement raises `ReferenceError` without build/network/retry.

## Adoption order and scope

1. Approve the prevention contract and owner split separately.
2. Update planning/admission with bounded failure evidence.
3. Implement builder persistence and no-network fixtures.
4. Validate failure behavior without a generalized build or another SWU006 attempt.
5. Separately route the reusable Task Session reference change through maintenance.
6. Confirm Until Blocker propagation and observer non-authority.
7. Later select the exact test/config repair through a separate decision/admission route.
8. Any later retry needs fresh explicit authorization.

Should not change on present evidence: `restoreRelationFocus` semantics, other patch0004 product code, success-handle output minimization, mandatory cleanup, observer authority, Sigil Maintenance Loop directly, retry count, immutable-lockfile policy, SWU007 stop, public/private boundaries, or any new skill/capability that merely renames existing ownership.

Residue: focus behavior under an admitted DOM environment remains untested; secondary failures remain possible but unsupported; research acceptance is not implementation admission.
