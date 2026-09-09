# Definitions refactor — findings

Date: 2026-07-13  
Status: verified review; zig-zag completed 3/3; final approver ACCEPT; owner approval required before canonical mutation

## Classification semantics

- `KEEP`: current definition is substantially sound; editorial repair may remove misleading notation.
- `FIX`: current card cannot remain as written. Required action is exactly one of `REWRITE`, `REFERENCE`, `SPECIALIZE`, `LOCALIZE`, `DEFER`, or `RETIRE`.
- Enforcement: `D` documentary/model only; `R` owner/review; `M` deterministic/machine on at least one owned surface; `N` none demonstrated.
- Conformance is reported separately from enforcement. `none` may mean a forward-looking rule, not a nonexistent referent.

`LOCALIZE` is complete only when a transfer contract declares all of:

| Contract field | Requirement |
|---|---|
| `target_path` | Exact repository path that will carry the rule. |
| `target_owner` | Owner route authorized to maintain and decide the local meaning. |
| `target_authority_status` | Existing normative authority, or an explicit promotion gate that makes it normative before transfer. Candidate narrative status is insufficient. |
| `consumers_and_migration` | Every incoming consumer plus remove/repoint/rewrite action and validation. |
| `residual_reference_or_rule` | What, if anything, remains centrally discoverable without redefining the local term. |
| `no_authority_gap` | Evidence that no consumer loses its governing rule during transfer. |

Without this complete contract, the action must be `DEFER` or `REWRITE`; a folder or owner label alone is not localization.

## Complete D1–D56 decision matrix

