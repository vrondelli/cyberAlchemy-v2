# Contract-completeness gap audit — attack record

Dispatch: `2026-07-20-evf-contract-completeness-gap-audit`
Type: review
Status: candidate synthesis awaiting verifier review
Working boundary: read-only over attacked targets; this file is review evidence, not source authority.

## Snapshot caveat

The prior implementation-completion manifest is not a valid frozen corpus for this audit. Its SHA-256 is `0c69f18a7c704ff67c08902b90534849130922bf54c9b183f6c96477330bd7b4`; 61 paths are listed, but only 56 live digests still match. The five drifted targets are EVF `DESIGN.md`, `IMPLEMENTATION-LAYERING.md`, `PLAN.md`, `WORK-PACK.md`, and BTE `WORK-PACK.md`. It also omits several machine denominators required by this audit. Findings below therefore cite a new live denominator snapshot recorded in `gap-matrix.json`; they do not reuse the old manifest as a completeness authority.

The live denominator reproduced by the attackers and synthesizer is:

- `D_kind = 13` backend schema kinds;
- `D_form = 16` formation criteria;
- `D_rel_family = 16` selected backend relationship names;
- `D_rel_pair = 21` expanded typed endpoint pairs;
- `D_rel_scope = 29` endpoint-pair plus admitted-scope variants;
- node-effect, removal, provenance, and negative sets are not yet machine-defined and therefore have no honest cardinality.

## ASHBY — computational mechanics

### ASHBY INITIAL

The initial return reported two critical and six major findings:

1. `ASHBY-CCG-001` (CRITICAL): the 61-path frozen manifest is stale at five paths. Repair by refreezing after the intended live corpus is stable.
2. `ASHBY-CCG-002` (CRITICAL): the plan's scalar `O_spec = 16` cannot denote the whole selected causal proof contract because it counts only formation criteria while relation binding/removal/provenance/negative obligations are distinct sets.
3. `ASHBY-CCG-003` (MAJOR): all 13 schema `code_pattern` values and relationship `composition` values are annotations; no versioned machine binding joins node kinds to executable effects or relationship variants to composition/removal evaluators.
4. `ASHBY-CCG-004` (MAJOR): 16 relationship names expand to 21 endpoint tuples (`exposes` 2, `applies` 2, `maps` 2, `queries` 3).
5. `ASHBY-CCG-005` (MAJOR): `required_structure` is parsed but never passed to or evaluated by `evaluateCriteria()`; structurally incomplete witnesses can return no violation.
6. `ASHBY-CCG-006` (MAJOR): Interface and Mapping use `attribute-present`, so blank or out-of-domain discriminator values can pass.
7. `ASHBY-CCG-007` (MAJOR): `orchestrates` is declared ordered, but source and compiled edge records have no ordinal and compilation sorts by `edge_id`.
8. `ASHBY-CCG-008` (MAJOR): the IOLM receipt lacks independently verifiable evidence handles for several claimed checks and omits selected negative evidence classes.

Initial defended areas: the 4-kind/3-relation compiler is valid at its experimental same-feature scope; Body War is honestly blocked; structural proof must not be inflated into business-semantic proof; planned-but-unbuilt artifacts are not automatically current contract corruption.

### ASHBY FINAL POSITION

Ashby accepted the opposing findings on successor-profile absence, schema-digest absence, compiler/kernel divergence, missing graph-to-derivation connection, fail-open execution/receipts/aggregates, IOLM self-attestation, and the lack of a Body War machine route.

Refinements:

- `ASHBY-CCG-002R` (CRITICAL): rename the 16-item set `O_formation`; never equate it to total `O_spec`.
- `ASHBY-CCG-003R` (CRITICAL): machine node-pattern and edge-composition/removal bindings are absent.
- `ASHBY-CCG-004R` (MAJOR): exact-set reconciliation must distinguish `D_kind=13`, `D_form=16`, `D_rel_family=16`, `D_rel_pair=21`, `D_rel_scope=29`, plus separately frozen removal, provenance, node-effect, and negative sets.
- `ASHBY-CCG-005R` (CRITICAL): ignored `required_structure` is a direct false-green.
- `ASHBY-CCG-006R` (MAJOR): close Interface and Mapping discriminator domains.
- `ASHBY-CCG-007R` (MAJOR): add and preserve conditional relationship order.
- `ASHBY-CCG-008R` (MAJOR): require IOLM evidence handles for each claim.
- `ASHBY-CCG-009` (MAJOR): Body War is honestly pending, but cannot reach its terminal receipt without a machine contract/schema/runner.

Demotions and dissent: current v1 is KEEP; missing future artifacts are readiness gaps rather than current corruption; inverse generation is required only where the successor contract selects it; full business formulas and behavior remain deferred. Ashby considers 29 variants required only if the release claims complete endpoint-and-scope coverage.

## SMITHE — formal ownership and provenance

### SMITHE INITIAL

Disposition: BLOCK successor completeness; KEEP the current 4/3 experimental profile.

1. `SMITHE-GAP-001` (BLOCKER): the old manifest is stale and denominator-incomplete.
2. `SMITHE-GAP-002` (CRITICAL): no machine owner admits the exact successor kind, criterion, schema-digest, relationship-tuple, and root sets. `supported-profiles.yml` admits only 4/3.
3. `SMITHE-GAP-003` (CRITICAL): v1 source layout embeds edges in source nodes, has no independent edge roots/lifecycle, and rejects cross-feature connections.
4. `SMITHE-GAP-004` (CRITICAL): formation schemas have no schema/criterion version, registries bind paths rather than per-schema digests, and graph/build receipts omit a formation-set digest.
5. `SMITHE-GAP-005` (CRITICAL): minted compilation implements a second limited YAML parser/evaluator and cannot enforce all shared criterion rules.
6. `SMITHE-GAP-006` (MAJOR): current kind contracts mostly classify markers rather than own executable structure. This becomes critical only if the claim is widened to behavioral completeness.
7. `SMITHE-GAP-007` (CRITICAL): the relationship loader/compiler consumes endpoint identity but not multiplicity, order, inverse, scope semantics, composition, or named validation obligations.
8. `SMITHE-GAP-008` (CRITICAL): minted graph nodes/edges never enter the legacy derivation entrypoint.
9. `SMITHE-GAP-009` (CRITICAL): no independent machine `O_spec` catalogue exists.
10. `SMITHE-GAP-010` (CRITICAL): bindings lack exact digest-bound identity; emission permits todo/skip; receipts are accounting/read models; package aggregates omit the terminal chain.
11. `SMITHE-GAP-011` (CRITICAL): IOLM can assert pass without role-specific execution evidence; Body War has no machine receipt path.

Initial defended areas: current generated/source roles and path containment are sound; current expected outputs are evidence rather than semantic authority; IOLM cannot promote production state; the BTE work-pack honestly marks later tasks blocked.

### SMITHE FINAL POSITION

Smithe rejected any claim that current v1 is broken and demoted universal business-semantics requirements. Structural classification requires stable criterion identity/version/digests, enforced `required_structure`, shared normalized evaluation, closed discriminators, and exact positive/negative witnesses. Causal relationship proof requires independent edge identity/provenance, typed endpoint and scope variants, order when declared, registry digest, add/remove deltas, and generated-inverse provenance only where claimed.

Smithe's denominator model is:

```text
O_spec = O_form ⊎ O_node_effect ⊎ O_rel_pair_scope
O_spec[x] = O_gen[x] = T_gen[x] = E_run[x]
M_expected[x] = M_executed[x] = M_killed[x]
```

The current known counts are 13, 16, 16, 21, and 29 for the five named denominators; node-effect and negative counts remain unresolved. Body War pending is honest but terminally unimplementable. Remaining dissent: if scope alternatives remain inside the phrase "all admitted backend signatures", 29 variants are mandatory; otherwise the claim must explicitly narrow to relationship-family recognition.

## LAWVERE — adversarial completeness and vacuity

### LAWVERE INITIAL

Disposition: BLOCK successor completeness.

