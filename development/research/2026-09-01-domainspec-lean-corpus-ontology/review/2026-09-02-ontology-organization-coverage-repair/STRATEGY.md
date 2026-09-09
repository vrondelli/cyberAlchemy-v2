# Lean corpus ontology coverage-repair review strategy

Status: closed — resolved; repaired change-request list approved  
Dispatch type: review  
Selected route: `CA2-ROUTE-DELEGATE`  
Target ontology: `CA2-ONTOLOGY-CANDIDATE-DOMAINSPEC-LEAN-CORPUS-2026-09-01` (`unregistered`, `research-candidate`)  
Authority effect: none

## P1 trigger decision

A dispatch is warranted because the repair combines four registries plus prior findings/audit evidence, requires isolated authorship, and needs independent verification and coverage approval. The previous dispatch is closed and cannot be extended.

## Lanes and subagents

| Group | Agent | Role and angle | Output | Scheduling |
| --- | --- | --- | --- | --- |
| `coverage-attacker` | Abramsky, Samson | Explorer; reconstruct every missing per-record disposition mechanically. | Read-only literal coverage matrix returned to parent. | First. |
| `repair-writer` | Riehl, Emily | Writer; preserve 11 verified requests and add exhaustive identity/disposition tables. | Writes only this continuation's `findings.md`. | After attacker; verifier feedback eligible. |
| `repair-verifier` | Gödel, Kurt | Skeptic; verify literal evidence and non-expansion. | Read-only KEEP/DROP plus disposition checks. | After writer; one zig-zag exchange. |
| `coverage-auditor` | Loregian, Fosco | Auditor; exact cardinality/identity audit. | Read-only PASS or finite defect list. | After verifier; one declared feedback edge to writer. |

All agents are pooled identities. Each group is singleton, so this sheet has no subject group and receives the deterministic no-subject tension disposition rather than model gate agents.

## Dependency flow

```text
coverage-attacker -> repair-writer <-> repair-verifier -> coverage-auditor
                         ^                                  |
                         +---------- feedback(1) -----------+
```

The whole sequence may run twice. Parent joins every helper and owns final approval. `attacks.md` collects attacker, verifier, and auditor returns; `findings.md` is the only delegated write.

## Inventory preflight

The machine index parses but fails current lookup readiness with 24 conformance errors and six top-level failures. The packet selects only the authority-layer constraint, exact-path constraint, and prior failed-audit record. This forces direct verification and exhaustive ID tables; Inventory cannot supply dispositions or authority. Post-result indexing remains explicit separately scoped residue.

## Gates and ledger

- Candidate schema: `0.10.0` from the repo-local owner.
- Registration: appended through the governed runtime as `2026-09-02-lean-corpus-ontology-coverage-repair-review`; registration content digest `da182d92a28f13e102b0c9e712f31404385d30875897dc52d3d3e6f082ce565d`.
- Readiness: PASS under schema `0.10.0`; sheet SHA-256 `05670ac51fc6d6575f8258899a55725304d31a08618c1d3d6d618ff655a336f7`; `LEDGER_READ=none`; `LEDGER_MUTATION=none`.
- Material projection: `domainspec.material-strategy.v3`; material SHA-256 `91bb5db5d600b14a1a611573bece4a6aff86c29c8c11a5679b1094e8c4429643`; deterministic comparison is `same`.
- Tension: PASS through the canonical no-subject checker/reviewer pair bound to the sheet digest; no gate agents spawned.
- Preconfirmation closure: PASS with zero blockers, first nonzero `0`, and spawn-attempt count `0`; receipt SHA-256 `445f3a7e02ff4f62f2b1d9055ff41fd9371c53024a84435d3bab76ba38b3e573`.
- Human confirmation: received for material SHA-256 `91bb5db5d600b14a1a611573bece4a6aff86c29c8c11a5679b1094e8c4429643`.
- Execution: all four declared agents joined in dependency order; no feedback edge was needed and one loop was used.
- Repair writer: created `findings.md` SHA-256 `32789e53deca2cbe97ef4d5b92a10f28ca85e78ebf53635779a73ceec65dc8d6` only.
- Repair verifier: PASS with all 11 requests retained and every enumerated disposition accepted.
- Coverage auditor: PASS with zero defects across 8 nodes, 12 sources, 8 invariants, 9 gaps, 0 relations, 2 receipts, Inventory/indexing residue, refutations, and claim ceiling.
- Parent final approval: granted for the repaired change-request list only.
- Closeout: governed close appended with `exit_reason: resolved`; close content digest `fe114fb9160a24c8df932375689f1d15ab5579e1b6cb9eaf52c82e3060eb53b0`.

## Stop conditions

Stop on source-byte drift, incomplete ID coverage, unsupported dispositions, change to any of the 11 verified findings without verifier acceptance, ontology or Inventory mutation, semantic-owner selection, relation adoption, D65 advancement, admission/acceptance, publication/deployment, or external effect.

## Result and next boundary

The review result is complete. Applying any of the 11 accepted change requests to the ontology candidate is a separate `CA2-ROUTE-IMPLEMENT` task requiring exact mutation scope and CAV2-D65 predecessor treatment. Inventory indexing also remains separately scoped because the current machine index is lookup-blocked. This dispatch changed neither surface.
