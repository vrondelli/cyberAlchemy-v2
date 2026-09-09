# Coverage audit

Auditor: Brandenburg, Martin  
Dispatch: `2026-07-27-oew-plan-architecture-runtime-audit`  
Verdict: **RECOMMEND_REJECT**

The substantive synthesis is coherent, but the frozen coverage contract is not
yet satisfied.

## Checks

| Gate | Result | Evidence |
| --- | --- | --- |
| Finding count | PASS | `findings.md` contains exactly four `### MAJOR` findings and no CRITICAL or MINOR finding. The zero-findings red flag does not fire. |
| Current evidence and fresh commands | PASS | Quoted selection, blocker, independent-verifier, and Poker-Team lifecycle evidence matches current bytes. A fresh `npm run verify:upstream` passed 6/6 and emitted `verified:true` with `authority_effect:none`; fresh `npm run test:ui-store` failed with `Missing script: "test:ui-store"`. This proves current L0 retained-byte verification and the missing L1 entrypoint only. |
| Finding shape | PASS | Each surviving finding has MAJOR severity, current path/evidence, impact, and one-line repair. Refuted and duplicate candidates are absent from final Findings and remain in the attack/refutation record. |
| Runtime route matrix | PASS | It covers D, B, expanded A, the private OEW adapter over generic Arcanum mechanics, existing OEW preparation, Node-native C, and rejected current A. D alone is current authorization; B and expanded A are future recommendations only. |
| Boundary coverage | PASS | Package, effective lock, network/cache, isolation, cleanup, receipt, target inventory, selection, public/private, exact-evidence versus presentation, and `authority_effect:none` ceilings are explicit. Poker-Team is consistently a consumer example, never authority. |
| Complete return preservation | **FAIL** | `attacks.md` is a compact synthesis. It does not preserve the attackers' complete initial and post-robot positions or both verifiers' complete initial/final returns: detailed severity traces, obligation/failure matrices, per-artifact dispositions, command evidence, objections, and repair qualifications present in the five source returns are omitted or compressed. Source handles do not satisfy the dispatch requirement that `attacks.md` itself preserve the complete positions. |
| Whole-corpus attacker coverage | **FAIL** | Complete-corpus coverage is not auditable for all three attackers. van Lamsweerde asserts corpus-wide current-byte review and Bateson supplies a corpus-member disposition table. Hewitt supplies strong empirical runtime evidence but neither attests complete declared-corpus review nor traces every declared artifact; many design, planning, live-runtime, and reuse-candidate members have no explicit Hewitt coverage marker. |
| Per-artifact KEEP/FIX | **FAIL** | The final table is not per artifact for the declared corpus. It collapses all live OEW implementation/retained artifacts into one row and all Inventory, Experiment Harness, OCGP, and Poker-Team artifacts into another. Consequently individual package, lock, scripts, source/test directories, receipts/archives, runtime-faceted-layout, phase-gate/scripts, OCGP fixture/receipt, and Poker-Team Vite/Playwright/e2e artifacts have no final individual disposition. |

## Required revisions

1. Expand `attacks.md` so each of the three attacker sections preserves its
   complete initial and post-robot position, and each verifier section
   preserves its complete initial and final return, including material tables,
   objections, commands, qualifications, disagreements, and dispositions.
2. Add an auditable corpus-coverage ledger for each attacker against every
   `current_artifact_evidence.paths[]` member. Obtain a Hewitt correction if
   complete review cannot be demonstrated from the existing return; do not
   infer coverage from the prompt alone.
3. Expand the final KEEP/FIX table to one row per declared artifact path.
   Directory members may be one row only where the declared corpus itself names
   the directory; do not combine unrelated declared paths or candidate
   families.
4. Re-run this downstream coverage gate after those documentary repairs. Keep
   the verified `4 MAJOR; 0 CRITICAL; 0 MINOR` count and present route/authority
   ceilings unchanged unless upstream verifier evidence itself changes.

No decision gate is resolved and no execution, refresh, selection, or L1
mutation is recommended by this audit.