1. `LVR-EVF-001` (BLOCKER): the old corpus is stale and incomplete; a 61/61 check could pass without examining the requested live denominators.
2. `LVR-EVF-002` (BLOCKER): the successor 13/16 profile is not machine-supported, while the integrated manifest already states 13/16 admitted/exercised with every receipt pending.
3. `LVR-EVF-003` (HIGH): 16 relationship names hide 21 endpoint pairs and 29 scoped variants. One family witness can leave alternate endpoint/scope routes untested; order, multiplicity, inverse, and composition can also pass vacuously.
4. `LVR-EVF-004` (HIGH): ignored structure and marker-only discriminators permit concrete false-greens such as `interface_kind: potato`, `direction: sideways`, an Entity missing required columns, or lexical equality text that merely contains `equal`.
5. `LVR-EVF-005` (BLOCKER): the minted compiler's local parser drops non-key criteria and cannot exercise the shared rule set.
6. `LVR-EVF-006` (BLOCKER): empty feature/node arrays can compile to empty graphs and an unconditional `status: pass` build view.
7. `LVR-EVF-007` (BLOCKER): compiled canonical relationships cannot enter the Markdown-oriented legacy derivation engine; even `enforces` has an incompatible legacy direction/model.
8. `LVR-EVF-008` (BLOCKER): first-match binding, todo/skip emission, zero-obligation success, and incomplete aggregate scripts form a fail-open path.
9. `LVR-EVF-009` (BLOCKER): IOLM handles/checks can be self-asserted and Body War lacks a machine consumer gate.

Lawvere explicitly classified UI kinds and business satisfiability as legitimate N/A, but alternate endpoints/scopes, empty witnesses, bindings/evaluators, execution, replay, and consumer receipts as non-N/A. He found no gap in v1 path containment, digest joins, endpoint typing, or generated-artifact freshness at the narrow conformance scope.

### LAWVERE FINAL POSITION

Lawvere retained BLOCK for successor completeness and KEEP for historical v1. He reconciled `O_spec=16` as valid only when renamed formation-only and proposed the disjoint total `O_total = O_form ⊎ O_edge`. He demoted the missing Body War receipt from deception to an honest blocker, while retaining the missing machine path as a terminal contract gap.

Minimum structural non-vacuity includes required columns/collections, closed discriminator domains, stable references, and concrete structural records where the definition depends on them. Minimum causal non-vacuity includes stable source/provenance, typed endpoints, scope, lifecycle, conditional order, graph-level constraints, variant exercise or justified N/A, add/remove obligation deltas, and typed negative mutations. Business truth, formulas, handler equivalence, network behavior, and universal code/spec equivalence remain deferred.

Remaining dissent: 21 endpoint pairs are the consensus floor; Lawvere requires 29 typed-and-scoped variants for the current "all admitted backend signatures" wording unless authority separates and narrows the scope claim.

## Explicit disagreements and demotions

| Topic | Initial pressure | Reconciled candidate position |
|---|---|---|
| Is current v1 defective? | Successor needs exceed v1. | No. KEEP v1 at exactly 4 kinds, 3 same-feature relationships, experimental/non-admitting scope. Add a versioned successor. |
| Does every kind require business execution semantics? | Marker-only bodies were attacked as non-executable. | No universal business semantics. Enforce only the machine definition's structural/classification promises. EVF S1 separately requires a Rule machine Boolean predicate. |
| Is `O_spec=16` wrong? | Ashby attacked it as a total causal denominator. | It is valid only as `O_formation=16`; total `O_spec` must be a disjoint union of independently frozen proof families. |
| Are 16 relationship witnesses complete? | Name-level plan says yes. | No for endpoint/scope completeness. 21 typed pairs are the floor; 29 scoped variants are required unless the claim is explicitly narrower. |
| Is Body War pending a current false-green? | Initial blocker language risked implying deception. | No. Pending is honest. The missing machine contract/schema/runner is a MAJOR terminal-readiness gap. |
| Must inverse edges always be generated? | Registry includes a generated view for `owns`. | Only where the selected successor claim includes the generated inverse; provenance must then be tested. |

## Reproduction commands and evidence

```bash
sha256sum projects/domainspec-v2/development/evolvable-validation-framework/reviews/2026-07-20-implementation-completion/corpus-manifest.refresh-002.json
sha256sum projects/domainspec-v2/definitions/minted-project/supported-profiles.yml
sha256sum projects/domainspec-v2/definitions/relationships/relationships.yml
find projects/domainspec-v2/impl/spec/meta-types/{behavioral,connective,lifecycle,structural} -name '*.schema.yml' -type f | sort
npm --prefix projects/domainspec-v2/impl run tools:test
```

Literal evidence is cited in `findings.md` and machine-normalized in `gap-matrix.json`. Verifier returns must be appended below without rewriting these attacker positions.

## Verifier returns

### CAPUCCI INITIAL

Capucci's initial audit found six overstatements and rejected treating 21/29 as selected obligations.

Disposition:

- ACCEPT `KEEP-V1-001..004`, `GAP-001`, `GAP-002` successor-only, `GAP-005..009`, `GAP-012` successor-only, `GAP-014`, `GAP-016`, `GAP-018..020` at release/successor scope, `GAP-022..023`, `GAP-025`, and `GAP-027`.
- REFUTE/DROP `GAP-003`: `TASK-BTE-OBLIGATIONS.md` explicitly makes `O_spec` formation-only; a universal total union is a contract change.
- REFUTE/DROP `GAP-004` as a requirement in its initial form: 21/29 arithmetic is exact, but only 16 families are selected.
- REFUTE/DROP `GAP-010`: richer workflow/state/mapping structures are not all selected formation obligations; ignored literal `required_structure` is already `GAP-006`.
- Replace `GAP-011` with the narrower S1 blocker: predicate-source selection is pending and the review must not preselect Rule-schema mutation.
- Narrow `GAP-013` to successor-selected endpoints, roots, scope, direction/lifecycle, and selected composition/removal; multiplicity/inverse require selection.
- REFUTE/DROP `GAP-015`: no current profile selects generated `owned-by`.
- Narrow `GAP-017` to the exact 16 formation catalogue.
- Replace universal node effects in `GAP-021` with selected edge composition/removal bindings.
- Narrow `GAP-024` to selected formation/family negatives.
- ACCEPT and demote `GAP-026` to MAJOR.

Exact matrix corrections requested:

1. Move 21/29 out of required claim denominators; retain them as derived-unselected diagnostics.
2. Do not claim variant completeness without independent variant rows.
3. Do not put unresolved node-effect/removal/provenance/negative sets into a total invariant.
4. Remove the total-union `chain.independent-obligations` row.
5. Separate Rule formation from the EVF S1 predicate/fixture blocker.
6. Cite all 13 schemas for required structure.
7. Bind current-v1 tests/replay/mutations to actual tests and receipt code.
8. Split criterion evaluation from required-structure validation.
9. Correct the lane path to `projects/domainspec-v2/development/first-production-release/profile-lanes/fpr02-lanes.yml`.
10. Add evidence for `TASK-GCP-ENFORCES.md`, `DEC-GCP-001`, minted tests/views, conformance receipt, and residue receipt.

Zero-finding defenses: current v1 narrowness/empty-model behavior/cross-feature rejection are intentional; UI/backend lanes are independent; 13/16/16/21/29 arithmetic is correct; Body War and IOLM are honestly pending.

### CAPUCCI FINAL

Final verifier position:

1. Retain 21 endpoint pairs and 29 pair/scope combinations as exact `derived-unselected` diagnostics. `GAP-004` survives only as the owner decision among family (16), pair (21), and scoped (29) coverage. No pair/scope obligation exists until promoted.
2. Capucci accepted `GAP-010` only as a possible definition/schema alignment issue for Workflow, State Machine, and Mapping. The parent correction freezes these as non-counting definitions-owner questions, so `GAP-010` is dropped from the surviving list.
3. Exact `GAP-011` scope: BLOCKER for EVF S1 only; N/A for BTE formation and unrelated kinds. Current Rule proves only `formal_return_type:boolean`; `DEC-GCP-001` must choose among its three options. No option is preselected.
4. Every cell must use `present|missing|deferred|not-applicable` and carry reason, owner, authority reference, promotion condition, and evidence. Present evidence requires path, selector, digest, verification, expected and observed result, plus tool identity where execution matters.
5. Current-v1 test/replay/mutation cells must cite tests and receipt code; IOLM schema validation is missing without a runner; required-structure successor chain cells cannot be N/A; mixed cells must be atomized.

Final ID disposition:

- ACCEPT: `GAP-001`, `GAP-002`, `GAP-004..009`, `GAP-012`, `GAP-014`, `GAP-016`, `GAP-018..020`, `GAP-022`, `GAP-023`, `GAP-025`, `GAP-027`.
- ACCEPT with narrowing/demotion: `GAP-010` (then parent-frozen as deferred question), `GAP-011`, `GAP-013`, `GAP-017`, `GAP-021`, `GAP-024`, `GAP-026`.
- REFUTE/DROP: `GAP-003`, `GAP-015`.
- KEEP: `KEEP-V1-001..004`.

Remaining dissent: verifiers must not decide whether 16, 21, or 29 becomes normative; Event payload strengthening remains unresolved; generated inverse proof is conditional on future selection.

