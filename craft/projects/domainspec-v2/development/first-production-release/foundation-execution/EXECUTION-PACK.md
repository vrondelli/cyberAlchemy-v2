# Execution Pack: DomainSpec v2 Foundation Execution

## Planning Controls

| Field | Value |
|---|---|
| planningGateStatus | FPR-01/W1 complete; FPR-02 lane split resolved; W2B decision and W2U implementation independently resumable |
| complexity | high |
| baselineWave | W0, W1, and W1R completed; W2 split into W2B and W2U |
| activePlanRef | `work-pack/waves/W2-SUPPORTED-PROFILE.md` with independent W2B/W2U children |
| workPackManifest | `WORK-PACK.md` |
| layeringArtifact | `IMPLEMENTATION-LAYERING.md` |
| specRef | accepted FPR decision + ROADMAP + expected manifest |
| activeLayerWindow | L1 |
| lastPlannedAt | 2026-07-17 |
| readinessProfile | pilot |

## Wave Schedule

| Wave | Task | Selected/ready unit | Entry | Exit | Promotion |
|---|---|---|---|---|---|
| [W0](work-pack/waves/W0-GUARD-REPAIR.md) | SGRM guard reopen | completed | accepted 006 review receipt + four exact candidates | accepted `SWU-SGRM-007-R1` retry receipt | W1 opened by proof refresh |
| [W1](work-pack/waves/W1-AUTHORITY-BASELINE.md) | FPR-01 | completed | verified FPR01-003 replay receipt | verified ratification receipt | W2 entry available by this synchronization |
| [W1R](work-pack/waves/W1R-FPR01-003-REMEDIATION.md) | FPR01-003 remediation | completed | completed definitions reconciliation + blocked receipt | exact guard and sample receipts + FPR01-003 PASS replay | recomposed into W1 |
| [W2](work-pack/waves/W2-SUPPORTED-PROFILE.md) | FPR-02 lane family | split active | synchronized FPR-01 receipt + lane decision | lane-owned receipts; no cross-lane join | W2B alone opens W3 |
| [W2B](work-pack/waves/W2B-BACKEND-PROFILE.md) | FPR-02B backend release | Decision Gate in progress | resolved lane split | stable backend profile digest + negatives | open W3/10/11 |
| [W2U](work-pack/waves/W2U-UI-PROFILE.md) | FPR-02U UI development | `SWU-UIP-001..004` complete; `SWU-UIP-005` next in external work-pack | resolved lane split | UI integrated audit + owner packet | future UI authority decision only |
| [W3](work-pack/waves/W3-BUSINESS-SPEC.md) | FPR-03 | none | FPR-02B receipt | accepted direction + total map | open W4 |
| [W4](work-pack/waves/W4-SPEC-PROJECTION.md) | FPR-04 | none | FPR-03 receipt | tiny Sg + separate retraction proof | allow read-only consumer evaluation |

## Execution Protocol

For each SWU:

1. Select exactly one SWU in the current wave.
2. Use Context Builder strict mode to materialize an execution-time pack from its source anchors.
3. Run Decision Gate first when the SWU owns a consequential choice.
4. Constrain writes to the declared paths.
5. Produce the named receipt and acceptance evidence.
6. Run positive and negative validation.
7. Synchronize continuation state only from a verified receipt and only with separate approval.
8. Stop on authority ambiguity, missing input, false-green success, or write-scope expansion.

## Commands by Wave

Commands for future tools are planned interfaces; they become executable only after their owning SWU creates them.

| Wave | Core verification |
|---|---|
| W0 | `npm --prefix projects/domainspec-v2/impl run audit:retired-orchestration`; focused guard test; `npm --prefix projects/domainspec-v2/impl run typecheck` |
| W1 | `node projects/domainspec-v2/development/first-production-release/tools/validate-authority-baseline.cjs --baseline .../authority-baseline.yml --mutants .../fixtures/authority-baseline` |
| W1R | guard audit + focused guard tests; engine lint + normalized-spec tests; joined canonical/mutant/full-validation replay |
| W2B | `node projects/domainspec-v2/development/first-production-release/tools/validate-supported-profile.cjs --contract .../product-contract.yml --profile .../supported-profile.yml --pilot-dir .../pilot` |
| W2U | Commands and receipts owned by `development/ui-profile-implementation/WORK-PACK.md`; currently `SWU-UIP-005` graph traversal/view validation. |
| W3 | `node projects/domainspec-v2/development/first-production-release/tools/validate-business-spec-map.cjs --manifest .../graphs/business-graph-manifest.json --map .../graphs/b-s-map.json --mutants .../fixtures/business-spec` |
| W4 | `node projects/domainspec-v2/development/first-production-release/tools/verify-spec-projection.cjs --source-manifest .../manifests/spec-source-manifest.json --semantic-manifest .../graphs/semantic-manifest.json --mutants .../fixtures/spec-projection` |

## Ownership Handoffs

```text
Invoke plan
  -> Task Session (review/execute one SWU)
  -> Decision Gate where named
  -> canonical owner review/promotion
  -> independent validation receipt
  -> Craft status synchronization by separate approved action
```

## Current Execution State

- Active foundation Task Session: none; lane next moves are independently named.
- Completed: W0, W1, W1R, `SWU-FPR01-001..004`, and all FPR01-003 repair/replay units.
- Ratification evidence: the exact baseline digest is bound by the verified FPR01-004 receipt; 19/19 bindings, canonical replay, five mutants, aggregate validation, and the deliberate mutation check pass.
- Backend: resume `SWU-FPR02-001`; the lane split is resolved and four
  backend/pilot decision groups remain. `SWU-FPR02-002/003` and FPR-03/FPR-04
  remain dependency-gated.
- UI: the external work-pack has `SWU-UIP-001..004` complete and `SWU-UIP-005`
  ready. Its state does not gate backend continuation.
- Authorization: this refresh synchronizes planning and continuation only. It
  executes no SWU and grants no profile admission or production authority.
