# Contract-completeness audit 002 — attacker returns

Status: candidate writer synthesis; awaiting independent verification and coverage audit
Dispatch: `2026-07-20-evf-contract-completeness-audit-002`
Authority: non-authority review evidence
Canonical target: `projects/domainspec-v2/`

CyberAlchemy, IOLM, and Body War are downstream consumers. Their artifacts may
witness consumption but cannot supply DomainSpec language or formation authority.

## Frozen-corpus integrity

- Freeze SHA-256: `651b1eca9103662902e76fb5230d43606bb9cb9e9ee7ac1a4923dce22b9704c9`.
- Catalog: 53 entries over 52 unique paths.
- All 53 entries matched their frozen hashes at attacker entry and exit.
- Opening drift: 0. Closing drift: 0. No attacker wrote to the target.
- The target did not drift, but the frozen catalog has two selector defects:
  - `META_BODY_ADAPTER` names nonexistent `normalizeMintedNodeBody`; the live
    export is `mintedNodeBodyToCriterionSubject` alongside
    `validateMintedNodeFormation`.
  - `COMPILER` names removed `loadAttributeCriteria`; the live path is
    `validateFormation` -> `validateMintedNodeFormation`.

These are audit-traceability failures in the freeze, not target drift. Frozen
hashes must remain unchanged until verifier-directed repair.

## Ashby — computational causality and counter-example

**Exact returned label: `ATTACKER VERDICT: REJECT`.**

Ashby found that the narrow old `GAP-009` allegation is fixed: the compiler no
longer owns a duplicate limited evaluator. It calls
`validateMintedNodeFormation`, which calls the shared `evaluateCriteria`
kernel.

Ashby rejected completeness because the compiler ignores profile-declared
`formation_schemas`, suppresses base node-schema violations below `$.body`, and
does not prove every exact formation criterion through compilation. Ashby's
concrete Entity witness was:

```json
{"fields":[{"type":"string","identity":true}]}
```

The profile-declared JSON formation rejects this body because `name` is
missing, while the adapter reports no criterion violation. The raw body enters
the graph and later build verification does not recheck formation.

Ashby's executed end-to-end witness produced:

- compiled graph: 4 nodes and 3 edges;
- `deriveFeature()` obligations from the same machine-source root: 0;
- emitted suite: empty;
- build status: `pass`.

Ashby retained `GAP-005`, `GAP-006`, `GAP-007`, `GAP-008`, and `GAP-016`
through `GAP-027` and required the old blanket `chain.current-v1: KEEP` verdict
to be withdrawn.

## Smithe — formal ownership and definition

**Exact returned labels: `SMITHE INITIAL: FAIL`; `SMITHE ROBOT-TALK: PASS`.**

Smithe classified the nonexistent `normalizeMintedNodeBody` selector as a
**CRITICAL audit-traceability defect**. Smithe closed the narrow duplicate
evaluator allegation as `FIXED-IN-FROZEN-WORKTREE`, while retaining successor
formation parity as a separate critical gap.

Smithe located the split ownership precisely:

- profile mapping owner: `supported-profiles.yml::$.profiles[0].formation_schemas`;
- JSON record-form owner: `node.schema.json::$.allOf` and
  `formations/*.schema.json`;
- semantic criterion owner: meta-type YAML `required_structure` and `criterion`;
- runtime path: `compiler.ts::validateFormation`;
- violation deletion: `compiler.ts::nonFormationViolations`.

Smithe's stronger Entity witness was:

```json
{
  "fields": [
    {"type": 7, "identity": "yes"}
  ]
}
```

The current profile's JSON formation rejects the missing `name`, non-string
`type`, and non-boolean `identity`. The adapter treats `7` as nonempty typedness
and `"yes"` as a truthy identity marker. No frozen machine decision authorizes
the YAML route to repeal the profile's JSON formation route.

Smithe also found that formation schema identity, criterion identity, kernel
identity, and adapter identity do not survive into graph and receipt evidence.
The adapter can compare `expectedSchemaSha256`, but the compiler does not
supply one. `required_structure` is loaded but not evaluated.

## Lawvere — adversarial completeness and vacuity

**Exact returned label: `Audit return — Lawvere lane (no explicit PASS/REJECT label in returned text)`.**

Lawvere independently closed old `GAP-009` through the exact runtime path:

`compiler.ts:185-197` -> `validateMintedNodeFormation` ->
`meta-type-body-adapter.ts:174-230` -> shared `evaluateCriteria` at
`meta-type-criteria.ts:278-291`.