### CAPUCCI CONVERGENCE

`PASS`

### RITTEL INITIAL

Disposition: BLOCK successor completeness; KEEP narrow experimental v1.

Rittel accepted `KEEP-V1-001..004`, `GAP-001..002`, `GAP-004..014`, and `GAP-016..027` with the stated scope qualifiers; refuted/dropped `GAP-003` and `GAP-015`.

Concrete false-greens reproduced:

- zero violations for `interface_kind: potato`, blank `interface_kind`, `direction: sideways`, Value Object text “These values are not equal,” incomplete Entity/Enum structures, and a marker-only State Machine;
- zero-feature and zero-node projects compile to empty graphs and verified `status:"pass"` views;
- `bindingFor()` selects the first of two equal matches;
- empty derivation and emission return zero work without a completeness failure;
- legacy todo and hybrid skip paths remain successful outside a release-level gate;
- current receipts catch fixture/result mutation but do not bind successor criterion/evaluator/composition mutation;
- `npm run validate` omits terminal engine/typecheck/instance/generated/mutation/consumer proof;
- IOLM can assert numeric counts, generic handles, literal pass checks and rejected negatives without independent recomputation;
- Body War has Markdown intent and a fixture but no machine contract/schema/runner/replay.

Matrix defects reproduced:

- denominator arrays are arithmetically exact, but no pair/scope rows existed despite the initial required claim;
- no rows existed for unresolved node-effect/removal/provenance/negative sets;
- deferred/N/A cells lacked reasons and owners;
- current-v1 test/replay/mutation evidence cited only profile/schema paths;
- IOLM schema presence was incorrectly counted as executable validation;
- false-green criteria were counted as sufficient;
- required-structure derivation/binding/replay were marked N/A;
- Body War fixture presence was mechanically true but not admissible machine input;
- evidence catalog entries lacked digest, selector, command, and observed result.

Focused verification included manifest rehash, denominator/row checks, evaluator/binding/empty-derivation probes, `tools:test`, and `engine:test`. No files were intentionally modified.

### RITTEL FINAL

Final verifier position: KEEP narrow v1; BLOCK successor completeness.

Disposition:

- ACCEPT unchanged: `GAP-001`, `GAP-002`, `GAP-005..009`, `GAP-012`, `GAP-014`, `GAP-016`, `GAP-018..020`, `GAP-022`, `GAP-023`, `GAP-025`, `GAP-027`.
- REFUTE/DROP: `GAP-003`, `GAP-010`, `GAP-015`.
- DEMOTE/NARROW: `GAP-004`, `GAP-011`, `GAP-013`, `GAP-017`, `GAP-021`, `GAP-024`, `GAP-026`.

Relationship denominator: 21/29 remain exact derived diagnostics. The owner-selected set is currently 16 families. If future language says all endpoint signatures or scope-complete, promote 21 or 29 and create the corresponding independent rows.

Literal formation gaps retained are ignored `required_structure`, closed Interface/Mapping discriminators, and lexical Value Object equality. Richer Workflow/State Machine/Mapping/Event formation is an owner-governance question rather than an existing selected criterion violation.

Exact S1 position: current Rule formation is not defective. `DEC-GCP-001` remains pending on which source may author predicate and fixture inputs. Until selection/implementation, S1 stays `needs_formal`/blocked. Evidence-local aspect, Rule-contract extension, and honest blocked receipt all remain open.

Narrowed findings:

- `GAP-013`: selected endpoint/root/scope/direction/lifecycle and explicit composition/removal only; multiplicity/inverse require selection; order remains `GAP-014`.
- `GAP-017`: selected 16-item formation catalogue only.
- `GAP-021`: evaluators for selected 16 formation criteria, S1 after decision, and selected composition/removal only.
- `GAP-024`: exact 16 formation mutants and selected family-level negatives; 21/29 only after promotion.
- `GAP-026`: MAJOR consistency issue; replace admitted/exercised with expected/pending.

Final matrix model: normative 13/16/16; diagnostic 21/29; exact row identity; every cell reason/owner/reference/promotion condition; every present evidence record path/digest/selector/verification/expected/observed/tool; only `present` counts.

Remaining dissent is conditional only: pair/scope counts become normative if and only if the release language selects them.

### RITTEL CONVERGENCE

`PASS`

Rittel's automatic memory-citation footer was runtime metadata and is not treated as repository review evidence; the substantive return above is preserved.

## Raw verifier returns

The following blocks preserve the verifier text delivered to the synthesizer. Runtime-only memory-citation footers are excluded because they are not review claims or repository evidence.

### CAPUCCI INITIAL — RAW

Audit result: the candidate overstates six findings and misuses the 21/29 derived relationship views as selected denominators. No files were changed.

#### Dispositions

- `KEEP-V1-001..004`: **ACCEPT**. The live profile is exactly 4 kinds/3 relationships, experimental, release-deferred, and same-feature. Resolver/compiler/read-model evidence is real. Focused tests passed `24/24`, including containment, digest binding, deterministic replay, five negative controls, cross-feature rejection, and verified empty views.
- `GAP-001`: **ACCEPT**. Manifest SHA, 61 entries, 56 matching entries, and the five named drifted files all reproduce exactly.
- `GAP-002`: **ACCEPT**, successor-only. Only the historical 4/3 profile is machine-admitted; the 13-kind lane and successor catalogue remain planning surfaces.
- `GAP-003`: **REFUTE / DROP**. `TASK-BTE-OBLIGATIONS.md` explicitly says the catalogue is “formation evidence only,” and the plan equation explicitly begins `Criteria_profile = O_spec ... = 16`. There is no literal machine or plan authority making this scalar a total union of formation, node-effect, and relationship obligations. Renaming it universally or imposing a total `O_spec` changes the contract.
- `GAP-004`: **REFUTE / DROP as a requirement**. The arithmetic 16/21/29 is exact, but only 16 relationship families are selected by `TASK-BTE-EDGE-COVERAGE.md`, whose positive standard says each signature must have an admitted edge. No authority selects all endpoint/scope combinations as distinct obligations. Keep 21/29 only as derived diagnostic views unless an owner explicitly promotes variant-level coverage.
- `GAP-005`: **ACCEPT**, successor-only. The 13 schemas have no version/digest fields; the current profile binds registry digests but not each YAML schema digest or an aggregate formation-set digest.
- `GAP-006`: **ACCEPT**. All 13 schemas declare `required_structure`; `evaluateCriteria()` receives only criteria and subject, and instance validation calls only that function.
- `GAP-007`: **ACCEPT**. Machine registry descriptions close Interface to `external|internal` and Mapping to `inbound|outbound|bidirectional`, while their criteria check presence only.
- `GAP-008`: **ACCEPT**. `section-contains` uses normalized substring inclusion, so incidental or negated “equal” text passes.
- `GAP-009`: **ACCEPT**, successor/compiler parity scope. The local compiler loader retains only `rule/key/value` and handles only nonempty/equal/present; the shared kernel supports all nine registered rule strings/eight planned forms.
- `GAP-010`: **REFUTE / DROP**. `code_pattern`, `one_line`, and distinguisher prose describe/classify kinds; they do not select executable workflow steps, mapping fields, or state-transition records as formation obligations. The schemas explicitly state shape-only/no-semantic-satisfiability. Strengthening canonical formation is a definitions-owner decision, not a completeness bug. Literal required-structure non-enforcement is already covered by GAP-006.
- `GAP-011`: **REFUTE as written / replace with a distinct narrower blocker**. EVF S1 lacks an authored predicate and fixture inputs, but pending `DEC-GCP-001` explicitly offers three choices and recommends an evidence-local `operations.md`, not changing the Rule formation schema. Retain only: “S1 is blocked pending predicate-source selection.” Do not require predicates for Rule formation or unrelated kinds.
- `GAP-012`: **ACCEPT**, successor readiness only. It is not a defect in deliberately narrow v1.
- `GAP-013`: **ACCEPT only after narrowing** to successor-selected endpoint, root/scope, direction/lifecycle, and explicitly selected composition/removal rules. Drop universal multiplicity/inverse enforcement absent profile selection.
- `GAP-014`: **ACCEPT**. `orchestrates` is machine-declared ordered; neither connection nor graph edge has ordinal/order, and compiler output sorts by `edge_id`.
- `GAP-015`: **REFUTE / DROP as a current gap**. No successor profile currently selects generated `owned-by`. Preserve only a conditional validation rule if a future profile selects the inverse view.
- `GAP-016`: **ACCEPT**. The derivation entrypoint parses Markdown feature directories and never consumes minted graph edges.
- `GAP-017`: **ACCEPT after narrowing** to the exact 16 formation obligations. Do not require a universal per-family total catalogue unless separately selected.
- `GAP-018..020`: **ACCEPT**, release/successor scope. Existing todo/skip and valid empty conformance models remain honest at prototype scope; completeness needs a separate fail-closed route.
- `GAP-021`: **REFUTE as written / replace with edge-only gap**. Universal node-to-effect evaluators confuse structural classification with behavioral execution. Retain only the explicitly planned missing edge composition/removal bindings.
- `GAP-022..023`: **ACCEPT**, successor/terminal receipt scope.
- `GAP-024`: **ACCEPT after narrowing** to exact negative/mutation sets for the selected 16 formation criteria and selected 16 relationship-family witnesses. Do not infer 21/29 mutation denominators.
- `GAP-025`: **ACCEPT**, but it is IOLM-consumer-owned. The schema has role-named handles, but each handle remains only `id/path/digest`; check and negative verdicts have no command/result evidence binding. Core cannot mutate this authority.
- `GAP-026`: **ACCEPT, demote to MAJOR**. The candidate manifest says admitted/exercised while all receipts are pending, but it is explicitly candidate/non-production and grants no authority. Change those fields to expected/pending.
- `GAP-027`: **ACCEPT**, consumer-owned terminal readiness. Pending status remains honest.

