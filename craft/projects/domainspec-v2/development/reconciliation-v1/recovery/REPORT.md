# DSR-001 — source preservation completed

Result: **PASS — selected-input preservation only.** Captured 2026-09-08.
This completes DSR-001, not the whole first phase or the DomainSpec product.
Authority effect: none. Runtime: local/native. Adapter: none.

## What is preserved

| Surface | Result |
| --- | --- |
| Selected paths | 1,298 accounted for: 1,291 existing and seven absent. |
| Preexisting working changes | All 88 selected paths preserved: 13 tracked modifications and 75 untracked files, including the six planning files. |
| Git preimages | 26 additional HEAD/index versions preserved for the 13 tracked modifications. |
| Frozen @10 members | All 847 checked: 811 match, 36 differ, none missing. The baseline and its owner binding remain unchanged. |
| CLI source and generated output | 73 source files and 288 dist files independently identified. No rebuild or equivalence claim. |
| Existing CLI archives | Seven complete original archives preserved and rehashed. |
| Recovery bundle | 1,287 distinct byte objects, compressed to 5,405,353 bytes. Paths/modes and digest-to-byte mappings permit isolated recovery. |

The accepted successor archive matches its exact recorded digest. Current
package.json and dist/cli/main.js differ from their members in each of the seven
archives. Source members are unavailable at the inspected package/src paths;
that absence is not evidence that source and generated JavaScript are equivalent.
The selected output-layout archive also matches its candidate's digest, but that
candidate's acceptance state is independent of the accepted successor.

Seven missing BMC references remain explicit absences. No receipt was fabricated
and no historical SFOL patch was reconstructed in this unit.

## Artifacts and repeatable verification

- [Source snapshot](source-snapshot.json): exact paths, reasons for selection,
  current and baseline hashes, Git state, archive comparisons and missing inputs.
- [Preservation manifest](preservation-manifest.json): snapshot/archive identities.
- [Preimage bundle](preimages.json.gz): gzip JSON mapping SHA-256 to base64 bytes.
- [Verification](verification.json): V01/V02 results and exact synchronization exceptions.
- [Context and boundaries](CONTEXT.md): Task Session and lean Context Builder evidence.

From the DomainSpec project root:

```sh
node --test development/reconciliation-v1/recovery/snapshot.test.mjs
node development/reconciliation-v1/recovery/snapshot.mjs verify development/reconciliation-v1/recovery/synchronizations.json
```

The checker decodes and rehashes every backup object, verifies every selected
current file or expected absence, checks HEAD/index preimages, and reports newly
dirty paths outside this recovery directory. PLAN.md and WORK-ITEMS.json have
exact before/after digest exceptions for this closeout only. Other changed bytes
fail verification. A future legitimate edit requires a new evidence epoch; never
refresh this snapshot to make a changed source appear preserved.

Capture refuses to overwrite the existing epoch; the negative check confirmed
that refusal. Do not rerun capture expecting it to update this backup. Recovery
must use a new explicit destination and must not overwrite working source.

## Validation and corrections

- V01: PASS — 1,298 path checks, full object verification, baseline comparison,
  selected owner/candidate identity checks and seven archive rehashes.
- V02: PASS — nine tests, zero failures/skips; byte drift, absence/appearance,
  tampering, path escape, symlinks, binary and empty files covered. Selected
  current bytes and HEAD/index preimages remained unchanged except the two
  digest-bound planning synchronizations.
- The first verifier attempt incorrectly treated an empty base64 string as a
  missing backup object. This was a checker defect, not missing source data.
  Object-key presence now controls that check; an empty-file regression test
  and the complete live verification pass. The captured archive was not replaced.
- All 42 prior selected source hashes, 42 remaining work items, 60 remaining
  validation cases and all 13 decision recommendations are unchanged.

No current DomainSpec compiler, semantic, non-collapse, orthogonality, runtime or
installed-package product tests were run here. The nine tests exercise the
preservation tool only. Historical test reports do not become fresh results.

## Task Session closeout and next frontier

Context: five linked instruction/task sources, strict obligation coverage PASS;
no runtime handoff, no delegation, no broad fallback search. Gate: bounded local
preservation authorized by the user; no blocker-level decision required. The
router's receipt is assessment evidence, not approval or admission. No new
ontology record or semantic definition was created by this operational unit.
Experiment harness: not applicable; reusable skill behavior was not changed.

Only this recovery package and the DSR-001/current-frontier planning records were
written. No compiler, canonical definition, frozen baseline, accepted package,
Git index/HEAD, commit, remote, release or publication changes were made.

Next recommended product-construction unit: **DSR-003**, the independent-state
support matrix; then DSR-006 definitions and DSR-007 minimum Entity/Query proof.
DSR-002 portfolio inventory and DSR-004/005 historical recovery remain visible
work. This preservation snapshot does not complete any of those units or grant
their execution/admission automatically.

## Open Questions

The product decisions remain with [DECISIONS.md](../DECISIONS.md). Missing BMC
evidence is owned by DSR-004; historical SFOL recovery by DSR-005. There are no
unresolved questions blocking the completed selected-input preservation unit.
