---
task: SWU-FPR01003-GUARD-001
mode: standard
strict: true
status: pass
max_files: 16
evidence_kind: task-session-context
created_at: 2026-07-17T01:20:00Z
refreshed_after_live_drift: true
---

# Context Pack — SWU-FPR01003-GUARD-001

## Objective

Review every current whole-word retired-orchestration reference violation and either
remove an unnecessary match or pin its path, count, matched-line digest, disposition,
and reason.
Keep the SGRM-001 manifest byte-identical and preserve active-reference and digest-drift
negative controls.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
|---|---|---|---|
| G1 | Cover all ten reviewed content files and every matched line visible across the initial and refreshed audit. | live audits; guard-generated match records; ten content files | covered |
| G2 | Use exact path/count/digest/reason classifications, never wildcard or filename inference. | allowlist schema; guard exception checks | covered |
| G3 | Preserve the four canonical `DS-D1.10` tombstone surfaces without reviving the superseded type as active orchestration. | definitions receipt; canonical matched lines | covered |
| G4 | Preserve the three owner-decision/research files only as non-runnable evidence. | exact matched lines and artifact roles | covered |
| G5 | Keep the frozen SGRM-001 manifest byte-identical. | pre-mutation SHA-256 `24ba83d155c96087b8f7cf4afd8bcf64026d7483e6c2f7740fdbbd8f1b2530f9` | covered |
| G6 | Preserve fail-closed active-reference and digest-drift behavior. | focused guard tests | covered |
| G7 | Restrict writes to the exact allowlist and this run directory. | remediation task contract | covered |
| G8 | Return an auditable receipt with before/after digests and validation. | Task Session contract and SWU acceptance evidence | covered |

Coverage: 8/8 obligations, 100 percent. Construction blockers: none.

## Authority Precedence

1. The completed Definitions Governance receipt owns current `DS-D1.10` semantics:
   superseded, non-reusable, and absent from the active backend set.
2. The frozen SGRM-001 manifest is historical census evidence and must not be rewritten.
3. The guard's exact exception mechanism is the current route for reviewed
   post-census or changed-content references.
4. The remediation task contract limits mutation to the allowlist and run evidence.

## Selected Evidence

| Source | Selector | Obligation |
|---|---|---|
| `work-pack/tasks/TASK-FPR01-003-REMEDIATION.md` | guard SWU objective, write scope, done criteria, validation, handoff | G1-G8 |
| `WORK-PACK.md` | selected SWU, blockers, successor gates | G7-G8 |
| `definitions/reviews/2026-07-16-fpr01-meta-type-reconciliation.md` | outcome, residue, boundary, validator result | G3 |
| `impl/tools/retired-orchestration-reference-allowlist.json` | exception record shape and existing exact classifications | G2, G7 |
| frozen `SWU-SGRM-001` active-reference manifest | four stale `active-authority` rows and frozen source revision; exact path resolves through the task contract | G3, G5 |
| `impl/tools/audit-retired-orchestration-references.ts` | exception precedence, count/digest validation, manifest immutability | G1-G2, G5 |
| `impl/tools/tests/audit-retired-orchestration-references.test.ts` | clean, seeded-active, digest-drift, missing-path, and unused-exception controls | G6 |
| `definitions/DEFINITIONS-INDEX.md` | one superseded DS-D1.10 registry row | G1, G3 |
| `definitions/DEFINITIONS.md` | two superseded/non-reusable summary matches | G1, G3 |
| `definitions/meta-types/meta-types.md` | seven tombstone and migration-boundary matches | G1, G3 |
| `definitions/meta-types/meta-types.yml` | one superseded machine term | G1, G3 |
| `evidence/authority-source-dispositions.json` | three owner-disposition reasons | G1, G4 |
| `evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md` | twelve decision, rejected-option, and historical-receipt matches | G1, G4 |
| `research/2026-07-15-fpr01-04-cost-estimate/research.md` | two historical guard-repair path matches on one line | G1, G4 |
| `foundation-execution/dispatches/2026-07-16-fpr01-003-remediation.json` | one required source-path handle to the frozen SGRM manifest | G1, G4 |
| `development/research/2026-07-16-language-type-enforcement-proof/research.md` | one non-authority comparison line: stale active-type claim versus current superseded tombstone | G1, G4 |

## Exact Classification Inputs