#### Denominator verification

- `D_kind=13`: exact.
- `D_form=16`: exact.
- `D_rel_family=16`: exact selected family set.
- Derived registry expansion `D_rel_pair=21`: arithmetically exact.
- Derived registry expansion `D_rel_scope=29`: arithmetically exact.
- Error: 21 and 29 are not currently selected machine obligations. They must not appear in the claim boundary or `O_relationship` invariant as mandatory denominators.

#### Exact `gap-matrix.json` corrections

1. Remove 21/29 from the required claim denominator; label them `derived-unselected` or remove them.
2. If variant completeness is retained, the matrix lacks all independent variant rows: it has 16 family rows with embedded arrays, not 21 pair rows or 29 scope rows. The five extra endpoint alternatives and eight additional scoped alternatives are therefore unadjudicated.
3. `D_node_effect`, `D_removal`, `D_provenance`, and `D_negative` are unresolved and have no denominator rows. `chain.independent-obligations` cannot claim their union.
4. Delete/rewrite `chain.independent-obligations`: its “formation plus node-effect plus relationship” scope contradicts the formation-only `O_spec` task.
5. Split `criterion.rule.boolean_predicate` from EVF executable predicate proof. Its `fixture_input=present` means only a formation fixture for `formal_return_type:boolean`; the absent EVF predicate/fixture requires a separate row tied to `DEC-GCP-001`.
6. `chain.required-structure` claims all 13 kinds but cites only Entity, Value Object, and Enum. All 13 schemas declare `required_structure`; cite all 13 or create per-kind rows.
7. `chain.current-v1` has unsupported evidence references: `executable_test=present` cites only `PROFILE`; `receipt_replay=present` cites only `GRAPH_SCHEMA`; `mutation=present` cites only `PROFILE`. The statuses can remain present, but evidence must cite actual compiler/contract/conformance tests and conformance-receipt implementation.
8. The coarse `schema_validation` column makes all 13 kind rows “missing” while all 16 criterion rows are “present.” Split criterion evaluation from required-structure/envelope validation.
9. Exact path correction for GAP-002: `projects/domainspec-v2/development/first-production-release/profile-lanes/fpr02-lanes.yml`.
10. Add missing evidence-catalog entries for `TASK-GCP-ENFORCES.md`, `DEC-GCP-001`, minted compiler/contract/resolver/views tests, conformance receipt, views implementation, and residue receipt.

#### Zero-finding defenses

- No current-v1 integrity finding: narrowness, empty-model acceptance, and cross-feature rejection are intentional and tested.
- No UI/backend boundary finding: `FPR-02B` and `FPR-02U` are explicitly independent.
- No denominator arithmetic finding: 13/16/16/21/29 are computed correctly; only denominator authority was wrong.
- No deception finding for Body War or IOLM: receipts are honestly pending. Surviving findings are terminal-readiness/contract-strength gaps only.

### CAPUCCI FINAL — RAW

FINAL verifier position:

#### Joint correction set

1. **Relationship denominators.** Retain `21` endpoint pairs and `29` pair/scope combinations as **derived-unselected diagnostics**, not current obligations. Repair requires an owner decision: family-level 16; pair-level 21 plus rows; or scope-level 29 plus rows. Until then, remove “at least 21” and “29 required” from the completeness claim.
2. **Marker-only findings.** Accept `GAP-010` only as a definition/schema alignment gap for Workflow, State Machine, and Mapping. Do not include Rule predicate behavior, Operation/Query/Calculation/Policy runtime semantics, Interface/Event relationship behavior, Enum structure already covered by `GAP-006`, Value Object equality already covered by `GAP-008`, or discriminator domains already covered by `GAP-007`. Event payload remains residue.
3. **Exact GAP-011 wording.** `GAP-011` is a BLOCKER for EVF S1 only and N/A for BTE formation/unrelated kinds. Current Rule proves only `formal_return_type:boolean`; it does not author predicate or fixture inputs. `DEC-GCP-001` remains pending. The owner must select one option; the review must not preselect schema mutation or generalize predicates.
4. **Required matrix model.** Every cell has status, literal reason, owner, authority reference, promotion condition, and evidence. Present evidence has ref/selector/digest/verification; missing/deferred/N/A cannot count. Mixed cells are split. Current-v1 tests cite actual tests/receipt code; IOLM validation remains missing without runner; required-structure chain boundaries are missing where successor selects them; Body War fixture is not admitted machine input.

Final ID disposition:

- ACCEPT: `GAP-001`, `GAP-002`, `GAP-004`–`GAP-009`, `GAP-012`, `GAP-014`, `GAP-016`, `GAP-018`–`GAP-020`, `GAP-022`, `GAP-023`, `GAP-025`, `GAP-027`.
- ACCEPT with mandatory narrowing/demotion: `GAP-010`, `GAP-011`, `GAP-013`, `GAP-017`, `GAP-021`, `GAP-024`, `GAP-026`.
- REFUTE/DROP: `GAP-003`, `GAP-015`.
- `KEEP-V1-001..004`: ACCEPT.

Remaining dissent: verifiers must not select 16/21/29; Event payload remains unresolved; generated inverse proof remains conditional.

### CAPUCCI CONVERGENCE — RAW

`PASS`

### RITTEL INITIAL — RAW

Disposition: BLOCK successor completeness; KEEP narrow experimental v1.

Disposition by finding:

- ACCEPT `KEEP-V1-001..004`. The 4-kind/3-relationship profile remains explicitly experimental/non-admitting, resolver/compiler protections are live, and `tools:test` and `engine:test` passed.
- ACCEPT `GAP-001..002`.
- REFUTE and DROP `GAP-003`. `TASK-BTE-OBLIGATIONS.md` explicitly defines `O_spec` as the 16 formation-criterion obligations only. There is no literal contradiction requiring a total disjoint union.
- ACCEPT `GAP-004..014`.
- REFUTE and DROP `GAP-015`. No successor profile selects `owned-by`; a conditional obligation belongs only to a future profile that selects inverse materialization.
- ACCEPT `GAP-016..027`, retaining scope qualifiers on S1, empty conformance, IOLM ownership, and Body War readiness.

Concrete false-greens reproduced:

- zero violations for `interface_kind: potato`, blank `interface_kind`, `direction: sideways`, Value Object text “These values are not equal,” incomplete Entity/Enum structures, and State Machine with only `has_transitions: yes`;
- zero-feature and zero-node projects compile to valid empty graphs, and an example-free empty project verifies as `{status:"pass", codes:[]}`;
- `bindingFor()` selects the first of two equally matching bindings;
- `derive({nodes:[],edges:[]})` returns zero obligations and hybrid empty emission returns zero totals/gaps;
- legacy emission produces `it.todo`, hybrid emission produces `it.skip`, and CLI emission has no release-level zero/todo/skip gate;
- conformance receipts catch fixture/result mutation but do not digest or mutation-test successor criterion/evaluator/composition implementation;
- `npm run validate` omits `engine:test`, typecheck, explicit instance validation, generated-suite execution, mutation proof, and consumer validation; no `verify:bte:*` scripts exist;
- IOLM can syntactically assert counts, arbitrary handles, literal pass checks, rejected negatives, and final pass without exact IDs, commands, outputs, or independent recomputation;
- Body War has only Markdown intent and a fixture whose `source_contract` is Markdown; no machine contract, receipt schema, validator, runner, or replay command exists.