| ID | Referent | Rule need / owner | Definition quality | Adoption | Enforcement | Observed conformance | Verdict | Action |
|---|---|---|---|---|---|---|---|---|
| D1 | real target | shared criterion possible | no satisfaction boundary | mixed | D/R | partial/unknown | FIX | REWRITE |
| D2 | real import practice | import/discipline owner | contrast-defined umbrella | local | D/R | partial | FIX | DEFER |
| D3 | real authority surfaces | D34/model owner | circular with authority | mixed | R | partial | FIX | REWRITE |
| D4 | real source map | source-map owner | relative selector terms | local/candidate | D | n/a | FIX | DEFER |
| D5 | real promotion gates | specialize D37 | route/gate/decision collapse | adopted locally | R | partial | FIX | SPECIALIZE |
| D6 | real practice | Arcanum discipline/D50 | duplicates discipline genus | local | D/R | partial | FIX | REFERENCE |
| D7 | real import records | import contract | act/record/ledger mixed | local | D/R | partial | FIX | DEFER |
| D8 | real candidate rows | import schema | candidate narrowed to path | local | D/R | partial | FIX | DEFER |
| D9 | real project | README owner | identity/aspiration, not rule | descriptive | N | n/a | FIX | RETIRE |
| D10 | real routing context | definitions method | no identity test | local | D | partial | FIX | DEFER |
| D11 | intelligible tower-map term | candidate tower-map owner | nearly universal container | candidate/local | D | local documentary use | FIX | DEFER |
| D12 | real Craft surfaces | Craft/Arcanum | duplicates owned bundle | adopted externally | R/M local | observed locally | FIX | REFERENCE |
| D13 | real candidate work | promotion owner | no queue order/operations | local | D/R | partial | FIX | DEFER |
| D14 | real routing distinction | source model | source/evidence ambiguous | local | D | partial | FIX | DEFER |
| D15 | real project folders | project-space contract | weakly discriminating list | local | D | observed locally | FIX | DEFER |
| D16 | real typed relations | relation owners | identity/metadata fused | mixed | M local; R general | partial | FIX | SPECIALIZE |
| D17 | research referent | research/Craft | undefined altitude/closure | candidate | D | none uniform | FIX | DEFER |
| D18 | real residue records | shared minimum | essence/record overbundled | active/mixed | R; some M | partial | FIX | REWRITE |
| D19 | real ontology package | ontology owner/shared boundary | governance package as essence | candidate/local | D/R | partial | FIX | REWRITE |
| D20 | real Craft method | Craft/Arcanum | local ledger mixed with genus | adopted externally | R/M local | observed locally | FIX | REFERENCE |
| D21 | proposed action rule | constitution if adopted | tautological residue escape | candidate | D/N | none general | FIX | DEFER |
| D22 | real redundancy problem | shared classifier or owner-gated constitution absorption | incompatible math registers | normatively consumed | R | partial | FIX | REWRITE |
| D23 | real lifecycle fields | shared record possible | six dimensions called one axis | documentary | D/R | partial/drifting | FIX | REWRITE |
| D24 | real navigation practice | Vault/navigation owner not yet transferred | procedural, not lexical | normatively consumed | R | partial | FIX | DEFER |
| D25 | real amendment need | constitution/schema owner | missing witness counts as witness | candidate | R precedent | no uniform | FIX | DEFER |
| D26 | real ledgers/events | ledger owners/shared pattern | useful fold mixed with record | local | M local | observed locally | FIX | REWRITE |
| D27 | real formal measures | formal/research owners | incompatible entropy scopes | local | M narrow | narrow only | FIX | DEFER |
| D28 | real edge-risk proposal | relation/constitution owner | operands/stopping underdefined | candidate | R candidate | not demonstrated | FIX | DEFER |
| D29 | real non-implication rule | governance models | “orthogonal” overclaims | review-used | R | partial | FIX | REWRITE |
| D30 | real recursion practice | shared stopping rule; local process details | no altitude/order/stop semantics | cross-owner use | R | partial | FIX | REWRITE |
| D31 | candidate basis-organizing term | owner gate unresolved | absolute/circular metadata primitive | candidate/self-organizing | D | no independent consequence shown | FIX | DEFER |
| D32 | real methods | Arcanum genus | arbitrary checklist | externally owned | D/R | n/a | FIX | REFERENCE |
| D33 | real definition cards | definitions-governance | essence/card schema conflated | mixed | R/M partial | partial | FIX | REWRITE |
| D34 | real authority claims | central CAV2 | untyped/inconsistent tuple | active/mixed | R | partial | FIX | REWRITE |
| D35 | real provenance chains | shared minimum | resolvability/types incomplete | active/mixed | R/M partial | partial | FIX | REWRITE |
| D36 | real trace queries | shared/local contract | circular “enough links” | mixed | R | partial | FIX | REWRITE |
| D37 | real gates | shared verdict/transition core | categories collapsed | mixed | R/M local | partial | FIX | REWRITE |
| D38 | real epistemic norm | shared CAV2 | prose coherent; equation mnemonic only | active/review-used | R | observed | KEEP | n/a |
| D39 | real intent records | Invoke/DomainSpec/Arcanum | tuple not used shape | externally/local owned | R local | observed locally | FIX | REFERENCE |
| D40 | real challenge protocols | shared minimum | fields/types/effect incomplete | active/mixed | D/R; shape M | divergent | FIX | REWRITE |
| D41 | real cross-surface model role | central definition derived from AUTHORITY-MODEL | checklist duplicates model | active/local | R | observed in model | FIX | REWRITE |
| D42 | real transversal admission/tree interface | shared minimum; local schemas specialize | load-bearing undefined | candidate/cross-consumed | D/R | none admitted | FIX | REWRITE |
| D43 | real architecture route | candidate architecture target lacks transfer contract | lifecycle over-fixed | local/candidate | D/R | partial | FIX | DEFER |
| D44 | real views | architecture/ontology owner | circular threshold | candidate | D | not shown | FIX | DEFER |
| D45 | real UX governance | candidate UX target lacks transfer contract | lane bundle, not genus | local/candidate | D/R | partial | FIX | DEFER |
| D46 | real UX evidence route | candidate UX target lacks transfer contract | over-fixed lifecycle | local/candidate | R | partial | FIX | DEFER |
| D47 | real evidence boundaries | UX/C15 migration unresolved | mixes evidence/effect/automation | local/cross-consumed | R/M local | partial | FIX | DEFER |
| D48 | real promotion routes | shared lifecycle possible | single-path/posture overclaim | review-used | R | heterogeneous | FIX | REWRITE |
| D49 | real default-deny rule | authority model | enactment/posture contradiction | active/review-enacted | R; M pending | observed review mode | FIX | REWRITE |
| D50 | real disciplines | Arcanum genus | locally reauthors public term | adopted externally/local instances | R | observed | FIX | REFERENCE |
| D51 | real artifact-kind design | owner gate/catalog unresolved | name collision; identity contradicted | candidate/forward | D/R candidate | zero corpus instances | FIX | REWRITE |
| D52 | real durability field | D51/catalog/admission owner | completeness/contradiction inference unproved | candidate | D/R candidate | no admitted instances | FIX | DEFER |
| D53 | real axiom corpora | owner-specific/shared boundary | truth/fan-out/world-only overclaim | mixed | R local | partial | FIX | REWRITE |
| D54 | real invariants | owner-specific/shared core | constitutive chain false; stale ref | mixed | R/M local | partial | FIX | REWRITE |
| D55 | real premise corpora | owner decision pending | fixed truth/conviction/promotion overclaim | weak/candidate | D/N | weak | FIX | DEFER |
| D56 | real schemas | Arcanum owns genus | universal model false | ID conflicted | M externally/local | abundant external/local | FIX | REFERENCE |

