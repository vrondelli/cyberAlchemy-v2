# Candidate-only descriptive scoring

Evaluate completed independent-candidate slots 01 and 02 separately from the
failed original campaign. This is an evaluator-only diagnostic with zero new
model calls. Keep all four outcomes and all costs in the reconciliation; exclude
slots 00 and 03 explicitly rather than silently shrinking the campaign.

The additive scorer reuses native prediction reconstruction, native evaluation,
bounded disk admission and process supervision. Its eight tests cover selected
prediction failures, excluded cost drift, unknown-cost visibility, post-score
integrity, evaluator failure, disk denial and unsettled processes. All campaign
acceptance and savings claims remain false or null.

Preparation verifies the original result review, every source binding and both
reconstructed predictions, then freezes the dependency closure and inputs in a
fresh directory. Qualification requires exact bytes and absent generation
process group. Scoring requires an exact review with
`diagnostic_execution_admitted: true`. Neither preparation nor qualification
runs the evaluator. Preserve the original freeze and scoring output unchanged.

Product frontier: recover real quality evidence from already generated outputs.
Operational support owner: research operator; storage admission and process
settlement apply to the scoring stage. No fresh control, worker expansion,
release, source cleanup or new model generation is part of this operation.

## Open Questions

How much relevant context did the completed investigations acquire? Does final
selection lose delivered reference spans? Results describe only these survivors;
the entire campaign remains incomplete and perfect quality remains unproven.
See [failure diagnosis](INDEPENDENT-FINDING-DIAGNOSIS-R1.md).