Exact matrix defects:

- 13/16/16/21/29 arrays are exact, but 21/29 had no independent rows despite being claimed as required;
- unresolved node-effect/removal/provenance/negative sets had no rows;
- all deferred/N/A cells lacked per-cell reason, owner, and reference;
- current-v1 test/replay/mutation cells cited only profile/schema paths;
- IOLM schema presence was counted as executable validation without a runner;
- Interface, Mapping, and Value Object equality were counted sufficient despite reproduced false-greens;
- required-structure derivation/binding/replay were marked N/A despite successor chain requirements;
- Body War fixture presence was misleading because it binds only Markdown and no upstream proof handles;
- evidence catalog paths lacked digest, selector, command, expected and observed results.

Required corrections:

1. Drop `GAP-003` and `GAP-015`.
2. Add pair/scope rows only if those denominators remain selected.
3. Do not claim unresolved proof-family totals without machine catalogues.
4. Give every N/A/deferred cell reason, owner, decision/task reference, and promotion condition.
5. Count known-false-green mechanisms as missing/insufficient rather than present.
6. Bind present cells to path, selector, digest, command, and result.
7. Preserve v1 empty-model behavior but make successor completeness reject empty/zero/todo/skip/ambiguous/stale/surviving evidence.
8. Make terminal aggregation prove exact sets and both independent consumers without substitution for core proof.

Focused commands included rehashing profiles/relationships/manifest, denominator and row checks, evaluator/binding/empty-derivation probes, `npm --prefix projects/domainspec-v2/impl run tools:test`, and `engine:test`. No files were intentionally modified.

### RITTEL FINAL — RAW

Final verifier position: KEEP narrow v1; BLOCK successor completeness.

Disposition:

- ACCEPT `KEEP-V1-001..004`.
- ACCEPT unchanged: `GAP-001`, `GAP-002`, `GAP-005..009`, `GAP-012`, `GAP-014`, `GAP-016`, `GAP-018..020`, `GAP-022`, `GAP-023`, `GAP-025`, `GAP-027`.
- REFUTE/DROP: `GAP-003`, `GAP-010`, `GAP-015`.
- DEMOTE/NARROW: `GAP-004`, `GAP-011`, `GAP-013`, `GAP-017`, `GAP-021`, `GAP-024`, `GAP-026`.

Relationship denominator:

- Keep 21 endpoint pairs and 29 endpoint+scope variants as deterministic live-derived diagnostics.
- The owner-selected set is presently 16 relationship families.
- Add an explicit owner decision among family, pair, and scoped positive exercise.
- Until selection, do not include 21/29 in required completeness counts.

Literal marker-only violations:

- retain ignored `required_structure`, closed Interface/Mapping discriminator gaps, and lexical Value Object equality;
- drop richer Workflow/State Machine/Mapping/Event structures as existing formation violations because they are not selected beyond literal structure/criteria; keep them as governance questions.

Exact S1 position:

`GAP-011` blocks `SWU-GCP-001`, not current Rule formation. Current Rule proves only the Boolean discriminator. `DEC-GCP-001` remains pending among evidence-local aspect, Rule-contract extension, and honest blocked receipt. Do not prescribe one option. N/A to BTE structural classification.

Narrowed findings:

- `GAP-004`: decision/readiness only; 21/29 derived, not selected.
- `GAP-013`: selected endpoint/root/scope/direction/lifecycle, validation, and explicit composition/removal; multiplicity/inverse require selection; order remains `GAP-014`.
- `GAP-017`: exact selected 16-item formation catalogue only.
- `GAP-021`: evaluators only for selected 16 formation criteria, S1 after decision, and selected relationship composition/removal.
- `GAP-024`: exact selected formation mutants and family-level negatives; pair/scope mutations wait for promotion.
- `GAP-026`: MAJOR consistency issue; replace admitted/exercised with expected/pending.

Final matrix model:

1. Normative `D_kind=13`, `D_formation_criterion=16`, and `D_relationship_family=16`; `D_relationship_pair=21` and `D_relationship_scope=29` are diagnostic until promotion.
2. Only sufficient/present evidence counts; mixed cells must be atomized.
3. Every non-present cell has reason, owner, authority reference, and promotion condition.
4. Every present cell resolves to path, digest, selector, evidence role, verification command, expected and observed result, and tool identity.
5. Current-v1 execution/replay/mutation cites conformance tests/receipt code; IOLM validation is missing without runner; false-green criteria are missing; required-structure chain boundaries are missing; Body War fixture is not admissible machine input.
6. Completeness uses exact row-ID equality and rejects missing, duplicate, deferred, N/A-without-justification, todo/skip, empty execution, and surviving mutations.

Remaining dissent is conditional only: if release language selects endpoint- or scope-complete proof, 21 or 29 must be promoted and independently represented.

### RITTEL CONVERGENCE — RAW

`PASS`

### ASHBY CONVERGENCE — VERBATIM

ATTACKER CONVERGENCE — ASHBY

Shared accepted boundary:

- The frozen corpus is stale: five of 61 manifest hashes do not match the live files.
- No admitted 13-kind/16-relation-family successor profile exists; formation-schema digests are absent from successor profile and receipt contracts.
- `O_spec = 16` is internally insufficient for the accepted causal-proof contract. The machine denominator must distinguish `F = 16` formation criteria, `N = 13` node-effect obligations, `R_family = 16` relation families, `R_tuple = 21` endpoint variants, `R_scope = 29` endpoint-and-scope variants, plus separately frozen removal, provenance, and negative sets. Exact-set equality belongs on typed partitions and their union.
- No machine binding joins node kinds to executable pattern-effect contracts or relationship variants to executable composition/removal contracts.
- The minted compiler bypasses the shared eight-rule kernel; `required_structure` is not enforced; Interface and Mapping discriminators can false-green.
- Relationship scope, multiplicity, ordering, and composition semantics are not exercised; ordered relationships lack an ordinal and cannot preserve declared order.
- Minted graph output does not enter derivation, and the binding/generation/execution/receipt/aggregate chain is not yet fail-closed.
- IOLM can self-attest through pass fields and lacks required layout/index/ETag bindings, selected negative classes, and independently verifiable evidence handles.
- Body War has no machine consumer contract, schema, adapter, or runner capable of producing the terminal receipt.

Demotions and refutations:

- Keep the current experimental 4-kind/3-relation compiler unchanged at its declared v1 scope. Its same-feature boundary and cross-feature rejection are not defects; successor proof requires a separate admitted profile with independent roots and cross-feature-capable connections.
- Missing future artifacts that honestly block the gate are major implementation/readiness gaps, not automatically critical current-contract corruption.
- “Minted graph never enters derivation” and the absent fail-closed chain remain accepted blockers, but because the plans already acknowledge their implementation tasks, they are not independent specification contradictions.
- Generated inverse behavior is not universally required; validate it only where the selected successor contract claims an inverse view.
- Reject expansion from causal structural proof into unbounded business-semantic proof. Required typed effect contracts cover formation fields/domains/cardinalities, node-pattern bindings, and edge identity/signature/endpoints/scope/approvals/lifecycle/conditional ordinal/composition/removal. Domain formulas, operation mutations, query correctness, event delivery, policy strategy correctness, workflow execution, and full state-machine reachability remain deferred unless individually selected.

Remaining owner decision and dissent:

- The owner must choose and state the relationship coverage claim. One causal witness per named family yields 16 positive relation exercises but excludes complete endpoint/scope-variant coverage; claiming all supported variants requires at least 29 positive relationship obligations.
- The owner must decide whether any generated inverse views are part of the successor release claim.
- Remaining dissent is severity and claim breadth, not the existence of the gaps: honest blocked target omissions are major; internally impossible denominators, missing causal bindings, and structural false-greens are critical. Full business-semantic execution is outside scope unless the release claim is widened.

Zero-finding defenses:

- No additional finding against the current v1 4-kind/3-relation compiler: it is intentionally experimental and same-feature-only.
- No present false-green finding against Body War status: the work-pack is explicitly blocking and the terminal gate requires a fresh receipt. Its absence is nevertheless a major terminal-contract gap.
- No additional findings for business semantics beyond the selected structural/causal effect boundary.
- No finding merely because future implementation is absent where the plan explicitly blocks rather than attests completion.

No files were changed.

### SMITHE CONVERGENCE — VERBATIM

## ATTACKER CONVERGENCE — Smithe, Toby

**Disposition:** CONVERGED on successor-profile and terminal-completeness BLOCK, with one remaining relationship-denominator dissent.

