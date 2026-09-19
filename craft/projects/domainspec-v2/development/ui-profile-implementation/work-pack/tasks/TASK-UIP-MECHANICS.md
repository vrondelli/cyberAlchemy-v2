---
task_id: TASK-UIP-MECHANICS
feature_code: UIP
layer: L1
status: complete
---

# TASK-UIP-MECHANICS: Formation Contracts And Synthetic Calibration

## SWU-UIP-002 — Port Formation And Placement Contracts

- Goal: move the already-tested candidate and repair semantics into an
  implementation-owned development profile surface.
- Dependencies: SWU-UIP-001.
- Source anchors: nine candidate cards/schemas; UI repair nonempty contract and
  68/68 integrated audit; representation registry.
- Write scope:
  - `projects/domainspec-v2/impl/spec/meta-types/ui/`
  - `projects/domainspec-v2/impl/spec/ui-profile/concepts/`
  - only required `validate-content`, instance, and noncollapse helpers/tests
  - `runs/SWU-UIP-002/`

### Algorithm

1. Port Page through Binding human/machine twins without changing their bounded
   laws.
2. Replace presence-only semantics with the tested nonempty rule for every
   meaningful textual/list criterion.
3. Implement Adapter as a Mapping specialization contract, not a duplicate
   formation schema.
4. Implement the two State Indicator branches as projection/role contracts.
5. Add total validator support, instance generation, targeted mutation, and
   pairwise noncollapse checks.
6. Preserve every unsupported DS-D8 endpoint as residue rather than inventing a
   relationship.

### Failure Modes

- Empty/whitespace acceptance, unknown rule kind, schema/card drift, alias
  emitted as a new node kind, or split collapsed back to one concept: block.

### Done And Validation

- Nine node twins and two placement contracts validate and round-trip.
- Empty, whitespace, missing, wrong-fixed, and nearest-neighbor mutations reject.

```bash
cd projects/domainspec-v2/impl
npm run tools:test
npm run instances:generate
npm run instances:validate
tsx tools/validate-meta-types-noncollapse.ts --report
```

## SWU-UIP-003 — Synthetic Create Player Calibration Corpus

- Goal: create one complete, explicitly synthetic specimen set that exercises
  all eleven concepts or normalized representations.
- Dependencies: SWU-UIP-002.
- Source anchors: Create Player examples in candidate cards; `ARCHITECTURE.md`;
  the six required fixture classes in `UI-PROFILE-DESIGN.json`.
- Write scope:
  - `projects/domainspec-v2/impl/spec/ui-profile/fixtures/create-player/`
  - focused synthetic-corpus tests
  - `runs/SWU-UIP-003/`

### Algorithm

1. Freeze a manifest with `corpus_kind=synthetic-calibration` and generator
   provenance.
2. Materialize positive instances for all eleven profile concepts.
3. For each concept, materialize nearest-neighbor, malformed, label-erased,
   criterion-erased, and changed-consequence variants.
4. Run each variant through the same profile/formation validator.
5. Emit a total matrix of expected versus actual results and stable codes.

### Failure Modes

- Missing fixture class, evidence pooled between concepts, label-derived
  witness, or synthetic specimen labeled real/independent: block.

### Done And Validation

- Census is 11 concepts x 6 fixture classes with no missing cells.
- Positives construct and all intended negatives discriminate.

```bash
cd projects/domainspec-v2/impl
node --import tsx --test tools/tests/ui-profile-synthetic.test.ts
tsx tools/validate-ui-profile.ts --fixtures spec/ui-profile/fixtures/create-player
```

- Execution owner for both SWUs: sequential local Task Session.
- Context Builder anchors: this task, UI repair contract kernel, candidate index,
  representation registry, and exact target validator symbols.
- Expected receipt: files, fixture census, commands/results, authority diff,
  residue, and next-SWU handoff.
