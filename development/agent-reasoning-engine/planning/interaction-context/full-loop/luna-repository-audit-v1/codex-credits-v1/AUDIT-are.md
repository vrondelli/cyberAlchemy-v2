# Luna repository audit — unreviewed model output

## grounding

Verdict: supported

The runtime grounding check rejects a source marked quoted or a request beginning with quote-like syntax. A recorded test exercises the lifecycle path by setting quoted feedback and asserting preparation fails. This is recorded test evidence; no test was freshly run.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:26 —   assert(source.quoted !== true && !/^\s*["'`>]/.test(request), 'quoted-source-not-instruction');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:50 —   h.set({feedback: {...feedback, episode_ref: first.p.request.request_ref, quoted: true}});
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:51 —   assert.equal(h.life.prepare(request(2, 'Avoid jargon')).ok, false);

## retention

Verdict: supported

The runtime requires user_selected to be exactly true whenever retention_scope is current-product. The recorded test fixture uses current-interaction retention and does not independently exercise the current-product branch. No tests were freshly run.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:34 — assert(input.retention_scope !== 'current-product' || input.user_selected === true, 'product-retention-not-selected');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:16 — const feedback = {quote: 'Avoid jargon', instruction: 'Avoid jargon', target: 'response', posture: 'inferred', retention_scope: 'current-interaction', correction_kind: 'misinterpretation', expected_checks: [check]};

## applicability

Verdict: refuted

The runtime evaluates each preference condition using case-insensitive literal substring matching via `toLowerCase().includes(...)`; no semantic language-model classifier is shown. Any tests referenced in prior work are recorded tests, not freshly run tests.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:77 —      || p.conditions.some(c => !request.request.toLowerCase().includes(c.toLowerCase()))

## revision

Verdict: refuted

The claim is refuted. Application remains disabled when the lesson ID is in the persistent disabled list, and revision handling replaces the stored lesson without removing that disable control. The recorded lifecycle test confirms that user revocation wins after a revision. No tests were freshly run.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:74 — if (disabled.includes(lesson.lesson_id) || policy.mode !== 'apply-scoped') disposition = 'disabled';
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:166 — const old = state.lessons[lesson.lesson_id];
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:168 — state.lessons[lesson.lesson_id] = lesson; state.feedback_refs.push(lesson.preference.grounding.source.request_ref);
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:169 — // A revision is explicit new source evidence, but does not override a prior disable control.
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:121 — assert.equal(next.revision, 2); assert.equal(next.predecessor_digest, old.record_digest); assert.equal(revision.p.view.items.length, 0);

## conflict

Verdict: supported

The runtime projection evaluates all stored lessons, retains every assessment marked applicable, and checks the selected lessons pairwise for equal-valued checks with opposing kinds. It throws `lesson-conflict`; no recency-based conflict selection is implemented. No tests were freshly run, and this conclusion is based on runtime source rather than recorded test execution.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:91 — const applicable = assessments.filter(a => a.disposition === 'applicable');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:93 — // Conflicting lessons require a current explicit override; recency alone cannot choose.
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:95 — assert(!selected.some((a, i) => selected.slice(i + 1).some(b => a.expected_checks.some(x => b.expected_checks.some(y => x.value === y.value && x.kind !== y.kind)))), 'lesson-conflict');

## missing-output

Verdict: refuted

The runtime implementation refutes the claim. When output is unavailable, `available` is false and each check result is `unknown`, not `contradicted`. The aggregate disposition becomes `inconclusive` unless checks are contradicted or all supported. A recorded test asserts the inconclusive result; no tests were freshly run.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:107 —   const available = typeof observation.output === 'string';
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:109 —    const results = checks.map(check => ({check_id: check.check_id, result: !available ? 'unknown'
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:113 —      checks: results, disposition: results.some(r => r.result === 'contradicted') ? 'contradicted'
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:114 —        : results.length && results.every(r => r.result === 'supported') ? 'supported' : 'inconclusive'});
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:49 —    assert.equal(h.life.inspect({detail: true}).turns[first.p.request.request_ref].outcome.disposition, 'inconclusive');

## contradictions

Verdict: refuted

The claim is refuted by the runtime. Contradictions are counted per lesson record over its recent applications, and automatic disabling occurs only when that lesson's preference posture is `inferred`. Explicit preferences therefore do not satisfy the disable condition, and there is no global disable-all behavior. The cited lifecycle test is recorded source evidence only; it was not freshly executed and exercises an inferred lesson.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:156 — const recent = state.applications.filter(a => a.lesson_digest === lesson.record_digest && ['supported', 'contradicted'].includes(a.disposition)).slice(-5);
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:157 — if (lesson.preference.posture === 'inferred' && recent.filter(a => a.disposition === 'contradicted').length >= 2 && !state.disabled.includes(lesson.lesson_id)) state.disabled.push(lesson.lesson_id);
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:37 — const state = h.life.inspect({detail: true}); assert.equal(state.disabled.length, 1);
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:38 — assert.deepEqual(state.applications.filter(a => a.outcome_ref).map(a => a.disposition), ['supported', 'contradicted', 'contradicted']);

## invalidation

Verdict: supported

A request can suppress an otherwise applicable lesson from projected context by listing its exact grounding source request_ref in invalidated_refs. Runtime marks that lesson unsupported, and projection retains only applicable lessons. This suppresses projection, not deletion. The recorded test exercises this path; no tests were freshly run. No authority effect is granted.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:79 — else if ((request.invalidated_refs ?? []).includes(p.grounding.source.request_ref)) disposition = 'unsupported';
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:91 — const applicable = assessments.filter(a => a.disposition === 'applicable');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs:76 — const current = {...binding, interaction_ref: thread, request, request_ref, target: supplied.target ?? 'response', checks: supplied.checks ?? [],
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs:77 — override_lesson_ids: supplied.override_lesson_ids ?? [], invalidated_refs: supplied.invalidated_refs ?? []};
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:63 — for (const options of [{target: 'code'}, {checks: [{check_id: 'override', kind: 'includes', value: 'jargon'}]}, {invalidated_refs: ['learning:[\"t\",2]']}]) {
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:64 — h.set(options); assert.equal(h.life.prepare(request(3)).view.items.length, 0);

## replay

Verdict: supported

With learning enabled, prepare derives a stable request_ref from the thread and client message/RPC identity, then rejects preparation when that identity already has a recorded turn. Dispatch records the turn under that same request_ref. Therefore reuse is blocked at the prepare boundary, preventing the normal fresh-dispatch path. The lifecycle test is recorded source evidence only; no tests were freshly run.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs:56 — const request_ref = identity(thread, message.params?.clientUserMessageId ?? message.id);
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs:57 — if (state.turns[request_ref]) return fail('learning.request-recorded-dispatch-not-retried');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs:84 — return apply({event_id: `dispatch:${prepared.request.request_ref}`, kind: 'dispatch', turn: {
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:45 — assert.equal(recovered.prepare(request(1)).ok, false);

## evolution

Verdict: refuted

Recurring failures can yield `research-required`, but an empty provider list returns `research-pending` before `runResearchScout` is called. Provider-backed searching occurs only when at least one provider is configured. No tests were freshly run; this verdict relies on runtime source, not recorded test execution.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/interaction-learning.mjs:20 — trigger_id: triggerId, disposition: prior ? prior.disposition : failed.size >= policy.recurrence_limit ? 'research-required' : 'observe'}, 'record_digest');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/interaction-learning.mjs:52 — if (!research_providers.length) return {disposition: 'research-pending', records, attempts: [], authority_effect: 'none'};
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/interaction-learning.mjs:55 — const research = await runResearchScout(target, research_providers.map(p => ({id: p.id, search: input => bounded(p.search, input)})), {enabled: true, maximum_results_per_provider: policy.max_results_per_provider});

## live-evidence

Verdict: refuted

The claim is refuted by the supplied recorded reports. The fresh-thread experiment expressly says it did not establish an ARE-specific quality advantage and describes its scope as retained-memory transfer, not broad answer quality. The repeated conflict experiment reports identical 18/18 results for ARE and the equal-information summary, with no observed ARE-specific advantage. These were recorded live results; no independent rerun was performed for this audit. No product approval or activation is inferred.

cyberAlchemy-v2/development/agent-reasoning-engine/planning/interaction-context/full-loop/fresh-thread-transfer-v1/REPORT.md:3 — The existing ARE prototype transferred three explicitly retained conventions into new conversations. It tied a plain-language memory summary; this test does not establish an ARE-specific quality advantage.
cyberAlchemy-v2/development/agent-reasoning-engine/planning/interaction-context/full-loop/fresh-thread-transfer-v1/REPORT.md:17 — This tests retained-memory transfer within one process, not autonomous rule discovery, weight learning, semantic generalization, restart durability or broad answer quality.
cyberAlchemy-v2/development/agent-reasoning-engine/planning/interaction-context/full-loop/conflict-transfer-v1/REPORT.md:3 — ARE and an equal-information plain summary each passed 18/18 evaluation checks: 6/6 in every repetition. The result demonstrates correct use of the supplied controls on this corpus, with no observed ARE-specific answer-quality advantage.
cyberAlchemy-v2/development/agent-reasoning-engine/planning/interaction-context/full-loop/conflict-transfer-v1/REPORT.md:16 — Both treatments received the same relevant information: instructions, applicability conditions, revision/supersession status, invalidation and current-request overrides.

## recovery

Verdict: supported

Recorded local tests recover a lifecycle from an existing ledger and explicitly compare recovered and original record digests. A separate wrapper test recreates from a file-backed ledger and compares the full recovered state. These are recorded assertions; no tests were freshly run.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:42 —   const recovered = createInteractionLearningLifecycle({ledger: h.ledger, configuration});
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:43 —   assert.equal(recovered.inspect({detail: true}).record_digest, h.life.inspect({detail: true}).record_digest);
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:111 —    w.close(); feedbackInput = {}; w = create(); assert.deepEqual(w.inspectLearningState({detail: true}), state);