| Path | Matches | Matched-line digest | Reviewed role |
|---|---:|---|---|
| `projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md` | 1 | `9e1a0febebe05e292f11f663522baf0d8eb6a6e784eec55a1c5c735a66d23a82` | canonical superseded-ID index |
| `projects/domainspec-v2/definitions/DEFINITIONS.md` | 2 | `2bd9b722afd66c9a23617a350a15bbfa5463c12b98a85f5b78dbe24f6e7167c4` | canonical superseded/non-reuse summary |
| `projects/domainspec-v2/definitions/meta-types/meta-types.md` | 7 | `2f5bdde7c3f031f77ef8f46c841edc67819719ac9088c59e1c5709dc96f9c659` | canonical tombstone and misuse boundary |
| `projects/domainspec-v2/definitions/meta-types/meta-types.yml` | 1 | `5293804f621420ff84d52de50bdbca3241398f83d8739b1ef6f37f033acc443d` | machine tombstone term under superseded status |
| `projects/domainspec-v2/development/first-production-release/evidence/authority-source-dispositions.json` | 3 | `9a461112f1179d74ab1dbb38d9083e12ccadf8459efa7a4e50e135e18913de55` | owner disposition evidence |
| `projects/domainspec-v2/development/first-production-release/evidence/FPR01-OWNER-DISPOSITIONS-DECISION.md` | 12 | `23d6b81fae63d5d987082c092ff28eae16ab9ca7c05cc52b4cc4d7abcb5728de` | accepted decision, rejected restoration, and historical provenance |
| `projects/domainspec-v2/research/2026-07-15-fpr01-04-cost-estimate/research.md` | 2 | `a88234b1ad66eb812e359362ab7261df948d04b480f6eab835634938a8b27b51` | non-authority historical cost/replay evidence |
| `projects/domainspec-v2/development/first-production-release/foundation-execution/work-pack/tasks/TASK-FPR01-003-REMEDIATION.md` | 1 | `997031dc6c9beff29df3d908e23051217c3dece2282affe881079a5af9de6513` | current plan source-path reference to the frozen manifest |
| `projects/domainspec-v2/development/first-production-release/foundation-execution/dispatches/2026-07-16-fpr01-003-remediation.json` | 1 | `1f5cbcc61ab06d99448e337afd5a34f3d573e18ebd03224cd0bc0a47076150c2` | current dispatch source-path handle to the frozen manifest |
| `projects/domainspec-v2/development/research/2026-07-16-language-type-enforcement-proof/research.md` | 2 | `d458163b597c07227bf6bb56fbc8b880c6e5246657b6b48f4db9a969acb59c8c` | non-authority drift comparison that rejects the stale active claim |

## Decision Pack

| Option | Consequence | Risk | Decision |
|---|---|---|---|
| Delete or rewrite all seven matches | May make the guard green quickly. | Erases required canonical tombstone semantics and accepted evidence; violates task exclusions. | rejected |
| Add seven content-pinned reviewed exceptions | Preserves required evidence and makes future line/count drift fail closed. | Adds narrow allowlist maintenance for intentional references. | selected |
| Change guard algorithm or frozen manifest | Could encode a new classification model. | Expands scope and rewrites historical evidence. | blocked by task contract |

No human decision is required: the owner receipts and write boundary eliminate the
other options.

## Write Scope

Allowed:

- `projects/domainspec-v2/impl/tools/retired-orchestration-reference-allowlist.json`
- `projects/domainspec-v2/development/first-production-release/foundation-execution/runs/SWU-FPR01003-GUARD-001/`

Everything else is read-only. In particular, do not mutate the frozen manifest,
canonical definitions, guard implementation/tests, sample spec, FPR01-003 receipt,
Craft, roadmap, or production flags.

## Validation Surface

1. JSON parse and exact exception field checks.
2. `npm --prefix projects/domainspec-v2/impl run audit:retired-orchestration`.
3. focused `audit-retired-orchestration-references` test file.
4. `npm --prefix projects/domainspec-v2/impl run typecheck`.
5. manifest SHA-256 remains
   `24ba83d155c96087b8f7cf4afd8bcf64026d7483e6c2f7740fdbbd8f1b2530f9`.
6. scoped diff hygiene.

## Fallback Rule

No further fallback search is authorized. Stop if any live match differs from this refreshed pack, any
reference is active orchestration, the manifest would need mutation, or validation
requires guard/test changes.
