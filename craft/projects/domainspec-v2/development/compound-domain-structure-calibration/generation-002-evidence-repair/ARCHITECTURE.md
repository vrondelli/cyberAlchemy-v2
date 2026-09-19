---
artifact_id: CDSC2-ARCH-v0.1
status: approved-planning-baseline
authority: development only
source_spec: SPEC.md
---

# Generation 2 Evidence Repair Architecture

## 1. Context View

```text
immutable generation 1 -----------------------------+
       |                                             |
       | stable handles                              | predecessor
       v                                             v
F1/F2 accepted results     generation-2 evidence-repair package
                                      |
Savvy pinned selectors --read-only--> isolated harness
                                      |
                                      v
                           M1 and M2 observation receipts
                                      |
                                      v
                              repaired F3 receipt
                                      |
                                      v
                         successor evaluation and audit
```

Savvy, GoldenQuill, DS-D1, DS-D8, architecture-pattern governance, and
candidate/promotion owners remain external and read-only.

## 2. High-Level Structure View

```text
frozen schemas ----------> schema-parity preflight
                                     |
source pins -> harness manifest -> baseline-equivalence gate
                                     |
                         +-----------+-----------+
                         |                       |
                         v                       v
                    M1 permitted            M2 breaking
                    observation             observation
                         |                       |
                         +-----------+-----------+
                                     v
                              F3 receipt v2
                                     |
F1 result handle --------------------+
F2 result handle --------------------+--> successor suite runner
                                              |
                                              v
                                   append-only generation index
                                              |
                                              v
                                      independent replay/audit
```

## 3. Low-Level Components View

| Component | Inputs | Outputs | Fail-closed behavior |
| --- | --- | --- | --- |
| parity preflight | evidence receipt and frozen receipt schema | accepted receipt or enum error | reject unknown kind/class before evaluation |
| successor wrapper | three fixture results, generation-1 predecessor, replay state | suite envelope with predecessor | reject null/wrong predecessor or unstable handles |
| harness manifest | source selectors/digests, vectors, mutation definitions | frozen generation-2 experiment manifest | block on source drift or incomplete protocol |
| baseline adapter | source-derived navigation/screen model | deterministic baseline observations | block mutations unless all vectors match |
| M1 mutator | baseline screen registry and step-9 adapter | permitted mutation variant | mutation cannot alter guard/navigation implementation |
| M2 mutator | baseline navigation commit | guard-bypass variant | mutation cannot alter screen registry or vectors |
| run recorder | manifest, harness digest, vector outputs | immutable observation receipt | indeterminate on missing/conflicting output |
| F3 receipt builder | parent F3 receipt plus M1/M2 handles | new reviewed F3 receipt | preserve untested/refuted states; do not infer support |
| generation-2 evaluator | F3 v2 receipt plus stable F1/F2 result handles | F3 result and successor suite result | preserve parent outcome ordering |
| appender | predecessor and result handles | second index entry | reject rewrite, duplicate, or predecessor conflict |
| replay auditor | frozen generation-2 inputs | equivalence and authority report | fail on drift or claim leakage |

## 4. Workflow Process View

1. Verify generation-1 bytes and handles before any generation-2 write.
2. Load enum sets from the frozen evidence-receipt schema.
3. Validate parity with positive generation-1 receipts and negative drift
   vectors.
4. Freeze source selectors, digests, baseline vectors, observable fields, and
   both mutation definitions.
5. Build the isolated harness and prove baseline equivalence.
6. Execute M1 and record every vector plus preserving consequence state.
7. Execute M2 and record every vector plus breaking consequence state.
8. Review the two receipts and build a new F3 evidence receipt without changing
   its explanation set after observation.
9. Evaluate F3 and compose the successor suite from stable F1/F2 result handles.
10. Append exactly one generation-index entry whose predecessor is generation 1.
11. Replay in a fresh process and compare semantic bytes and handles.
12. Audit source boundaries, uncertainty, and prohibited inferences; route the
    bounded verdict.

## 5. Decision Flow View

### Observation Admission

```text
source digests match? --------no------> BLOCK
        |
       yes
        v
baseline vectors equivalent? -no------> BLOCK
        |
       yes
        v
mutation output total? -------no------> INDETERMINATE
        |
       yes
        v
predicted consequence seen? --yes-----> SUPPORTED
        |
       no
        v
opposite consequence seen? ---yes-----> REFUTED
        |
       no
        v
                              INDETERMINATE
```

### Generation 2

