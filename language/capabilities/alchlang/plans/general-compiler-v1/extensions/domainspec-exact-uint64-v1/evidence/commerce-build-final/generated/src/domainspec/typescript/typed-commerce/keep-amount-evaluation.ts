// domainspec-meta: {"baseline_digest":"bfbc335d151ab8b29150dc95f246c2bc0954cff179ece5ce51222b2d1455abda","baseline_id":"domainspec-meta-types-current-implemented@10","binding_sha256":"c54431ee5d946415df30fffab71528df1928bc8b8f2bdfb49ccc6df7784952b1","language":"typescript","meta_type_id":"DS-D1.4","meta_type_label":"Operation","provider_sha256":"1bc82cc0284069bfaa115f4bd51e423e259c6b38428a6a8d980132e9ba05a06f","source_sha256":"abbd57adf9587ef4436524148482a9ab5b92954d49e61dc444f57036874679f4"}
// domainspec-body: {"description":"Pure evaluation of the explicitly declared calculation KeepAmount; support node required by DomainSpec calculates closure.","effects":[],"failure_continuation":"return-calculation-error","guard":"closed-calculation-contract","reads":[],"writes":[]}
// domainspec-relationships: [{"edge_id":"keep-amount-calculates-keep-amount-evaluation","relationship":"calculates","scope":"feature","source":{"feature_id":"typed-commerce","kind":"Calculation","node_id":"keep-amount"},"target":{"feature_id":"typed-commerce","kind":"Operation","node_id":"keep-amount-evaluation"}}]
// domainspec-operation-sets: {"effects":[],"reads":[],"writes":[]}
// domainspec-operation-guard: "closed-calculation-contract"
// domainspec-guard-before-mutation: true
// domainspec-atomic-state-outbox: true
// domainspec-failure-continuation: "return-calculation-error"
// domainspec-operation-core-instrumentation-free: true
// domainspec-operation-instrumentation-owner: "outer-wrapper"
export const KeepAmountEvaluationContract = Object.freeze({"creation_targets":[],"effects":[],"reads":[],"relationships":[{"edge_id":"keep-amount-calculates-keep-amount-evaluation","relationship":"calculates","scope":"feature","source":{"feature_id":"typed-commerce","kind":"Calculation","node_id":"keep-amount"},"target":{"feature_id":"typed-commerce","kind":"Operation","node_id":"keep-amount-evaluation"}}],"writes":[]});
export function keepAmountEvaluation(state: Readonly<Record<string, unknown>>, changes: Readonly<Record<string, unknown>>, guard: () => boolean) {
  if (!guard()) return { ok: false as const, continuation: "return-calculation-error" };
  const readSet = Object.freeze(Object.fromEntries(KeepAmountEvaluationContract.reads.map((key) => [key, state[key]])));
  const nextState = Object.freeze(KeepAmountEvaluationContract.writes.reduce<Record<string, unknown>>((next, key) => ({ ...next, [key]: changes[key] }), { ...state }));
  const outbox = KeepAmountEvaluationContract.effects.map((type) => Object.freeze({ type, operation: "keep-amount-evaluation" }));
  return { ok: true as const, reads: readSet, state: nextState, outbox };
}
export function keepAmountEvaluationObserved(state: Readonly<Record<string, unknown>>, changes: Readonly<Record<string, unknown>>, guard: () => boolean, observe: (phase: "operation.enter" | "operation.success" | "operation.failure") => void) {
  observe("operation.enter");
  const outcome = keepAmountEvaluation(state, changes, guard);
  observe(outcome.ok ? "operation.success" : "operation.failure");
  return outcome;
}
