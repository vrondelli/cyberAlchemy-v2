# Worked adapter witnesses and negative controls

These are proposed fixtures, not paper results and not ontology authority.

## W1 — positive structural witness (hypothesis)

Input: a frozen four-record graph with an already-authored evaluation pipeline:
`parse -> schema-check -> relation-check`. The adapter emits three timestamps
where each timestamp represents one pipeline stage, preserves record IDs and
predicate direction as metadata, and predicts a synthetic, explicitly labeled
“stage completion” target. A DNG-like encoder may be compared against static
and set baselines.

Pass criterion: the implementation can reproduce ordering and report a score
without creating relation proposals or mutating records. This only witnesses
adapter mechanics, not semantic hierarchy.

## N1 — near but not relation negative control

Two records share lexical fields/neighbor patterns but have no gold
`is_a`/parent relation. A model that predicts parenthood from proximity fails.
This implements the bridge’s near-negative requirement.

## N2 — far but genuinely related positive control

Two records are lexically/structurally distant but have an accepted typed
relation with provenance. A model that equates distance with “no relation”
fails. This prevents geometric correlation from becoming semantics.

## N3 — order policy counterfactual

Keep graph nodes/edges fixed; change the declared traversal policy. If the
model’s output changes because timestamps changed, report that it learned the
chosen evaluation order—not an inherent hierarchy. If no policy was declared,
the fixture is invalid.

## N4 — symmetry counterexample

Rename an opaque, nonreferenced fixture key consistently: output may be tested
for desired invariance. Then swap stable IDs while leaving external references
unreconciled: this must be rejected, not treated as a neuron permutation.

## N5 — leakage control

Remove authority/review outcome fields from features while retaining them only
as possible labels. A large delta indicates the original result may have leaked
governance state rather than learned a permitted structural signal.

All fixtures require version/digest, deterministic replay, recorded expected
outcomes, and adjudication before they can bear claims. That is
`research-evidence-harness` work.