```text
parity + harness gates pass? --no--> BLOCK APPEND
        |
       yes
        v
F3 v2 valid and reviewed? ----no--> INSUFFICIENT / BLOCK
        |
       yes
        v
evaluate F3 with parent table
        |
        v
join stable F1/F2 + new F3
        |
        v
classify suite -> append successor -> independent replay
```

No branch creates a type, pattern, candidate, or promotion action.

## 6. Dependency Interface View

| Boundary | Contract | Violation response |
| --- | --- | --- |
| Invoke -> Task Session | execute one selected SWU and return the declared receipt | block execution |
| generation 2 -> generation 1 | read immutable handles/bytes; append successor only | block and discard run |
| package -> Savvy | read pinned selectors/digests; no source write | block and discard run |
| source -> harness | admit only declared decisions/observables after baseline equivalence | block mutation evidence |
| M1 -> M2 | disjoint mutant and result directories; shared frozen baseline only | reject overlapping write |
| observations -> reviewer | receipts report outputs; reviewer cannot change run data | disputed/indeterminate |
| reviewer -> evaluator | one frozen F3 receipt; evaluator invents nothing | invalid input |
| suite -> index | predecessor must equal generation-1 suite generation ID | predecessor-conflict |
| result -> governance | evidence-only route; no automatic authority mutation | owner gate required |

## Data Contracts

### Harness Manifest

```text
schema_version, parent_generation_id, source_selectors[], source_digests[],
harness_digest, baseline_vectors[], observable_fields[], mutations[],
prohibited_inferences[]
```

Each mutation includes `mutation_id`, `kind`, `target`, `allowed_edit_surface`,
`prediction`, `vectors`, `observables`, and `stop_conditions`.

### Observation Receipt

```text
schema_version, mutation_id, manifest_handle, harness_handle,
baseline_witness_handle, vector_results[], observation_state,
predicted_consequence, observed_consequence, uncertainty[], content_digest
```

### Successor Suite Input

```text
fixture_result_handles[3], predecessor_generation_id,
control_fixture_id=F2, replay_state, prohibited_inferences[]
```

## Algorithms

### Parity Preflight

```text
load allowed explanation kinds and observable classes from frozen schema
run parent structural and envelope validation
for each A item: reject kind outside allowed explanation kinds
for each Q item: reject class outside allowed observable classes
return accepted receipt without mutation
```

### Baseline Equivalence

```text
for each frozen vector:
  evaluate source-derived expected decision
  evaluate unmutated harness decision
  compare only declared observable fields
if any mismatch or missing field:
  block mutation execution
else:
  freeze baseline witness handle
```

### M1

```text
clone frozen baseline model
replace only step-9 adapter implementation
assert adapter exposes onNext and onBack
run frozen step-9 vectors
compare committed step, screen key, next/back destinations, guard, notice
classify supported/refuted/indeterminate from total results
```

### M2

```text
clone frozen baseline model
replace only navigation commit target:
  baseline = guardStep(requested, session).step
  mutant = requested
run unauthenticated and premature-access vectors
compare allowed flag, committed step, and notice
require at least one baseline redirect that mutant bypasses for support
classify supported/refuted/indeterminate from total results
```

### Successor Append

```text
assert parent index contains exactly generation 1 as current tail
validate F1/F2 stored results and new F3 result
build suite semantic result using parent decision table
build envelope with predecessor_generation_id = generation 1
append one index entry atomically
rerun from frozen inputs and compare canonical semantic bytes
```

## Risks And Controls

- **Harness overclaim:** observables are enumerated; visual and framework
  behavior are excluded.
- **Model drift:** source digests and baseline vectors gate every mutation.
- **Mutant leakage:** each mutant has an allowed edit surface and disjoint copy.
- **Generation rewrite:** byte snapshots and predecessor checks protect
  generation 1.
- **Outcome steering:** mutation states may be supported, refuted, or
  indeterminate; the reviewer cannot edit outputs.
- **Schema drift:** parity preflight loads enums from the frozen schema and has
  explicit rejection vectors.
- **Identity leakage:** prohibited-inference contracts and final scan remain
  mandatory.

## Alternatives Rejected

| Alternative | Reason rejected |
| --- | --- |
| mutate the live Savvy checkout | violates the established source boundary |
| run only static reasoning again | cannot repair an unobserved mutation consequence |
| rewrite generation-1 F3 receipt | violates append-only evidence and generation identity |
| broaden to browser visual tests now | exceeds the specific missing evidence and adds framework claims |
| add more fixtures before closing F3 | portability work is downstream of a non-deferred calibration |
| change the residual rubric | generation 1 deferred for evidence, not a demonstrated method defect |
