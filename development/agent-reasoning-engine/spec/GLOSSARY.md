# Agent reasoning engine glossary

Status labels in this glossary describe linkage, not promotion.

## Linked CAV2 vocabulary

| Term | Source | Link status | Use here |
|---|---|---|---|
| authority | [`CAV2-D34`](../../../authority/definitions/DEFINITIONS.md#cav2-d34-authority) | linked | Scoped right/responsibility that lets a source, rule, decision, or effect count. |
| provenance | [`CAV2-D35`](../../../authority/definitions/DEFINITIONS.md#cav2-d35-provenance) | linked | Typed origin and transformation chain for inputs, rules, judgments, and receipts. |
| traceability | [`CAV2-D36`](../../../authority/definitions/DEFINITIONS.md#cav2-d36-traceability) | linked | Navigable path from intent to evidence, judgment, effect gate, residue, and revision. |
| gate | [`CAV2-D37`](../../../authority/definitions/DEFINITIONS.md#cav2-d37-gate) | linked | Recorded `pass/flag/block/defer` transition with owner, evidence, residue, and effect. |
| claim <= proof | [`CAV2-D38`](../../../authority/definitions/DEFINITIONS.md#cav2-d38-claim-proof-bound) | linked | Bound preventing outcome or readiness claims from exceeding their witness. |
| intent | [`CAV2-D39`](../../../authority/definitions/DEFINITIONS.md#cav2-d39-intent) | linked | Attributable, bounded, revisable orientation that cannot be silently replaced. |
| challenge contract | [`CAV2-D40`](../../../authority/definitions/DEFINITIONS.md#cav2-d40-challenge-contract) | linked | Valid objection modes, closure route, owner review, and challenge residue. |
| authority model | [`CAV2-D41`](../../../authority/definitions/DEFINITIONS.md#cav2-d41-authority-model) | linked | Owner and non-collapse routing that prevents evidence/model output from becoming authority. |
| schema | [`CAV2-D56`](../../../authority/definitions/DEFINITIONS.md#cav2-d56-schema) | linked | Admissible structure whose conformance is shape evidence only. |

## Local candidate handles

| Term | Status | Meaning and boundary |
|---|---|---|
| agent reasoning engine | candidate, unwitnessed | The whole pre-action boundary described by the spec. The repository may not claim this label yet. |
| intent record | selected-local candidate | Machine projection of D39 semantic fields with whole-field posture, raw expression preservation, accountable source attribution, and explicit-or-unresolved revision routing; not a command, requirement, or canonical schema. |
| capture provenance | selected-local record mechanic | Technical path or handle locating the raw expression; it cannot impersonate the semantic expresser or accountable authority. |
| semantic source attribution | selected-local capture rule | The expresser and accountable authority supported by the source; absent support yields `unresolved`, not a value inferred from the file path. |
| authority snapshot | candidate | Frozen owner, scope, status, version, expiry, and revocation state; not authority creation. |
| problem frame | candidate | Bounded question, candidates, evidence handles, boundary criteria, constraints, and effects; it holds no facts and is not scope approval or accepted truth. |
| rule catalog manifest | candidate | Versioned rule/evaluator membership and policy metadata; membership is not self-authorization. |
| applicability decision | candidate | Reproducible record of which obligations/rules apply and why; not the semantic outcome. |
| observation set | candidate | Provenance-bearing proposed facts with issuer/validator posture; not automatically admissible evidence. |
| technique plan | candidate | Selected Technique Catalog operations, roles, joins, and stopping conditions; not proof. |
| effort profile | candidate | Policy-derived tier, budgets, required lanes, stop/escalation rules; not confidence. |
| semantic-judgment evaluator@1 | **UNWITNESSED CANDIDATE** | Deterministic finite reducer that returns one typed outcome and can abstain; it cannot authorize effects. |
| reasoning receipt | candidate | Digest-bound derivation/support/challenge/residue record; not proof, approval, promotion, or permission. |
| runtime journal | candidate | Replayable actor/effect protocol history; replay is not current-state revalidation. |
| gate decision | local record of linked D37 term | One complete entry or exact-effect gate record; the two decisions never collapse. |
| historical replay | candidate operation | Reduction of retained immutable facts with no new model/tool/effect calls. |
| current revalidation | candidate operation | Fresh computation against current authority, catalog, evidence, and time state. |

## Rejected or deferred handles

| Term | Status | Reason |
|---|---|---|
| AntiBiasVector | excluded from first witness | No governed dimensions, intervention semantics, aggregation rule, or efficacy evidence exists. |
| ReasoningLane | omitted pending evidence | Actor roles, technique requirements, and challenge contracts may already carry the distinction. |
| MayAct | unresolved | Keep it an internal exact-effect criterion unless an owner admits a fully conformant D37 gate. |
| consensus confidence | prohibited | Agreement and agent count do not supply truth, evidence, or authority. |
| revision-history item schema | deferred pending evidence | Run 02 contained no accepted semantic revision, so no item granularity was selected. |

## Stable outcome vocabulary

- `InvalidInput`: the bounded request or required record shape is unusable.
- `UnauthorizedCatalog`: the catalog/evaluator does not have admissible authority posture.
- `OutOfDomain`: no registered conclusion/rule covers the frame.
- `Ineligible.Defeated`: a grounded, applicable defeater prevents recommendation.
- `Deferred.Insufficient`: required facts or challenge closure are absent.
- `EscalateOwner`: the responsible owner must decide an unresolved authority or policy question.
- `RecommendedUnderSnapshot`: the conclusion follows under captured inputs; recommendation only.
- `Invalidated`: an earlier result no longer survives applicable drift or late defeat.

## Glossary consistency rule

The local handles may be renamed or rejected without changing CAV2 vocabulary.
They may not receive CAV2 IDs, redefine linked terms, or enter public Arcanum from
this authoring package.
