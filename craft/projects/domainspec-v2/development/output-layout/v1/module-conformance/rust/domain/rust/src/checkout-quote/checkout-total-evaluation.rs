// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"e3ab4c0f5c3cae3edebc136eea34c6277214cb5e9a1878d81bad73ff07623db2","language":"rust","meta_type_id":"DS-D1.4","meta_type_label":"Operation","provider_sha256":"c34962ceef4fa5eabd6ccef9f7df100e31e3296ae7beef1f68d19aeb317f3629","source_sha256":"49723621b79c30372b9871f1ff09a595aff0a88f63d58c5dad8ce1ca7edbdb62"}
// domainspec-body: {"description":"Pure evaluation of the explicitly declared calculation CheckoutTotal; support node required by DomainSpec calculates closure.","effects":[],"failure_continuation":"return-calculation-error","guard":"closed-calculation-contract","reads":[],"writes":[]}
// domainspec-relationships: [{"edge_id":"checkout-total-calculates-checkout-total-evaluation","relationship":"calculates","scope":"feature","source":{"feature_id":"checkout-quote","kind":"Calculation","node_id":"checkout-total"},"target":{"feature_id":"checkout-quote","kind":"Operation","node_id":"checkout-total-evaluation"}}]
// domainspec-operation-sets: {"effects":[],"reads":[],"writes":[]}
// domainspec-operation-guard: "closed-calculation-contract"
// domainspec-guard-before-mutation: true
// domainspec-atomic-state-outbox: true
// domainspec-failure-continuation: "return-calculation-error"
// domainspec-operation-core-instrumentation-free: true
// domainspec-operation-instrumentation-owner: "outer-wrapper"
use std::collections::BTreeMap;
pub const CHECKOUTTOTALEVALUATION_CREATION_TARGETS: &[&str] = &[];
pub const CHECKOUTTOTALEVALUATION_RELATIONSHIPS_JSON: &str = "[{\"edge_id\":\"checkout-total-calculates-checkout-total-evaluation\",\"relationship\":\"calculates\",\"scope\":\"feature\",\"source\":{\"feature_id\":\"checkout-quote\",\"kind\":\"Calculation\",\"node_id\":\"checkout-total\"},\"target\":{\"feature_id\":\"checkout-quote\",\"kind\":\"Operation\",\"node_id\":\"checkout-total-evaluation\"}}]";
#[derive(Clone, Debug, PartialEq)]
pub struct CheckoutTotalEvaluationOutcome { pub reads: BTreeMap<String, String>, pub state: BTreeMap<String, String>, pub outbox: Vec<String> }
pub fn checkout_total_evaluation(state: &BTreeMap<String, String>, changes: &BTreeMap<String, String>, guard: bool) -> Result<CheckoutTotalEvaluationOutcome, &'static str> {
    if !guard { return Err("return-calculation-error"); }
    let reads = [].iter().filter_map(|key| state.get(*key).map(|value| ((*key).to_owned(), value.clone()))).collect();
    let mut next_state = state.clone();
    for key in [] { if let Some(value) = changes.get(key) { next_state.insert(key.to_owned(), value.clone()); } }
    let outbox: Vec<String> = vec![];
    Ok(CheckoutTotalEvaluationOutcome { reads, state: next_state, outbox })
}
pub fn checkout_total_evaluation_observed(state: &BTreeMap<String, String>, changes: &BTreeMap<String, String>, guard: bool, observe: &mut impl FnMut(&str)) -> Result<CheckoutTotalEvaluationOutcome, &'static str> {
    observe("operation.enter");
    let outcome = checkout_total_evaluation(state, changes, guard);
    observe(if outcome.is_ok() { "operation.success" } else { "operation.failure" });
    outcome
}