### Shared accepted boundary

- The current `feature-with-independent-node-files@1` implementation is a coherent experimental v1 contract: four admitted kinds, three admitted relationships, same-feature node-owned connections, deterministic read models, and explicit non-admission. Cross-feature rejection is correct within that boundary.
- The accepted successor and terminal BTE target are not implemented or proven. The review corpus is stale/incomplete; the backend inventory is 13 schemas and 16 formation criteria; no machine successor profile or independent obligation catalogue owns the planned breadth.
- Relationship breadth has distinct denominators: 16 canonical backend relationship names, 21 typed endpoint pairs, and 29 endpoint-pair × admitted-scope variants.
- BTE is a structural verification target. Its immediate machine requirements are enforced `required_structure`, stable kind/criterion/schema identities and digests, a shared eight-rule formation evaluator, independent edge identity/provenance, typed endpoints, resolved scope, ordering where claimed, inverse provenance where claimed, and causal graph/obligation add-remove evidence.
- The successor proof remains blocked by the compiler-local evaluator bypass, absent independent edge roots, absent graph-to-derivation morphism, non-unique/unbound bindings, fail-open todo/skip emission, non-proof receipts, absent independent `O_spec`, incomplete aggregate gates, and pending external consumer runs.
- IOLM’s non-admission constraints are sound, but its count-level opaque handles and lack of a demonstrated recomputing validator are insufficient for terminal execution evidence.

### Demotions and refutations

1. **Refuted:** “The current 4/3 compiler is broken.” It correctly implements experimental v1. The finding applies only as successor-profile insufficiency requiring a versioned layout/compiler extension.
2. **Demoted:** “Every kind needs full business-execution semantics now.” BTE structural proof does not require formulas, business predicates, HTTP behavior, policy algorithms, operation effects, query behavior, event payload behavior, or transition guards/effects. Those remain deferred unless the claim becomes semantic execution. EVF S1 is the bounded exception because it explicitly requires an executable Rule predicate.
3. **Refuted as a present overclaim:** Body War is honestly marked pending. Its Markdown-only adapter and absent fresh receipt block the terminal target; they do not invalidate current v1 or the planning package.
4. **Refined:** A single `|O_spec| = 16` is not an adequate total completeness equation. Formation, node-effect, relationship-family, endpoint-pair, scoped-variant, and negative/mutation obligations must remain typed, independently counted sets.

Recommended denominator contract:

```text
D_kind = 13
D_form = 16
D_rel_family = 16
D_rel_pair = 21
D_rel_scope = 29
D_node_effect = owner-defined before counting
D_negative = exact named negative/mutant ID set

O_spec = O_form ⊎ O_node_effect ⊎ O_rel_pair_scope
O_spec[x] = O_gen[x] = T_gen[x] = E_run[x]
M_expected[x] = M_executed[x] = M_killed[x]
```

### Remaining owner decision and dissent

The relationship owner must choose and machine-record one of two honest claims:

- **Family-recognition claim:** exercise 16 relationship names, explicitly deferring endpoint-pair and scope completeness; or
- **Full admitted-signature claim:** exercise all 29 endpoint-pair × scope variants, with the 21 pair and 16 family projections reconcilable from that set.

My remaining dissent is against calling 16 name-level witnesses “all active backend relationship signatures causally exercised” when alternative endpoints and scopes are admitted. Under that wording, 29 is the proof denominator. Either test all 29 or narrow the claim.

### Zero-finding defenses

- No generated-authority inversion was found in the current minted read models: source/generated roles are closed and source/artifact digests are recomputed.
- Current key-door expected outputs do not originate semantics; they mirror independently owned source/profile data and function as evidence.
- Current v1 path/reference containment is strong: absolute/escaping paths, collisions, aliases, symlink escapes, missing/non-file sources, unsupported extensions, invalid JSON, and unsupported versions are rejected.
- IOLM cannot machine-promote release state: production authorization and all non-admission fields are constrained against escalation.
- The BTE work-pack and integrated manifest are honest about present state: only the shared kernel slice is complete; successor, core, consumer, Body War, and terminal receipts remain pending or blocked.

### LAWVERE CONVERGENCE — VERBATIM

## ATTACKER CONVERGENCE — Lawvere

**Verdict:** BLOCK successor completeness; KEEP the historical 4-kind/3-relationship v1 compiler as valid narrow conformance evidence.

### Shared accepted boundary

- The review corpus is stale and incomplete, so no final completeness verdict may rely on refresh-002 without a new digest-closed corpus.
- No machine-authoritative 13-kind/16-name successor profile currently exists. The live v1 profile remains intentionally limited to 4 kinds and 3 relationships.
- Sixteen relationship names are not an honest typed denominator: they expand to at least 21 allowed backend endpoint pairs. Relationship multiplicity, ordering, scope, and composition are not executed by current validators.
- Machine-declared `required_structure` and several discriminators admit structural false-greens; the minted compiler also duplicates and incompletely implements the criterion evaluator.
- Minted graph nodes and edges do not enter the legacy derivation path; canonical edge identity and direction are therefore not preserved into obligations.
- Binding selection, todo/skip emission, empty derivation, receipts, and aggregate scripts remain fail-open for a successor completeness claim.
- IOLM and Body War are pending consumer surfaces. Neither may contribute terminal evidence until exact, replayable machine receipts exist.
- The accepted target boundary is structural and causal non-vacuity, not business satisfiability, application-code equivalence, or live provider behavior.
- Formation and relationship proof require separate typed denominators:

```text
K_profile = K_exercised = 13
O_form_spec = O_form_gen = T_form_gen = E_form_run = 16
O_edge_spec = O_edge_gen = T_edge_gen = E_edge_run
O_total = O_form ⊎ O_edge
```

### Demotions and refutations

- **Refined, not rejected:** `O_spec=16` is sound when explicitly named formation-only. It is misleading only when presented as the total causal completeness denominator.
- **Demoted:** Absence of a Body War receipt is not itself a false-green because the manifest honestly marks it pending. The blocker is that the target still lacks a machine adapter contract, receipt schema, runner, and replay gate.
- **Refuted:** The current 4/3 compiler is not defective merely because it lacks 13/16 breadth. It should remain unchanged; breadth belongs in an additive successor profile/version and route.
- **Refuted:** Every backend kind does not need executable business semantics. It needs only the machine structure asserted by its classification and relationship contracts.
- **Retained:** Mere attribute presence, lexical equality, marker-only workflow/state-machine structures, and ignored `required_structure` are genuine classification false-greens because they fail the definitions’ own structural claims.
- **Retained:** The integrated manifest’s `admitted/exercised: 13/16` wording is unsupported while the successor profile and all execution/consumer receipts remain pending.

### Exact non-vacuity boundary

Structural proof must enforce required fields/columns, exact discriminator domains, nonempty declared collections, and stable structural references. Workflow needs ordered step references; State Machine needs states and transitions; Enum needs nonempty unique values; Mapping needs a declared direction and field mappings; Interface needs an admitted kind. Operation, Query, Calculation, Rule, and Policy need exact classifier values, but not proof that their business behavior is correct.

Causal edge proof must bind stable edge identity, signature, typed endpoints, owner, scope, lifecycle, source digest, and ordinal where ordered; validate graph-level multiplicity and scope; derive a uniquely edge-anchored obligation; remove that obligation when the edge is removed; and kill invalid endpoint/root/scope/multiplicity/order mutations. Predicate truth, formula correctness, code-handler conformance, application mutation behavior, network/provider execution, and universal spec-to-code equivalence remain deferred.

### Remaining owner decision and dissent

The consensus denominator floor is **21 typed backend endpoint pairs**. My stronger position remains **29 endpoint-pair/scope variants**, because six selected relationships admit both same-feature and cross-feature scopes and two are cross-feature-only.

The owner must decide in machine authority whether scope is part of signature identity or a separately reconciled denominator. If 21 is selected, the claim must be narrowed to endpoint-pair coverage and a separate exact scope matrix is required. Multiplicity, order, and composition remain separate predicate rows under either choice. No exact relationship-completeness count should be promoted before this decision.

### Zero-finding defenses

- **Source containment and provenance:** no gap found. The resolver rejects absolute, escaping, symlink, duplicate, case-collision, and alias paths and hashes source bytes.
- **Current v1 registry/profile binding and endpoint typing:** no gap found within the admitted 4/3 scope. Registry/profile digests and endpoint kinds are checked.
- **Generated artifact freshness:** no gap found for byte-level graph, source-manifest, Markdown-view, and source freshness joins in the conformance build. This proves integrity, not completeness.
- **Formation-only independent authority:** no gap found in the planning rule that an independently owned `O_form_spec` must precede derivation and remain read-only to the engine. The missing pieces are its machine catalogue, successor execution, and terminal aggregate—not the authority split itself.

