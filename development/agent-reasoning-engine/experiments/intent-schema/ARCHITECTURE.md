# Intent-schema experiment architecture

Status: candidate design approved for one bounded private run.

## 1. Context view

The experiment sits between a definition hypothesis and a human schema-selection
gate:

```text
CAV2-D39 Intent + candidate INTENT-RECORD.md
                    |
                    v
       private source-locked local corpus
                    |
                    v
    structural validator + population protocol
                    |
                    v
      descriptive metrics + observed residue
                    |
                    v
 operator + intent-contract owner selection (g6)
```

The experiment reads validated dispatches, scoped Craft ledgers/views, and
Invoke/work-pack artifacts. It writes only to this experiment directory. CAV2
definitions, selected source artifacts, public Arcanum, and the orchestrator
research repository remain read-only.

## 2. High-level structure view

| Component | Responsibility | Does not own |
|---|---|---|
| Corpus selector | Select 12 population and 3 held-out source excerpts by predeclared strata. | Interpretation or field selection. |
| Manifest freezer | Record path, selector, source hash, stratum, assignment, and inclusion reason before interpretation. | Source authority or truth. |
| Candidate schemas | Declare the admissible JSON shape of an intent record and run row. | Semantic necessity, correctness, or promotion. |
| Population procedure | Apply declared/inferred/unresolved rules without convenient defaults. | Schema amendment during the run. |
| Run validator | Parse JSONL, validate row/record shape, and check cross-row/source-lock invariants. | Meaning, approval, or selection. |
| Metrics reducer | Produce descriptive counts/rates from valid rows and observations. | Statistical generalization or causal claims. |
| Result renderer | Report evidence, candidate actions, claim limits, and residue. | The final owner decision. |
| Task Session receipt | Prove the bounded SWU executed and closed. | Promotion or engine readiness. |

## 3. Low-level component view

### Corpus manifest entry

```text
sample_id, assignment, stratum, source_path, selector,
source_sha256, selected_text_sha256, inclusion_reason
```

The selected text is referred to by hash and selector. The manifest may include a
short private excerpt only when needed to make the population auditable.

### Candidate intent record

The full record follows [`../../spec/INTENT-RECORD.md`](../../spec/INTENT-RECORD.md):
record envelope plus seven semantic `FieldValue` entries. Each entry is
`declared`, `inferred`, or `unresolved`.

### Run row

One JSONL row binds:

```text
run_id, sample_id, assignment, stratum, source_lock,
intent_record, observations, candidate_field_actions, validator_status
```

`observations` may name field ambiguity, overlap, output-replacement risk,
source-granularity weakness, or an envelope-mechanics concern. They are bounded
review notes, not automatic schema changes.

### Validator layers

1. Parse exactly one JSON object per non-empty line.
2. Check run-row kinds, required properties, enums, and closed properties.
3. Check nested intent-record/FieldValue structure.
4. Check semantic invariants: seven fields present; declared/inferred evidence;
   inferred note; unresolved null; assignment/stratum/sample IDs agree with the
   manifest; no duplicate sample.
5. Return structured errors with row number, sample, rule ID, and JSON path.

Schema checks remain inspection-only. Reading sources and verifying hashes are
run validation, not schema conformance.

## 4. Workflow process view

```text
preflight
  -> select and freeze 12+3 manifest
  -> validate synthetic pass/fail fixtures
  -> populate 12 records
  -> lock population rules
  -> populate 3 held-out records unchanged
  -> validate complete JSONL against manifest and source hashes
  -> reduce metrics
  -> author RESULT.md and terminal receipt
  -> stop at g6 for owner selection
```

On any blocking failure, the run writes a terminal `block` receipt with partial
evidence and residue. It does not repair the schema mid-run and then relabel the
same holdout as unbiased evidence.

## 5. Decision flow view

