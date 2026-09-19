# Strict Runtime Context Pack

## Identity and result

- Task: `INVOKE-DESIGN-DSV2-SPEC-ONTOLOGY-HARDENING-001`.
- Run: `20260823T200038Z-spec-ontology-contract-hardening`.
- Mode: `deep-strict`, runtime handoff, session evidence only.
- Selected files: 18.
- Obligations: 12 of 12 covered.
- Strict coverage: `pass`.
- Input digest: `24d86d286ca687503f580aef368f803b97a50aebc1cebc4a98099fb227f6faad`.
- Authority effect: `none`.

## Task-ready synthesis

The prior Design already chose the semantic architecture: one connected
logical ontology with four separately owned catalogs, exact cross-branch
relations, owner-local validation, and non-authoritative projections. This run
must not reopen or apply that architecture. It must make its protected admission
contract exact.

The latest direct Design intent supersedes the earlier live authority-model
proposal: Rondelli is proposed for every primary owner role, but each role keeps
its own meaning, scope, response, and ceiling. Rondelli and Victor Boscaro are
different principals; Victor and Boscaro are two names for Rondelli's partner.
Victor is proposed only as independent structural verifier. He checks identity,
current role, exact bytes, scope/non-scope, currentness/supersession, and claim
ceilings. He may block structurally inadmissible evidence and may not accept or
reject semantics.

Rondelli assigns the level for each exact package. Non-protected drafts may use
V0 with no admission effect. Ordinary OAR-02–06 and OAR-10 have a V1 minimum,
under a future checker governed by exact Victor-owned policy. High-impact
OAR-01, OAR-07–09, and OAR-11 have a V2 minimum requiring Victor directly.
V3 is unavailable until a separate external L2 gate. Rondelli may raise but not
lower the applicable floor. Any post-freeze bound change creates a superseding
package and restarts owner response and verification.

## Obligations and evidence selectors

| Obligation | Evidence selectors | Resolution |
| --- | --- | --- |
| Preserve architecture | prior `ARCHITECTURE.md#architecture-intent`; `CANDIDATE-CONTRACTS.json#/logical_model` | unchanged four-branch design |
| L1 posture | owner-auth decision `/accepted_posture`; authority model D49 | exact repository-local role evidence only |
| Primary topology | ownership correction `/primary_owner_topology`; D27 | sixteen separate Rondelli role assignments |
| Principal identity | Victor identity `/normalized_principal`; formal-claim principal | two distinct principals |
| Verifier boundary | second-approval decision `/selected_topology/independent_structural_verifier` | structural checks/block only |
| Owner level assignment | level correction `/assignment_rule` | one level per exact package |
| Non-bypassable floors | floor decision `/selected_policy` | V1/V2 map, raise-only, V3 unavailable |
| Exact schemas | prior auth contract; structural envelope schema | seven closed candidate schemas |
| Planned witnesses | prior negative corpus; floor blockers | hardening negatives plus retained twelve classes |
| Fixed selection | prior selection; dispatch step s4 | closed manifest, denominator, identical two passes |
| Exact requests | prior OAR matrix; Victor pending status | pending Rondelli and Victor artifacts only |
| Boundaries | dispatch guardrails; constitution C2–C4 | no authority, Plan, execution, migration, promotion, publication, Git, or external effect |

## Authority and non-goals

DomainSpec v2 authority and constitution outrank user-selected candidate intent;
latest decisions outrank superseded live proposals while preserving historical
bytes. Prior Design is an input, not renewed owner acceptance. CAV2 relation and
address contracts are structural precedent only. This candidate and every
generated artifact have `authority_effect: none`.

Do not read or write beyond the dispatch-bound surfaces. Do not authenticate a
principal, admit a role, record a response, issue V1/V2 receipts, implement or
execute the V1 checker, plan work, migrate, promote, publish, or use Git.

## Gaps and next bounded action

- Rondelli exact protected owner responses: pending.
- Victor direct authentication and verifier-role/policy/receipt acceptance: pending.
- V1 checker implementation and execution: future Plan evidence, pending.
- V2 direct receipts: pending.

The immediate bounded action is Design candidate authoring and local structural
validation, followed by parent Balancer review. No protected request is sent by
this helper.