## Dispatch round 2 transcripts

### ASHBY ROUND-2 INITIAL — VERBATIM

ROUND-2 INITIAL: **PASS-NO-SUBSTANTIVE-CHANGE**

The auditor found two packaging defects, not a new computational-mechanics contradiction.

- `findings.md` predeclares final-auditor acceptance, while `gap-matrix.json` remains `revised-candidate-awaiting-final-auditor`. Removing the premature verdict changes only review lifecycle status.
- `GAP-002` cites `PROFILE` and `LANES` in Markdown, while the surviving-findings map additionally cites `BTE_PLAN`. The minimal exact evidence set is `PROFILE` + `LANES`; `BTE_PLAN` is corroborating planning evidence, not machine profile authority.

Live evidence remains unchanged:

- `PROFILE`: `0cbc0b58...23e5` — one experimental 4-kind/3-relationship profile only.
- `LANES`: `8fecf7a3...21a3` — 13 backend IDs, but `FPR-02B` remains `decision-in-progress`.
- `BTE_PLAN`: `f005be82...237` — describes the successor as candidate posture and explicitly says its counts are plan expectations, not promoted authority.
- Current review artifacts: `findings.md` `4bd31d1f...3588`; `gap-matrix.json` `98586185...66b`.

Therefore:

- substantive findings: unchanged;
- denominators: unchanged at normative 13 kinds, 16 formation criteria, and 16 selected relationship families, with 21 pairs and 29 scoped variants remaining derived/unselected diagnostics;
- current v1: **KEEP**;
- successor: **BLOCK/FIX** until a versioned machine profile is admitted.

Zero-finding defense: neither premature acceptance prose nor an over-complete evidence-ID list creates a new contract gap. `BTE_PLAN` cannot refute `GAP-002` because it expressly supplies candidate planning intent rather than machine admission.

No files were changed.

### ASHBY ROUND-2 CONVERGENCE — VERBATIM

PASS

### LAWVERE ROUND-2 INITIAL — VERBATIM

ROUND-2 INITIAL: PASS-NO-SUBSTANTIVE-CHANGE, contingent on completing the two bookkeeping repairs.

Evidence:
- findings.md still predeclares final acceptance, contradicting gap-matrix.json status `revised-candidate-awaiting-final-auditor`.
- Removing only the header/verdict block is insufficient: findings.md later also says `final approval: ACCEPT`. This is another occurrence of the same review-state false green, not a new substantive finding.
- GAP-002 Markdown cites PROFILE and LANES, while the surviving-finding map cites PROFILE, LANES, and BTE_PLAN. Adding BTE_PLAN to Markdown is the exact repair; all three live files match catalogued SHA-256 digests.

No substantive result changes:
- Normative denominators remain D_kind=13, D_form=16, D_rel_family=16.
- D_rel_pair=21 and D_rel_scope=29 remain unselected diagnostics.
- Current experimental v1 remains KEEP.
- Successor contract remains BLOCK.
- Surviving-finding count remains 24; matrix geometry remains 53 rows x 12 columns = 636 cells.
- All 49 evidence-catalog digests match current files.

Zero-finding defense: no new denominator error, live-v1 integrity failure, generated-read-model freshness issue, source-containment breach, or dishonest Body War/IOLM completion claim was found. Per-finding verifier dispositions labelled Accepted may remain if clearly distinguished from final-auditor approval.

### LAWVERE ROUND-2 CONVERGENCE — VERBATIM

PASS

### SMITHE ROUND-2 INITIAL — VERBATIM

## ROUND-2 INITIAL — PASS-NO-SUBSTANTIVE-CHANGE

The two auditor objections are valid transcript/reference defects, but correcting them changes no substantive finding, denominator, current-v1 KEEP, or successor BLOCK.

### Exact corrections required

1. **Premature approval claim**

   - `findings.md:3,7-27` claims final acceptance by `Loregian, Fosco`.
   - `gap-matrix.json` still has `status: revised-candidate-awaiting-final-auditor`.
   - No Loregian approval record exists in the three-file review directory.

   Remove the acceptance claim and keep the package in candidate/awaiting-auditor state. This repairs lifecycle provenance only; it does not alter findings.

2. **GAP-002 evidence-set mismatch**

   - `findings.md:68` cites exactly `PROFILE` and `LANES`.
   - `gap-matrix.json::$.surviving_findings.GAP-002.evidence_ids` cites `PROFILE`, `LANES`, and `BTE_PLAN`.

   Formal ownership preference: reduce the matrix set to exactly `["PROFILE", "LANES"]`. Those machine artifacts prove the scoped finding: the supported backend profile remains historical 4/3, while the lane selects 13 type IDs without authoring the successor profile/relationship contract.

   `BTE_PLAN` is Markdown planning explanation. It may remain as contextual evidence only if both artifacts cite it explicitly and label it non-authoritative; it cannot supply missing machine ownership.

### Rechecked digests

- `findings.md`: `4bd31d1f47efc17828b20727e812dc6e956b9589b20c650e70c165cf6c7f3588`
- `gap-matrix.json`: `985861858aeeb54da63137d4a99cdcc08f90471c0ac52c815aeb269b2a7bc66b`
- `attacks.md`: `1f2b7dce997a528e33e6f09d85cce2619a96d1cddc07b2473959208174cb0902`
- `PROFILE`: `0cbc0b58f35b39bd45698d4f19ce4d853e4ae26c6242633df8952e20f81423e5`
- `LANES`: `8fecf7a314b5bec6885800a7fe895a133d3fe40387638a81227f6a2e2f0021a3`
- `BTE_PLAN`: `f005be829df4d498ecd425a476ff171d4e0b9285d73c8a4b41fe36a101fdb237`

The three evidence-source digests exactly match their matrix catalogue entries.

### Substantive disposition unchanged

- `D_kind = 13`
- `D_form = 16`
- `D_rel_family = 16`
- 21 endpoint pairs and 29 scoped variants remain derived, unselected diagnostics.
- Current experimental v1 remains **KEEP** at exact 4-kind/3-relationship, same-feature, non-admitting scope.
- `GAP-002` remains **CRITICAL, successor-only**.
- Successor completeness remains **BLOCK** until machine profile authority and the other surviving proof-chain gaps close.

### Zero-finding defense

- Removing a premature approval assertion does not mutate source semantics, evidence, or matrix cells; it restores the correct approval gate.
- Removing `BTE_PLAN` from GAP-002’s normative evidence set strengthens the machine-authority boundary because Markdown no longer appears to prove machine ownership.
- `PROFILE` and `LANES` remain sufficient for the exact scoped finding.
- No denominator count, KEEP row, surviving finding severity, or successor gate depends on Loregian acceptance text or the extra Markdown reference.

### SMITHE ROUND-2 CONVERGENCE — VERBATIM

PASS

## Round-2 verifier zig-zag transcripts

### CAPUCCI ROUND-2 INITIAL — VERBATIM

ROUND-2 VERIFIER PASS

Zero-finding defense: no new denominator, severity, lifecycle, evidence-set, v1-integrity, authority-boundary, or consumer-completion defect was found. The 24 surviving findings, 13/16/16 normative counts, 21/29 diagnostics, 49 live evidence digests, JSON structure, and scoped diff checks all reconcile.

### CAPUCCI ROUND-2 CONFRONTATION — VERBATIM

AGREE.

Exact corrections:

- `RESOLVER`: replace `resolveMintedProject` with `resolveMintedProjectSources` in `selector`, `verification`, `expected`, and `observed`.
- `EMIT`: replace `emitLegacyTest; emitHybridTest` with `emitTests; emitHybridTests` in the evidence record and GAP-019 prose.
- `CONF_RECEIPT`: replace `buildConformanceReceipt; verifyConformanceReceipt` with `createMintedProjectConformanceReceipt; verifyMintedProjectConformanceReceipt` in `selector`, `verification`, `expected`, and `observed`.

The file digests and substantive finding dispositions remain unchanged; the current selector-existence claims are false until corrected.

### RITTEL ROUND-2 INITIAL — VERBATIM

ROUND-2 VERIFIER FAIL — evidence-selector false-green.

Three catalog records claim selectors were inspected, but the named symbols do not exist:

- `RESOLVER`: `resolveMintedProject` → `resolveMintedProjectSources`
- `EMIT`: `emitLegacyTest; emitHybridTest` → `emitTests; emitHybridTests`
- `CONF_RECEIPT`: `buildConformanceReceipt; verifyConformanceReceipt` → `createMintedProjectConformanceReceipt; verifyMintedProjectConformanceReceipt`