## Surviving findings

| Finding | Severity | File/line evidence | Evidence | Proposed correction |
|---|---|---|---|---|
| F-01 Canonical posture is contradictory | CRITICAL | `authority/definitions/DEFINITIONS.md:3908-3914`; `DEFINITIONS-INDEX.md:27-32`; `DEFINITION-DRIFT-AUDIT.md:415-435` | Source presents D56 and the 56-card corpus as active while index/audit recognize six active cards and reserve retired IDs. | Owner-gated selection of the actual canonical source; synchronize source, index, audit, and archive before claiming adoption. |
| F-02 Definition schema registry cannot witness current cards | CRITICAL | `authority/definitions/DEFINITION-SCHEMAS.md:42-43,65,68` | Documentary registry tracks only D23/D51 and assigns obsolete meanings to D34/D37. | Quarantine/archive registry; rebuild only after surviving record shapes and IDs are approved. |
| F-03 Gate vocabulary has two owners | MAJOR | `DEFINITIONS.md:185-215,2364-2411`; `authority/AUTHORITY-MODEL.md:137-142` | D5 omits `defer`; D37/model include it; gate, route, decision maker, record, and effect are collapsed. | Make D37 own shared verdict/transition semantics; D5 becomes a promotion specialization referencing it. |
| F-04 Authority tuple overstates validity | CRITICAL | `DEFINITIONS.md:2180-2200` | D34 names eight fields, then requires only five; fields lack types and `surface`/`challenge_route` have no stable independent semantics. | Separate Authority essence from an `authority_claim` record; type required/optional fields and conformance. |
| F-05 Challenge consumers do not conform uniformly | MAJOR | `ontology/NODE-MODEL.md:25-59`; `validation/artifact-admission/admission-record.schema.json:473-518`; `validation/artifact-admission/README.md:3` | Node model carries structure; admission accepts textual fields; validator is not implemented. Referent exists, enforcement/conformance remain partial. | Define minimum structured D40 contract plus explicit documentary/review/machine posture; migrate consumers behind owner gate. |
| F-06 Claim-proof rule survives but equation does not | MINOR | `DEFINITIONS.md:2428-2460`; `authority/decisions/2026-07-13-canonical-kind-one-label.md:73-102` | Review practice bounds claims to proof; no order/measure defines the normative inequality. | KEEP prose norm; label `claim <= proof` mnemonic or define a support order before formal use. |
| F-07 D49 enactment is review-mode, not completed deterministic closure | MAJOR | `authority/AUTHORITY-MODEL.md:44-69`; `DEFINITIONS.md:3247-3304`; `DEFINITION-DRIFT-AUDIT.md:155-161` | Default-deny row is review-enacted; deterministic C16 path remains pending/blocked; card posture is contradictory. | Rewrite rule and adoption/enforcement sections separately; preserve default-deny predicate without overclaim. |
| F-08 D51 referent survives but current identity fails | CRITICAL | `ontology/canonical-kinds/CANONICAL-KINDS.md:41-75,85-116`; `DEFINITIONS.md:3378-3516`; `arcanum/definitions/DEFINITIONS.md:340-378` | Catalog is candidate, corpus has no `canonical_kind`, producers are absent/multiple, `process_origin` is undefined, and “canonical artifact” already means authoritative source in Arcanum. | Preserve concept; provisional rename and rewrite membership/conformance/provenance/authority separately. Remove `process_origin` from identity. Final name and membership remain owner-gated. Execute a governed cutover: **(1)** inventory every D51 occurrence, classify it as `live normative`, `live operational`, `generated/index`, `candidate`, or `historical evidence`, and prepare patches without applying them; **(2)** obtain owner approval for the replacement identity, name, and ID; **(3)** establish the replacement definition and `supersedes`/`superseded_by` relation, or a temporary alias/reference, so D51 remains resolvable throughout cutover; **(4)** repoint live normative and live operational consumers—including C18/`STABLE-REPOSITORY-CONSTITUTION.md`, artifact-admission README/schema, validator work-pack/planning, and `CANONICAL-KINDS.md`—then regenerate index/generated surfaces such as the index/schema registry where applicable and validate all migrated dependencies; **(5)** retire or remove the old live meaning only after the dependency audit reports zero unresolved live incoming dependencies. Preserve candidate material according to its owner disposition. Preserve historical and append-only evidence verbatim; add only a repository-permitted supersession/lookup note or append-only event. Do not include `AUTHORITY-MODEL.md` unless a future scan finds a literal D51 dependency. |
| F-09 D52 is not ready independently of D51 | MAJOR | `ontology/canonical-kinds/CANONICAL-KINDS.md:41-47,102-116`; `DEFINITIONS.md:3526-3598`; `validation/artifact-admission/README.md:3,44-47` | Enum is modeled, but completeness and contradiction policy are not established; admission is candidate/unimplemented. | Defer central card; keep durability field locally until D51 membership and owner semantics settle. |
| F-10 Axiom/invariant cards contain a wrong dependency | CRITICAL | `DEFINITIONS.md:3669-3674,3724-3776` | D53/D54 identify D34 Authority as Constitution and make grounding/enforcement relations constitutive. | Correct references; rewrite essence independently from optional grounding, constitution, and validator links. |
| F-11 Schema is a real, enforced referent owned generically by Arcanum | CRITICAL | `arcanum/definitions/DEFINITIONS.md:77-105`; `projects/domainspec-v2/impl/spec/meta-types/structural/entity.md:15-16`; `projects/domainspec-v2/impl/governance/tags/CODE-TAG-SCHEMA.md:49-50`; `DEFINITIONS.md:3908-3958` | Machine schemas and validators exist, but CAV2 reauthors the genus and falsely universalizes `(K,C,R,N)` and inspection-only conformance. | Reference `DEF-ARC-SCHEMA`; if owner-approved, add a separately named CAV2 specialization for subject/applicability/conformance and non-collapse with authority. |
| F-12 D56 ID integrity is independent of Schema semantics | CRITICAL | `DEFINITION-DRIFT-AUDIT.md:359-406,458-462`; `DEFINITIONS-INDEX.md:27-32` | D56 historically named retracted `process`, was reserved, then reused for Schema. Semantic need does not authorize stable-ID reuse. | Keep D56 reserved unless an explicit owner gate reverses reservation; allocate a new ID for any specialization. |
| F-13 Lack of implementation was repeatedly confused with nonexistence | MAJOR | `validation/artifact-admission/README.md:3,44-51`; `admission-record.schema.json:298-396` | Candidate schema proves modeled referents but not deterministic enforcement or corpus conformance. | Every card must declare definition, adoption, enforcement, and observed conformance separately. |
| F-14 Formal notation often adds no decision power | MAJOR | `DEFINITION-SCHEMAS.md:15,42-50`; examples in `DEFINITIONS.md:2190-2200,3940-3958` | Documentary tuples omit types/cardinality/identity or contradict consumers; notation is mistaken for formalization. | Admit notation only for typed predicates, enums, relations, record shapes, or transitions that support reproducible review/classification. |
| F-15 Generic Arcanum concepts are locally reauthored | MAJOR | `arcanum/definitions/DEFINITIONS.md:77-105,340-378`; CAV2 D12/D20/D32/D50/D56 cards | Local use does not transfer generic semantic ownership. | Distinguish: **reference entry** = external canonical ID/link + dependency reason, no new CAV2 semantic ID; **specialization** = non-redundant normative local rule with distinct term, owner, and new stable ID; **example** = explicitly non-normative illustration, never a specialization. D56 becomes a reference; any CAV2 schema specialization remains DEFER and cannot reuse D56. |