Lawvere rated exact-16 compiler parity **MAJOR**, while Ashby and Smithe treated
it as **CRITICAL for successor completeness**. The shared kernel inventory
counts 13 backend kinds and 16 criteria, adapter tests sample the eight rule
forms, and compiler integration remains bounded to the current four-kind
profile. No compiler-level positive plus discriminating-negative proof exists
for all 16 exact criterion IDs.

Lawvere reproduced these false-green or vacuity witnesses:

- Entity `{fields:[{type:'string',identity:true}]}` passes the adapter despite
  missing `required_structure.name`;
- Interface `interface_kind: null` passes presence-only admission;
- binding `match: {}` can select an arbitrary obligation by first match;
- different ruleset identities A and B produce the same output;
- `deriveFeature` emission may produce `todo`/`skip` rather than executed proof;
- compilation yields 4 nodes/3 edges while derivation yields 0 obligations, an
  empty suite, and a passing build receipt.

Lawvere retained the current-profile JSON formation bypass as **CRITICAL**, the
digest/replay and independent-denominator gaps as **CRITICAL**, and consumer
lanes as downstream evidence only.

## Attacker robot-talk convergence

All three attackers converged on these propositions:

1. The narrow old `GAP-009` duplicate-evaluator allegation is fixed and must
   not survive verbatim.
2. Exact-16 compiler parity remains open as a separate finding.
3. The current-v1 split between declared JSON formation authority and executed
   YAML criteria is a separate critical regression.
4. Formation, criterion, kernel, and adapter identities do not reach graph and
   receipt evidence.
5. `required_structure` is not enforced by the shared criterion call.
6. The graph does not yet cause the complete obligation -> binding -> evaluator
   -> executable test -> result -> replayable receipt chain.
7. Markdown, fixtures, tests, graphs, receipts, IOLM, and Body War cannot repair
   missing DomainSpec authority.

The only material severity disagreement is exact-16 parity: Lawvere returned
MAJOR; Ashby and Smithe returned CRITICAL for the successor completeness claim.
The writer carries **CRITICAL** as the candidate severity because the selected
successor denominator is exactly 16 and admission requires every exact item.

## Verifier feedback round 1 — exact returns

### Capucci

> CAPUCCI VERIFIER INITIAL: CORRECTIONS REQUIRED (read-only). Opening freeze check PASS: all 53 entries/52 unique paths match; corpus-freeze sha256 = 651b1eca9103662902e76fb5230d43606bb9cb9e9ee7ac1a4923dce22b9704c9. Exact repairs before convergence: (1) gap-matrix.json is not a complete matrix: it has 0 `.rows` versus the prior 53-row structure (13 required_structure + 16 formation criteria + 16 relationship families + 8 chain/catalogue/aggregate/consumer/EVF rows). Restore all rows/cells and update every compiler/adapter-affected cell; summary arrays cannot replace cell-level parity. In particular old duplicate-evaluator reasons must be removed; only Operation:writes_state has exact compiler-level diagnostic proof, adapter coverage is 8 representative criteria/rule forms, and the other exact-16 compiler cells remain unproven. (2) GAP-029 is not evidence-complete in the frozen 53 items. Its exact Entity counterexample depends on `impl/spec/minted-project/node.schema.json` and `formations/entity-body.schema.json`, but neither has a direct frozen evidence ID (NODE only appears transitively in OLD; ENTITY_BODY is absent). Current GAP-029 evidence IDs omit both. Either verifier-directed re-freeze/add exact evidence with explicit provenance and update freeze digest/counts, or narrow/remove the exact JSON rejection claim. Do not silently widen. (3) GAP-028 must be repaired, not waived: change COMPILER selector from removed `loadAttributeCriteria` to `validateFormation -> validateMintedNodeFormation`; change META_BODY_ADAPTER selector from nonexistent `normalizeMintedNodeBody` to `mintedNodeBodyToCriterionSubject; validateMintedNodeFormation`. Preserve all source hashes and record selector-only verifier repair/new freeze-file digest. (4) Authority inflation: `claim_boundary.normative_counts` conflates layers and contradicts GAP-002 plus BTE_PLAN's literal 'current-plan expectations, not promoted authority'. Record 13 schema kinds/16 criteria as canonical machine-schema inventory; record 16 relationship families as selected candidate/planning denominator not admitted profile machine authority; keep 21 endpoint pairs/29 endpoint+scope variants derived/unselected. Findings GAP-004 must not call 16 machine-normative while owner admission is still missing. (5) Preserve narrow current-v1 facts: GAP-029 blocks the formation-contract/e2e chain, not the still-true 4-kind/3-relation declaration, cross-feature rejection, deterministic views, or honest non-admission. Restore cell-level chain.current-v1 with the formation/schema-validation cells BLOCK/missing and unaffected subclaims retained; do not turn aggregate BLOCK into a claim that every old KEEP fact was refuted. (6) Evidence parity repairs: GAP-006 must cite all 13 SCHEMA_* evidence IDs in addition to META_CRITERIA/INST; GAP-030 exact-16 identity claim must cite the 13 schemas (or an exact-ID machine catalogue), KERNEL/META_CRITERIA_TEST, adapter test, compiler test, profile. (7) `executed_trace` has no evidence_ids or preserved command/output/fixture digest; either add a durable reproducible transcript within the audit evidence boundary or label it attacker-reported/unverified and do not use it as direct proof. No implementation/release promotion observed; consumer and Markdown non-authority prose is otherwise correctly stated.