| Decision | Owner | Inputs | Allowed result | Effect |
|---|---|---|---|---|
| Is a source entry usable? | Task Session under frozen protocol | concrete path, selector, bytes, stratum | include / replace-before-freeze / block-after-freeze | manifest membership only |
| What posture fits one value? | population procedure | selected source, posture rules | declared / inferred / unresolved | one record value only |
| Is a row structurally admissible? | run validator | schemas and row bytes | pass / fail with rule IDs | structural evidence only |
| Did held-out rules remain frozen? | Task Session validator | protocol hash and run history | pass / block | run eligibility only |
| What does the corpus show? | metrics reducer plus human-readable result | valid rows and observations | bounded descriptive findings | review input only |
| Which fields are selected? | operator + intent-contract owner | result, canonical D39 source, failure consequences, residue | retain / revise / split / reject / unresolved | local candidate schema decision |
| Does any term/schema become canonical? | definitions/schema owner route | separate promotion evidence and gate | owner-specific verdict | outside this run |

Frequency cannot close the field-selection decision. A structurally valid run is
eligible for review, not automatically accepted.

## 6. Dependency interface view

| Dependency | Interface consumed | Pinning | Failure behavior |
|---|---|---|---|
| `CAV2-D39` | semantic field minimum and revision semantics | concrete definition path and heading | block semantic-field removal by experiment alone |
| `CAV2-D56` | shape-only schema boundary | concrete definition path and heading | block any schema-pass authority claim |
| Candidate intent record | field/envelope hypothesis | file SHA-256 at run start | block on drift after manifest freeze |
| Dispatch Technique Catalog | method vocabulary and validation expectations | concrete catalog path | flag unused decoration; block owner/boundary contradiction |
| Selected source artifacts | local paths and selectors | file and excerpt SHA-256 | block on missing/drifted post-freeze source |
| JSON runtime | ECMAScript module execution | local `node` executable | block if validator cannot run |
| Task Session | one bounded SWU and terminal receipt | installed skill contract | block on missing terminal result |

No network service, external model call, or public write is required.

## Design decisions

1. **JSONL is the run authority surface.** It provides one reviewable row per
   source unit and supports deterministic validation. Markdown is a derived
   explanation.
2. **The holdout is procedural, not statistical.** Three rows test whether rules
   survive unseen local examples; they do not estimate universal generalization.
3. **Unresolved is admissible.** Missing semantic support remains visible rather
   than forcing a default or making sparse artifacts structurally invalid.
4. **Field action is advisory until g6.** Rows may propose candidate actions, but
   the result cannot record selected schema actions without owner approval.
5. **One population author is acceptable for the quick run.** The purpose is
   schema pressure discovery, not inter-rater reliability. Ambiguous values are
   surfaced as observations and residue rather than disguised as agreement.

## Risks and failure behavior

| Risk | Control | Remaining residue |
|---|---|---|
| Sampling only rich, recent artifacts | fixed strata and inclusion reasons | small local corpus remains non-representative |
| Author infers fields to make schema look complete | posture rules, evidence refs, explicit null unresolved | interpretation remains human-authored |
| Schema overfits synthetic fixtures | live 12+3 sources and unchanged holdout rules | one run cannot prove robustness |
| Canonical fields appear redundant in sparse sources | unique-question and failure-consequence review | owner must distinguish sparse evidence from semantic redundancy |
| Validator success is overclaimed | claim boundary and shape-only language | semantic review remains manual |

## Glossary consistency

`intent`, `schema`, `authority`, `provenance`, `traceability`, `gate`, and
`claim <= proof` retain their linked CAV2 meanings. `intent record`, `FieldValue`,
`run row`, and `candidate field action` remain local experiment handles. No
conflict or upstream patch request is introduced by this design.

## Design technique trace and Distill

- `sequence` fixes the order from manifest to selection gate.
- `minimum_component_catalog` and `component_descriptor` shape the row records.
- `validation_rule_catalog` keeps schemas separate from run invariants.
- `validation_loop` requires synthetic and live passes.
- `state_namespace_boundary` confines writes.
- `owner_boundary_check` and `approval_semantics_map` reserve selection for g6.
- `concrete_path_evidence` makes every sample auditable.
- `residue_ledger` keeps ambiguity and missingness visible.

Distill design-unit verdict: **pass**. The six views describe one coherent unit:
freeze a 12+3 corpus, populate one candidate shape under fixed rules, validate,
reduce bounded metrics, and stop before human selection. Source-selection,
mechanics, population, and selection responsibilities remain separable without
splitting the experiment into independent claims.

Next route: Invoke plan for one live-data SWU.
