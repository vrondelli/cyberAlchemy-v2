# Fact-Set And Condition Contract

## Purpose

This contract prevents “Definition Pack” from meaning “a longer prompt with
extra information.” It also prevents the pack from silently becoming a plan or
an authority grant.

## Atomic Fact Manifest

Before creating equivalent notes or a Definition Pack, record each selected
proposition as one atomic fact:

```text
fact_id
kind
statement
source_ref
source_selector
applies_in_context
```

Allowed `kind` values are:

- `goal`;
- `intent`;
- `context`;
- `concept`;
- `definition`;
- `evidence`;
- `relationship`;
- `owner`;
- `open_question`;
- `allowed_use`; and
- `blocked_action`.

Atomic means one independently checkable proposition. A paragraph containing
two claims must be split before parity is checked.

## Parity Rule

`equivalent_notes` and `definition_pack` must contain the same set of `fact_id`
values. This includes open questions, owners, allowed uses, and blocked actions;
they cannot be removed because they make the notes less fluent.

The representations may differ in ordering, labels, links, explicit fields,
and how open state is displayed. They may not differ in factual content.

Two reviewers check both directions after generation. The validated manifest is
hashed as `fact_set_digest` and bound to every row in the task block.

## Cost Allocation

Condition totals separate three costs:

- `direct_material_*` — producing that condition's ticket, notes, pack, or
  pack-plus-gate material;
- `allocated_fact_set_*` — the cost of selecting and checking the shared facts;
  and
- `parity_review_*` — research-integrity overhead, reported once for the task
  block and not disguised as product-work time.

The ticket-only condition receives zero fact-set allocation. Each of the three
selected-information conditions receives the full fact-set preparation cost as
a counterfactual replacement-workflow cost. This repeats the shared amount
across conditions deliberately: condition totals are alternatives for paired
comparison, not values to sum into an experiment budget.

For each run row:

```text
material_preparation = direct_material + allocated_fact_set
```

The joined bundle validator enforces this equality. Parity-review cost remains
visible at manifest level and is reported separately from condition outcome
time.

## Definition Pack Content Boundary

The pack may structure the selected meaning. It must not add:

- a product or UX solution;
- architecture or technology selection;
- implementation steps or code hints;
- a preferred patch;
- hidden acceptance-case answers;
- permission to implement, publish, deploy, or promote; or
- evidence-gate instructions.

The pack records `authority_effect: none`. The evidence gate is defined only in
the fourth condition's separate policy.

## Causal-Attribution Bindings

- `ticket_only`: no notes, pack, or gate digest;
- `equivalent_notes`: notes digest and fact-set digest; no pack or gate digest;
- `definition_pack`: pack digest and fact-set digest; no gate digest;
- `definition_pack_evidence_gate`: same pack digest plus one gate-policy digest.

Any other binding invalidates the task block.