`findings.md` also repeats the invalid `EMIT` selectors in `GAP-019`. Correct those selectors plus their verification/expected/observed text, then rehash and revalidate the matrix.

Zero-finding defense: no new substantive contract gap was found. Lifecycle remains candidate-only; GAP-002 evidence parity is exact; 24 findings survive with forbidden IDs absent; denominators/severities/decisions are stable; all six round-2 attacker labels exist; JSON, 53×12 geometry, mandatory cell metadata, and all 49 file digests pass. The failure is strictly evidence replayability.

### RITTEL ROUND-2 CONFRONTATION — VERBATIM

Capucci and Rittel agree on the exact bookkeeping correction: rename the three invalid evidence selectors to the live exported symbols, update the associated verification/expected/observed strings, correct GAP-019’s EMIT selector text, then rehash and rerun structural/digest validation. This changes no surviving finding, denominator, severity, decision, v1 KEEP, or successor BLOCK disposition.

## Dispatch round 2 compact transcript

| Attacker | ROUND-2 INITIAL disposition | Evidence summary | Convergence |
|---|---|---|---|
| Ashby | `PASS-NO-SUBSTANTIVE-CHANGE` | The auditor found packaging defects only: premature final acceptance conflicts with candidate status, and `GAP-002` needs exact evidence parity. `PROFILE` `0cbc0b58...23e5` remains experimental 4/3, `LANES` `8fecf7a3...21a3` selects 13 IDs with FPR-02B decision-in-progress, and contextual/non-authoritative `BTE_PLAN` `f005be82...237` supplies candidate expectations. Normative 13/16/16, diagnostic 21/29, v1 KEEP, and successor BLOCK are unchanged. Neither lifecycle prose nor evidence-list parity creates a new contract gap. | `PASS` |
| Smithe | `PASS-NO-SUBSTANTIVE-CHANGE` | Remove premature acceptance and repair the exact `GAP-002` evidence-set mismatch. Rechecked review digests were `findings.md` `4bd31d1f...3588`, matrix `98586185...66b`, and `attacks.md` `1f2b7dce...0902`; the three source digests matched Ashby's values. Normative 13/16/16, diagnostic 21/29, v1 KEEP, and successor BLOCK are unchanged. These repairs affect lifecycle/reference integrity only. | `PASS` |
| Lawvere | `PASS-NO-SUBSTANTIVE-CHANGE, contingent on two bookkeeping repairs.` | `findings.md` lines 3 and 182 prematurely asserted final acceptance while the matrix remained a candidate; its `GAP-002` prose omitted `BTE_PLAN` although the machine map included it. All 49 evidence digests matched, the matrix remained 53 rows by 12 columns = 636 cells, and exactly 24 findings survived. No new denominator, v1-integrity, freshness, containment, or consumer-completion false-green was found. | `PASS` |

Round-2 convergence resolution: remove every premature final-auditor assertion;
make `GAP-002` cite `BTE_PLAN` with selectors `Completeness equation; Delivery
boundary` as contextual, non-authoritative planning evidence while `PROFILE` and
`LANES` remain machine evidence; make no substantive change.

## Round-2 post-correction verifier transcripts

### CAPUCCI ROUND-2 POST-CORRECTION INITIAL — VERBATIM

ROUND-2 VERIFIER INITIAL: **PASS**

Exact evidence:

- `findings.md` and `gap-matrix.json` contain exactly the same 24 surviving IDs and evidence arrays; zero mismatches.
- `GAP-003`, `GAP-010`, and `GAP-015` are absent from `surviving_findings`.
- Normative denominators remain exactly 13 kinds, 16 formation criteria, and 16 relationship families.
- The 21 endpoint pairs and 29 scoped variants remain explicitly `derived-unselected`; promotion requires an owner decision.
- Matrix geometry remains 53 rows × 12 columns = 636 cells.
- All 49 evidence-catalog SHA-256 digests match the live files.
- Current v1 remains `KEEP` at experimental 4-kind/3-relationship, same-feature, non-admitting scope.
- Successor completeness remains `BLOCK`.
- Both candidate artifacts remain awaiting final auditor; no premature acceptance assertion survives.
- `GAP-002` now has exact `["PROFILE","LANES","BTE_PLAN"]` parity:
  - `PROFILE` digest `0cbc0b58…23e5`: only historical experimental 4/3 admission.
  - `LANES` digest `8fecf7a3…21a3`: 13 backend IDs, but `FPR-02B` remains `decision-in-progress`.
  - `BTE_PLAN` digest `f005be82…b237`: explicitly says counts are “current-plan expectations, not promoted authority.”
- `findings.md` explicitly assigns machine-authority weight to `PROFILE` and `LANES`, while labeling `BTE_PLAN` contextual and non-authoritative.
- The matrix states that Markdown cannot satisfy a machine semantic-source cell.

Falsification attempt found no category inflation, denominator promotion, machine-authority substitution, v1 scope widening, successor unblocking, finding-list mutation, or lifecycle false-green. The files are untracked, so no Git baseline exists for direct before/after comparison; however, the preserved round-two transcripts identify only the two bookkeeping corrections, and every substantive anchor recorded before them matches the current artifacts.

Zero-finding defense: removing premature approval prose changes lifecycle provenance only, and synchronizing the contextual `BTE_PLAN` reference changes traceability only. Neither correction alters a denominator, finding disposition, severity, scope, evidence digest, KEEP boundary, or BLOCK boundary.

### CAPUCCI ROUND-2 POST-CORRECTION CONVERGENCE — VERBATIM

ROUND-2 VERIFIER CONVERGENCE: PASS

### RITTEL ROUND-2 POST-CORRECTION INITIAL — VERBATIM

ROUND-2 VERIFIER INITIAL: **PASS**

No substantive conclusion changed after the two bookkeeping corrections.

Evidence:

- Exact finding parity: `24/24` surviving IDs match between `findings.md` and `gap-matrix.json`, including ordered `evidence_ids`; dropped `GAP-003`, `GAP-010`, and `GAP-015` are absent.
- `GAP-002` parity is exact: `["PROFILE","LANES","BTE_PLAN"]` in both artifacts.
  - `PROFILE` machine-admits only experimental 4-kind/3-relationship v1.
  - `LANES` selects 13 backend IDs but remains `decision-in-progress`; it does not author the successor relationship/profile contract.
  - `BTE_PLAN` explicitly calls its counts “current-plan expectations, not promoted authority.” `findings.md` labels it contextual/non-authoritative, and the matrix globally states Markdown cannot satisfy a machine semantic-source cell. `chain.successor-profile.semantic_source` remains `missing`. Therefore a conforming reader cannot mistake it for machine authority.
- Matrix geometry: 53 unique rows × 12 exact columns = 636 cells.
  - Statuses: 79 present, 421 missing, 126 deferred, 10 not-applicable.
  - Zero missing/extra columns, duplicate row IDs, invalid statuses, missing metadata, empty evidence arrays, unknown evidence references, or malformed catalogue records.
  - All 136 deferred/N/A cells carry reason, owner, authority reference, promotion condition, and evidence.
- Evidence integrity: all 49/49 catalogued SHA-256 digests match live files.
- Formation-set digest independently recomputes to `5eae864608ba49d51d0cf65048d6c751dc6f9bad0f5fc9c5f2522a34bc441df1`.
- Old manifest reproduction remains exact: 61 entries, 56 matching, five named drifted EVF/BTE planning artifacts.
- Concrete counterexamples still reproduce zero violations:
  - `interface_kind: potato`
  - blank `interface_kind`
  - `direction: sideways`
  - Value Object text “These values are not equal.”
  - Entity satisfying current criteria while omitting required columns
- Current v1 remains **KEEP**: live profile is exactly experimental 4/3, non-admitting, same-feature; `tools:test` passed 143/143 and `engine:test` passed 107/107.
- Successor remains **BLOCK**: matrix successor/graph/catalogue/aggregate/consumer rows remain missing or deferred.
- No current final-auditor acceptance exists. `findings.md` and the matrix both say awaiting final auditor. References in `attacks.md` to the removed acceptance are explicitly preserved round-2 transcript evidence, not approval.

Zero-finding defense: the repairs corrected lifecycle provenance and evidence-list parity only. They changed no denominator, matrix status, severity, v1 proof, successor gate, or consumer claim. No new vacuity, false-green, or authority inflation was found.

No files were changed.

### RITTEL ROUND-2 POST-CORRECTION CONVERGENCE — VERBATIM

ROUND-2 VERIFIER CONVERGENCE: PASS