### Rittel

> RITTEL INITIAL: CORRECTIONS REQUIRED.
>
> All 53 frozen entries matched at entry and exit; freeze SHA remained `651b1eca9103662902e76fb5230d43606bb9cb9e9ee7ac1a4923dce22b9704c9`.
>
> Required corrections:
>
> - Expand `GAP-028`: several test and document selectors are descriptive shorthand, not literal or machine-addressable selectors. The two named symbol defects are not the complete selector-defect set.
> - Expand `GAP-025`: the IOLM contract requires checks absent from the receipt schema, notably `graph_hierarchy_table_get_parity`. A schema-valid receipt can still consist entirely of self-asserted pass values and invented digest-shaped handles because no runner or replay exists.
> - Strengthen `GAP-027`: Body War’s fixture explicitly names a Markdown `SPEC.md` as `source_contract`, violating the machine-source boundary in addition to lacking a schema, runner, and receipt.
>
> Reproduced false greens:
>
> - JSON-invalid Entity body passes YAML formation.
> - Null Interface and Mapping discriminators pass.
> - Compiler tests exercise only `Operation:writes_state`, not all 16 criteria.
> - A 4-node/3-edge graph yields zero obligations, an empty suite, and a passing build.
> - Empty binding match selects the first arbitrary binding.
> - Emission permits `todo` and `skip`.
> - Existing receipts do not join the exact source → obligation → binding → evaluator → test → execution chain.
>
> Matrix parity otherwise holds: 25 surviving and 5 non-surviving findings, valid evidence IDs, all chain verdicts `BLOCK`, and no final acceptance claim.

## Writer repair validation

- The original `corpus-freeze.json` remains unchanged and all 53 source hashes
  still match.
- `corpus-freeze.corrected.json` is a verifier-directed overlay with ten typed,
  addressable selector repairs and two direct schema additions; its SHA-256 is
  `dc57b36c85c27336bb08224f2eadada1f6f192ed57e2083f31fc6173bec02ae1`.
- `gap-matrix.json` contains 53 rows and 12 columns: 13
  `kind_required_structure`, 16 `formation_criterion`, 16
  `relationship_family`, and 8 chain/catalogue/aggregate/consumer/EVF rows.
- Every row has all 12 cells, and every cell retains `status`, `reason`,
  `owner`, `authority_ref`, `promotion_condition`, and `evidence`.
- No cell retains the old duplicate/limited-evaluator reason. Only
  `Operation:writes_state` is `present` for exact compiler preservation; the
  other 15 criterion cells remain `missing` at that boundary.
- The reported 4-node/3-edge trace is explicitly marked
  attacker-reported/unverified and excluded from direct proof.
- JSON parsing, evidence-ID closure, all repaired selector checks, source-hash
  checks, and `git diff --check` passed after this append. No final acceptance
  is claimed.

## Verifier feedback round 2 — exact returns

### Capucci preliminary

> CAPUCCI ROUND-2: CORRECTIONS REQUIRED. Base 53/53 hashes PASS; additions 2/2 PASS; base freeze SHA-256 `651b1eca9103662902e76fb5230d43606bb9cb9e9ee7ac1a4923dce22b9704c9` and overlay SHA-256 `dc57b36c85c27336bb08224f2eadada1f6f192ed57e2083f31fc6173bec02ae1` match. All 10 repaired selectors resolve literally. The matrix is 53×12 with row types 13+16+16+8, unique row IDs, zero missing cell metadata, and no unresolved evidence IDs. Only `Operation:writes_state` has `compiler_preservation: present`; no cell retains the old duplicate/limited-evaluator reason. GAP-029, GAP-006, GAP-025, GAP-027, GAP-030, and narrow current-v1 repairs substantively pass. Exact remaining corrections: (1) every `relationship_family` row still has `normative_set: D_rel_family`, and `completeness_rule` still says `every normative row`, contradicting the corrected top-level and findings statement that the 16 relationship families are a selected candidate/planning denominator, not admitted profile authority. Rename the relationship-row field to `candidate_planning_set` (or equally explicit non-authority label) and make the completeness rule selection-neutral; preserve D_form/D_kind as machine-schema inventory rather than flattening authority layers. (2) The effective `gap-matrix.json::evidence_catalog` has corrected selector objects but retains stale `verification` instructions for `OLD`, `COMPILER`, and `GCP_DEC`; `COMPILER.verification` still instructs inspection of nonexistent `loadAttributeCriteria`. Rewrite those effective verification strings to the corrected selectors. Retain superseded text only in `freeze.selector_defects[].old_selector`. (3) After both verifiers converge, transition `GAP-028` and `freeze.selector_integrity` from open/awaiting-verifier-convergence to repaired/fixed before final coverage audit; the verified overlay cannot coexist with a final claim that selector traceability remains unresolved.

