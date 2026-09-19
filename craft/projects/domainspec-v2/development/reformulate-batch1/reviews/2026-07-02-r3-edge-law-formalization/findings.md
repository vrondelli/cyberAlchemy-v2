---
node_type: review-findings
is_session: true
status: complete
dispatch_id: 2026-07-02-r3-edge-law-formalization-review
dispatch_type: review
target: R3 edge-law formalization
created: 2026-07-02
exit_reason: resolved
exit_recommendation: accept
---

# R3 Edge-Law Formalization Review - Findings

## Verdict

R3 is the correct route for formalizing edges and relationships. The current development surface is close
enough to proceed, but four MAJOR change requests should be resolved before R3 is treated as formalized.

## Surviving Findings

| id | severity | evidence | finding | proposed fix | R3 formalization impact |
| --- | --- | --- | --- | --- | --- |
| R3-F1 | MAJOR | `impl/spec/RELATIONSHIPS.md:11-51`; `impl/tools/validate-relationships.ts:58-109`; `impl/tools/validate-relationships.ts:141-156`; `definitions/DEFINITIONS.md:184-185`; `impl/governance/tags/tools/lib/code-tag-rules.ts:67-116`; `impl/governance/tags/tools/validate-code-tags.ts:396-402` | The default R3 relationship/content validation path lacks machine-enforceable endpoint signatures. `validate-relationships` checks canonical labels, while DS-D8 follows after R3. There is code-tag endpoint-parser precedent, but it is not currently the R3 validation gate. | Promote an authoritative finite edge-signature relation, or make `RELATIONSHIPS.md` a strictly parsed authority table. Make `validate:rels` join graph rows through Concept Registry types and reject any `(verb, source_type, target_type)` absent from the allowed relation or present in forbidden overrides. Reuse the code-tag parser where appropriate. | R3 cannot be a formal edge-law surface if the default check proves only edge-label membership. |
| R3-F2 | MAJOR | `development/reformulate-batch1/DESIGN.md:91-107`; `development/reformulate-batch1/WORK-PACK.md:69-72`; `.craft/ledger.yml:310-315`; `definitions/DEFINITIONS.md:104-106`; `impl/spec/RELATIONSHIPS.md:17`; `impl/spec/RELATIONSHIPS.md:23`; `impl/spec/RELATIONSHIPS.md:26` | R3 acceptance is stale against `DEC-DSV2-EDGE-ADMISSIBILITY`. The plan still expects `>29` / additive edge growth, while the accepted rulings require collapse/widen/reject/property decisions. | Replace count-led R3 acceptance with decision-led reconciliation: collapse or deprecate `enforces-cross` as a separate verb and encode cross-feature as metadata on `enforces`; widen `applies` to `Policy -> {Operation, Calculation}`; reconcile `queries` as the accepted `Behavioral -> Entity` source widening or revise the decision; decide whether `Operation -> ValueObject` returns is a new verb or a signature/property; then restate the exact canonical edge count after reconciliation. | Prevents a correct decision-led R3 implementation from failing stale `>29` acceptance, and prevents an edge-inflating implementation from passing. |
| R3-F3 | MAJOR | `development/reformulate-batch1/WORK-PACK.md:71-73`; `development/reformulate-batch1/DESIGN.md:155-158`; `impl/spec/features/sample/SPEC.md:7`; `impl/tools/tests/validate-content.test.ts:143`; verified `validate:rels` PASS at `canonicalEdges=29`; verified `validate:content` PASS with `0 concept(s)`; AEO fixture lines `SPEC.md:96`, `SPEC.md:99`, `SPEC.md:121`, `SPEC.md:126`, `SPEC.md:148`, `SPEC.md:150` | Forbidden/unconstructible closure is not derivable or tested. Wrong-endpoint canonical labels can pass today; the AEO fixture contains `Operation --enforces--> Value Object` and `State Machine --enforces--> Operation`, and `validate:rels` still passes because the label is canonical. | Add a closed-world endpoint rule: a declared edge is admissible iff its `(verb, source_type, target_type)` is explicitly allowed. Emit an `unconstructible-edge` violation otherwise. Add negative fixtures for reversed endpoints and wrong endpoint types, including `Operation --enforces--> Value Object`, `State Machine --enforces--> Operation`, and at least one wrong-target `queries` case. | Makes C6 "unconstructible" behavior discriminating instead of prose-only. |
| R3-F4 | MAJOR | `development/meta-type-definitions/DEFINE.md:61-66`; `development/meta-type-definitions/DESIGN.md:43-46`; `development/meta-type-definitions/WORK-PACK.md:24`; `development/reformulate-batch1/WORK-PACK.md:46`; `development/reformulate-batch1/WORK-PACK.md:104`; `development/meta-type-definitions/CANDIDATES.md:67`; `definitions/DEFINITIONS.md:184-185`; `impl/spec/meta-types/behavioral/operation.schema.yml:21-23` | Definition and promotion ownership has stale routing and alias drift at the R3 boundary. DD-D3 already resolves DS-D1 to root `definitions/`, but some work-pack text still routes through `impl/spec/DEFINITIONS.md`; `DS-D8` and `domainspec-v2-D9` are not role-clean; current `edge_participation` slices are not reliable authority. | Treat root `definitions/` and `DEFINITIONS-INDEX.md` as the only canonical read model for DS-D1/DS-D2/DS-D8. Keep `.schema.yml` criteria and edge-participation slices in `impl/spec` as machine evidence, not definition authority. Replace stale `impl/spec/DEFINITIONS.md` routing, and state whether edge-participation signature is `DS-D8`, `domainspec-v2-D9`, or one canonical term with an explicit alias. Approve DS-D2/DS-D8 only after R3 edge reconciliation. | Keeps post-R3 edge verbs/signatures auditable and prevents schema/read-model/definition drift. |

