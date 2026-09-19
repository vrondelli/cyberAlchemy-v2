# Invoke Design — Clarity Package Shape (s6)

The clarity package has three parts (all non-executed):

1. **Clarity-gap register** (`../s4-research/CLARITY-GAP-REGISTER.md`) — 28 gaps,
   typed + owned, deduped against prior items. The durable answer to "what is not
   clear." Becomes a living list the prior run's PLAN consumes.

2. **Language-fit verdict DEC-FIT-01** (`../s5-distill/LANGUAGE-FIT-VERDICT.md`) —
   PARTIAL-BRIDGE, split by validation surface, with the 3-part bridge condition.
   The durable answer to "does our language help."

3. **The bridge spec** (the load-bearing design): for the language to help, three
   things wire together —
   - `contract.obligations[].obligation_id` (DESIGN-PACKAGE §3/§4) → keys a
     `obligationsForMeta : Profile → Meta → List Obligation` table in the validator
     (the named hole in `gradeP3Obligations`).
   - that table is **derived** from contract/schema/taxonomy artifacts (one source
     of truth), not hand-maintained.
   - the language's `schema` kind and the validator's `Spec` collapse to one
     dialect (OD-3), so the translator's `Meta`/`EdgeType` and the language's
     concept model are the same vocabulary.

## What the package deliberately does NOT do
- Does not assert the language currently helps the running validator (it does not).
- Does not write the obligation table or resolve B-1 (that is a future task).
- Does not re-open the categorical model (DEC-CAT-01 stands, still provisional).
