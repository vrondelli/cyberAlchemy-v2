"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineSubtotalEvaluationContract = void 0;
exports.lineSubtotalEvaluation = lineSubtotalEvaluation;
exports.lineSubtotalEvaluationObserved = lineSubtotalEvaluationObserved;
// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"c54431ee5d946415df30fffab71528df1928bc8b8f2bdfb49ccc6df7784952b1","language":"typescript","meta_type_id":"DS-D1.4","meta_type_label":"Operation","provider_sha256":"1bc82cc0284069bfaa115f4bd51e423e259c6b38428a6a8d980132e9ba05a06f","source_sha256":"abbd57adf9587ef4436524148482a9ab5b92954d49e61dc444f57036874679f4"}
// domainspec-body: {"description":"Pure evaluation of the explicitly declared calculation LineSubtotal; support node required by DomainSpec calculates closure.","effects":[],"failure_continuation":"return-calculation-error","guard":"closed-calculation-contract","reads":[],"writes":[]}
// domainspec-relationships: [{"edge_id":"line-subtotal-calculates-line-subtotal-evaluation","relationship":"calculates","scope":"feature","source":{"feature_id":"quantity-price","kind":"Calculation","node_id":"line-subtotal"},"target":{"feature_id":"quantity-price","kind":"Operation","node_id":"line-subtotal-evaluation"}}]
// domainspec-operation-sets: {"effects":[],"reads":[],"writes":[]}
// domainspec-operation-guard: "closed-calculation-contract"
// domainspec-guard-before-mutation: true
// domainspec-atomic-state-outbox: true
// domainspec-failure-continuation: "return-calculation-error"
// domainspec-operation-core-instrumentation-free: true
// domainspec-operation-instrumentation-owner: "outer-wrapper"
exports.LineSubtotalEvaluationContract = Object.freeze({ "creation_targets": [], "effects": [], "reads": [], "relationships": [{ "edge_id": "line-subtotal-calculates-line-subtotal-evaluation", "relationship": "calculates", "scope": "feature", "source": { "feature_id": "quantity-price", "kind": "Calculation", "node_id": "line-subtotal" }, "target": { "feature_id": "quantity-price", "kind": "Operation", "node_id": "line-subtotal-evaluation" } }], "writes": [] });
function lineSubtotalEvaluation(state, changes, guard) {
    if (!guard())
        return { ok: false, continuation: "return-calculation-error" };
    const readSet = Object.freeze(Object.fromEntries(exports.LineSubtotalEvaluationContract.reads.map((key) => [key, state[key]])));
    const nextState = Object.freeze(exports.LineSubtotalEvaluationContract.writes.reduce((next, key) => ({ ...next, [key]: changes[key] }), { ...state }));
    const outbox = exports.LineSubtotalEvaluationContract.effects.map((type) => Object.freeze({ type, operation: "line-subtotal-evaluation" }));
    return { ok: true, reads: readSet, state: nextState, outbox };
}
function lineSubtotalEvaluationObserved(state, changes, guard, observe) {
    observe("operation.enter");
    const outcome = lineSubtotalEvaluation(state, changes, guard);
    observe(outcome.ok ? "operation.success" : "operation.failure");
    return outcome;
}
