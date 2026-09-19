---
node_type: work-pack
is_session: false
status: candidate
created: 2026-07-02
authored_by: invoke (mode: plan)
define: ./DEFINE.md
design: ./DESIGN.md
implementation_layering: ./implementation-layering.md
output_mode: single-file
complexity: medium
---

# Work-Pack — Spec Comprehension Model (M1–M4)

**SWU manifest.** Order after SWU-B0 is **data-decided** by Package A's `stall-dataset.md`; the rows below
are written in the *expected* order and re-sequenced at L0. Each SWU is one parent task with a write scope,
acceptance evidence, and a verification command / reviewable check.

| SWU | Move | Write scope | Acceptance evidence | Verification |
| --- | --- | --- | --- | --- |
| **SWU-B0** | L0 intake | `spec-comprehension-model/ORDER.md` | Package A's stalls mapped to M1–M4; move order = descending freq×severity; top stall names L1 | `ORDER.md` cites the dataset rows; order justified by rank |
| **SWU-B-M2** | M2 (author nothing) | `impl/spec/meta-types/**/<type>.md` (9 cards), `impl/spec/TAXONOMY.md` (delete redundant rows) | each of the 9 crossed cards has a `## Discriminating pair` referencing its `__fixtures__` pair + the schema `distinguisher.rule`; redundant Common-Confusion rows removed (kept rows justified) | `npm run validate:*` + `tools:test` green (fixtures unmoved); A re-run: `discrimination` stalls for the 9 drop |
| **SWU-B-M1** | M1 | `impl/spec/meta-types/LEARNING-ORDER.md`, optional `tier:` in 14 `.schema.yml` | 25 tiered core/supporting/generic; declarable `tier:`; the 5 shadows dictionaried WITH their edges noted; ~8-relation edge view | schema validator green (new optional field); A re-run: `selection`+`vocabulary`+`edge` stalls drop |
| **SWU-B-M3** | M3 (the build) | `impl/spec/__fixtures__/mt/{event,state-machine,enum}-bad.md` (rewrite), `{interface,mapping}.md` (mark) | Event/State-Machine/Enum bad-fixtures become genuine class-flips landing on the sibling's `-ok` shape; Interface/Mapping cards marked attribute-distinguished with the schema axis | each upgraded fixture: positive passes / negative rejected (`tools:test`); A re-run: `discrimination` stalls for the 5 drop |
| **SWU-B-M4** | M4 | `research/target-state/TEMPLATE.md` + one authored target-state | template has a buildable-narrative paragraph + an oracle-by-example (DONE + NOT-DONE near-miss); one real target-state authored with it | the oracle discriminates DONE/NOT-DONE on the example; A re-run: `target-state` stall drops |

**Per-layer planning slices (medium complexity):** L0 = SWU-B0 · L1 = the data-decided top SWU · L2 =
remaining {M1, M2, M3} in rank order · L3 = SWU-B-M4. Each L1–L3 SWU's promotion = its treatment re-run
stall-drop + green validators (implementation-layering).

**Implementation-detail note (M3 is the only algorithmic task):** the 3 fixture rewrites must preserve the
validator contract — the negative stays *rejected* (a stronger reason: it now validates AS the named
sibling), the positive stays *accepted*. Inputs = current `-bad.md` + the sibling's `-ok.md` shape;
output = a same-concept cross; edge case = a type with no sibling positive (Interface/Mapping) → fall back
to the attribute-mark, do not fabricate a cross. Failure mode = a rewrite that changes the *validator's*
verdict ⇒ revert (that is a validator regression, DES-B3).

**Distill validation (plan gate): FLAG.** Units are minimal and recompose into the model; the coupling to
Package A is explicit. **Gap ledger (one flag):** SWU-B-M2's "delete redundant Common-Confusion rows"
requires a per-row keep/delete judgment that cannot be fully pre-specified from here — **owner:** the M2
executor; **repair path:** log each of the ~17 rows as keep (adds a distinction the pair lacks) or delete
(restates the pair), reviewed before the TAXONOMY edit lands. No `block`: nothing here mutates a validator
or the type system.

**Boundary:** PUBLIC surface only; `__fixtures__/` stays the single validator source; UI edges intact; no
`src/rules`. **Next route:** `task-session` per SWU once SWU-B0 fixes the order from Package A's data.
