# M0 Context Pack

Status: session evidence  
Task: `M0 Freeze and classify sources`  
Mode: standard, strict  
Authority effect: none

## Obligation matrix

| Obligation | Evidence | Status |
| --- | --- | --- |
| Record both Git identities and dirty states | `GIT-STATES.json` | covered |
| Inventory every non-cache file under the seven selected migration roots | `SOURCE-MANIFEST.json` entries | covered |
| Classify source, generated output, evidence, dependencies, cache, and secret-bearing state | manifest classification vocabulary and entries | covered |
| Capture immutable file digests without copying content | per-entry SHA-256 | covered |
| Preserve dirty and untracked owner work | `OWNER-WORK-PRESERVATION.json` | covered |
| Exclude cache and secret-bearing state from copying | manifest `copy_eligible` and excluded-directory summaries | covered |
| Keep candidate definitions unchanged | write scope excludes `orchestrator/authority/definitions/` | covered |
| Provide deterministic completion checks | `VALIDATION.json` | covered |

## Selected context

- `development/orchestrator-product-migration/PLAN.md`, selectors `Migration DAG`, `Migration stages`, `Selective-copy rules`, and `Verification surface`: owns M0 obligations and later gates.
- `development/orchestrator-product-migration/INVENTORY.md`, selectors `Repositories checked`, `Holdings and proposed disposition`, `Dependency classes`, and `Retirement gates`: owns migration roots and preservation requirements.
- `orchestrator/define/ORCHESTRATOR-DEFINITION-PACK.v1-candidate.json`, selectors `goal_limits`, `blocked_actions`, and `claim_ceiling`: keeps definitions candidate and non-authorizing.
- `goals/profile.json`, selectors `blocked_effects`: prevents construction evidence from becoming product approval or deployment authority.
- `ontology/governance/profile.json`, selectors `blocked_outputs`: preserves the candidate governance boundary.
- `agent-routing/ROUTER.md`, selectors `D65 construction` and `No fallback`: controls exact native mutation.

## Write scope

Only the six files under `orchestrator/migration/m0/` named by the ARE effect proposal. No runtime source, candidate definition, legacy source, or unrelated dirty path may change.

## Done criteria

The stage passes when every discovered non-pruned migration-source file has one classification, digest, Git state, migration decision, and copy-eligibility posture; every pruned directory has a bounded summary; every dirty path is preserved explicitly; and validation recomputes the inventory without mismatch.

## Open Questions

M0 does not resolve final source precedence for changed runtime files. M3 through M8 own those merges.