### Rittel comparison

> RITTEL ROUND-2: CORRECTIONS REQUIRED; I concur with both Capucci residuals after direct inspection.
>
> A — relationship authority label: all 16 relationship rows still carry `normative_set: D_rel_family`, while top-level `completeness_rule` says every normative row must close. This contradicts `claim_boundary.relationship_coverage.status = selected-candidate-planning-denominator-not-admitted-profile-authority` and findings GAP-004. Exact repair: rename that field on all 16 rows to `candidate_planning_set` (or equivalent non-authority label), and make `completeness_rule` selection-neutral / explicit that 13 kinds + 16 criteria are canonical schema inventory while 16 relationship families are selected planning coverage pending admission. Preserve 53 rows and 12 columns.
>
> B — stale effective verification instructions: `evidence_catalog.OLD.verification` still says inspect `$.entries and live digest comparison`; `COMPILER.verification` still instructs inspection of nonexistent `loadAttributeCriteria`; `GCP_DEC.verification` still says inspect summary `Options 1, 2, 3`. Exact repair: add corrected verification metadata to those overlay repair records and apply selector+verification into the effective matrix catalogue; preserve old text only as `old_selector`/defect history. Updating matrix alone would break the currently exact overlay-to-matrix parity.
>
> No other residual found in the targeted round-2 audit. Repaired work otherwise passes: base 53 and both added schema hashes match; base freeze SHA 651b1...9704c9; overlay SHA dc57b3...02ae1; all 10 corrected selectors resolve; effective catalogue equals matrix exactly at 55 IDs; 53 unique rows × 12 columns = 636 cells; every cell has the six required fields and an allowed status; all cell/finding evidence IDs resolve; NODE_SCHEMA and ENTITY_BODY_SCHEMA directly support GAP-029; current-v1 narrow KEEP facts are preserved; only Operation:writes_state has compiler-preservation `present`; no cell retains old duplicate-evaluator allegation; IOLM/Body War corrections are present. False greens were reproduced again: JSON-invalid/YAML-valid Entity, missing required_structure, null Interface/Mapping, Value Object `unequal` substring acceptance, 4-node/3-edge -> 0 obligations/empty suite/build pass, empty-match first binding, todo/skip paths. Final exit hash sweep: 53+2, zero drift. No writes.

## Writer round-2 repair validation

- All 16 relationship rows use `candidate_planning_set: D_rel_family`; none
  retains `normative_set`. The selection-neutral completeness rule distinguishes
  canonical schema inventory from candidate relationship planning coverage and
  preserves the derived/unselected 21/29 diagnostics.
- `corpus-freeze.corrected.json` now contains the complete 55-entry effective
  evidence catalog with repaired selector and verification metadata. It exactly
  equals `gap-matrix.json::evidence_catalog`.
- The final round-2 corrected-overlay SHA-256 is
  `d96ab368925ff5a9d0072f7f4bb4c93e113d0a28b7b98694ea021fa4e1f1f517`;
  the original base freeze remains
  `651b1eca9103662902e76fb5230d43606bb9cb9e9ee7ac1a4923dce22b9704c9`.
- `GAP-028` and selector integrity are `repaired-fixed`; stale strings survive
  only in the historical `old_selector` fields.
- Every selector-repair record carries its corrected verification instruction;
  there is no overlay-to-effective-catalog verification asymmetry.
- No final acceptance is claimed; the independent coverage auditor still owns
  the terminal review verdict.

## Durable verifier convergence

`Capucci, Matteo — ROUND-2 VERIFIER CONVERGENCE: PASS`

`Rittel, Horst — ROUND-2 VERIFIER CONVERGENCE: PASS`

Both convergence records were independently returned after the repaired
matrix/freeze checks. They close verifier convergence only; they do not claim
final auditor acceptance.