## Owner-gated decisions

1. **D51 name and admission:** choose a non-colliding provisional name (for example, `recognized artifact-kind instance`), decide catalog owner, decide whether registered kind is sufficient or conformance is also required, and keep the current candidate catalog explicitly non-closed.
2. **D56 specialization and ID:** D56 is now a `REFERENCE` decision to `DEF-ARC-SCHEMA`. Decide separately whether CAV2 needs a non-redundant specialization; until approved it is `DEFER`, and any admitted specialization requires a new term/new ID. Adjudicate D56 reservation independently.
3. **D28:** define `value`, cycle scope, and obstruction outcome before promoting the useful boolean guard; otherwise keep it local/candidate.
4. **D49:** approve exact adoption vocabulary for a review-enforced invariant versus a deterministic rule.
5. **D11/D31:** decide whether candidate self-organizing use warrants a narrowed D11 tower-role definition or scope-relative D31 primitive-type definition. Popper supports retirement with acknowledged local use; Quine supports preservation. Both remain `DEFER` pending owner evidence.
6. **Canonical source:** resolve the live 56-card source versus six-card index/audit conflict before any further promotion or synchronization.

## Summary

- `KEEP`: 1 (`D38`, with editorial demotion of the inequality to mnemonic status)
- `FIX`: 55 — `REWRITE` 22, `REFERENCE` 7, `SPECIALIZE` 2, `DEFER` 23, `RETIRE` 1, `LOCALIZE` 0
- D51: concept preserved; `REWRITE`; final name and membership remain open/owner-gated.
- D56: Schema referent preserved; `REFERENCE` to Arcanum ownership; any local specialization is separately `DEFER` with a new ID; ID integrity handled separately.
- Canonical target mutated: no.

## Dispatch closure

- `exit_reason`: `resolved`
- Final approver: `Bourbaki, Nicolas` — `ACCEPT`
- `agents_spawned`: 7 logical agents (`explorer`: 3, `writer`: 1, `skeptic`: 2, `auditor`: 1, `helpers`: 0)
- `loops_used`: 3 zig-zag rounds
- Execution note: the logical Tarski role reused an already-available completed agent thread because the runtime thread ceiling prevented a third fresh attacker thread; its registered role, lens, briefing, independent report, and robot-talks return were preserved.
- Canonical definitions mutated by the dispatch: no.