## Per-Artifact Verdicts

| artifact | verdict | note |
| --- | --- | --- |
| `.craft/ledger.yml` `DEC-DSV2-EDGE-ADMISSIBILITY` | KEEP | Governing decision is usable. |
| `definitions/DEFINITIONS.md` edge-law card | KEEP | Its rulings drive R3 reconciliation. |
| `definitions/DEFINITIONS.md` DS-D2/DS-D8 status note | KEEP WITH FOLLOW-UP | Correctly defers edge verbs/signatures until R3. |
| `definitions/meta-types/meta-types.{md,yml}` | KEEP | DS-D1 read models only; not edge authority. |
| `development/reformulate-batch1/DESIGN.md` | FIX | Replace count-led/additive R3 acceptance and close D4 form. |
| `development/reformulate-batch1/WORK-PACK.md` | FIX | Same acceptance drift plus stale R7 write-scope detail. |
| `development/meta-type-formalization/DEFINE.md` | KEEP | Boundary is still valid. |
| `development/meta-type-formalization/DESIGN.md` | FIX | Update stale edge examples after R3 reconciliation. |
| `development/meta-type-formalization/WORK-PACK.md` | FIX | Replace "29 signatures" with R3-resolved DS-D2/DS-D8 set. |
| `development/meta-type-definitions/DEFINE.md` | KEEP | DD-D3 root-home resolution is useful. |
| `development/meta-type-definitions/DESIGN.md` | KEEP | Root definition routing is useful. |
| `development/meta-type-definitions/WORK-PACK.md` | FIX | Remove stale `impl/spec/DEFINITIONS.md` routing. |
| `development/meta-type-definitions/CANDIDATES.md` | FIX | Clarify DS-D8 vs `domainspec-v2-D9`. |
| `impl/spec/RELATIONSHIPS.md` | FIX | Reconcile accepted edge-law rulings and expose formal signatures. |
| `impl/tools/validate-relationships.ts` | FIX | Add endpoint/signature checks, not label-only checks. |
| `impl/tools/validate-content.ts` | FIX | Add or delegate edge-signature validation when R3/MT4 lands. |
| `impl/spec/features/sample/SPEC.md` | FIX OR SUPPLEMENT | Needs discriminating relation fixture; current sample is vacuous for R3. |
| `impl/tools/tests/*` | FIX | Add bad-endpoint and valid-edge fixtures. |
| `impl/package.json` validation aggregate | FIX WHEN READY | Wire endpoint/content validation into the aggregate gate once stable. |

## Closeout Recommendation

Accept this review as resolved. The next work should be an R3 implementation/refinement package that first
chooses the authoritative signature surface and reconciles the accepted edge-law decisions before mutating
`RELATIONSHIPS.md` or validators.

## Final Approver

`Vlachopulos, Ioannis` audited this `findings.md` file only and returned ACCEPT with no required revisions.
The approver confirmed that the four surviving findings are cited, evidence-bounded, severity-calibrated as
MAJOR, and scoped to R3 edge/signature/relationship formalization.

Agents spawned for the dispatch: total 7 (`explorer`: 3, `writer`: 1, `skeptic`: 2, `auditor`: 1,
`helpers`: 0). Loops used: 1. Exit reason: `resolved`.
