# Luna repository audit — unreviewed model output

## grounding

Verdict: supported

The runtime grounding check rejects a source marked quoted and requests beginning with quote-like delimiters, so the claim is supported narrowly. The supplied test records rejection through lifecycle preparation; it was not independently rerun.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:26 —   assert(source.quoted !== true && !/^\s*["'`>]/.test(request), 'quoted-source-not-instruction');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:51 —   assert.equal(h.life.prepare(request(2, 'Avoid jargon')).ok, false);

## retention

Verdict: supported

The runtime requires user_selected to be exactly true whenever retention_scope is current-product. Other validation conditions also apply, so this is a necessary condition, not the sole condition for acceptance. The supplied recorded test fixture uses current-interaction retention; no fresh tests were run.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:33 —   assert(['current-interaction', 'current-product'].includes(input.retention_scope), 'retention-invalid');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:34 —   assert(input.retention_scope !== 'current-product' || input.user_selected === true, 'product-retention-not-selected');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:16 — const feedback = {quote: 'Avoid jargon', instruction: 'Avoid jargon', target: 'response', posture: 'inferred', retention_scope: 'current-interaction', correction_kind: 'misinterpretation', expected_checks: [check]};

## applicability

Verdict: refuted

The runtime evaluates preference conditions with case-insensitive literal substring matching, not a semantic language-model classifier. The supplied evidence contains no recorded test for this checkpoint, and no tests were freshly run.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:77 — || p.conditions.some(c => !request.request.toLowerCase().includes(c.toLowerCase()))
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:78 — || p.exclusions.some(c => request.request.toLowerCase().includes(c.toLowerCase())))

## revision

Verdict: refuted

The claim is refuted. Runtime application remains disabled when the lesson ID is in state.disabled, and processing a revision replaces the lesson record without removing that disabled entry. The recorded test verifies revision metadata and zero projected items after revocation. This test was not freshly run; no product approval or activation is inferred.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:74 — if (disabled.includes(lesson.lesson_id) || policy.mode !== 'apply-scoped') disposition = 'disabled';
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:167 — assert(old ? lesson.predecessor_digest === old.record_digest && lesson.revision === old.revision + 1 : lesson.predecessor_digest === null && lesson.revision === 1, 'lesson-revision-invalid');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:169 — // A revision is explicit new source evidence, but does not override a prior disable control.
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:121 — assert.equal(next.revision, 2); assert.equal(next.predecessor_digest, old.record_digest); assert.equal(revision.p.view.items.length, 0);

## conflict

Verdict: supported

The projection collects applicable lessons, then asserts failure when two selected lessons contain the same output-check value with opposite kinds. It explicitly states that recency alone cannot resolve the conflict. No recorded test or freshly run test evidence was supplied.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:93 — // Conflicting lessons require a current explicit override; recency alone cannot choose.
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:95 — assert(!selected.some((a, i) => selected.slice(i + 1).some(b => a.expected_checks.some(x => b.expected_checks.some(y => x.value === y.value && x.kind !== y.kind)))), 'lesson-conflict');

## missing-output

Verdict: refuted

Runtime behavior marks non-string/unavailable output as `unknown`, not `contradicted`. An overall outcome is `contradicted` only when a check result is contradicted; otherwise unknown results yield `inconclusive` unless all checks are supported. A recorded test with null output confirms `inconclusive`. No tests were freshly run.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:107 —    const available = typeof observation.output === 'string';
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:109 —    const results = checks.map(check => ({check_id: check.check_id, result: !available ? 'unknown'
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:113 —    return rec('interaction-outcome', {request_ref: turn.request_ref, turn_ref: turn.turn_ref, dispatch_digest: turn.dispatch_digest,
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:114 —        : results.length && results.every(r => r.result === 'supported') ? 'supported' : 'inconclusive'});
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:48 —    const h = harness(); const first = h.step(1, 'Explain context management', null, {checks: [check]});
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:49 —    assert.equal(h.life.inspect({detail: true}).turns[first.p.request.request_ref].outcome.disposition, 'inconclusive');

## contradictions

Verdict: refuted

The claim is contradicted by the runtime. Contradictions are counted per lesson over its recent applications, and automatic disablement requires the lesson posture to be 'inferred'; explicit preferences are excluded. The supplied test records disablement for an inferred lesson only. It was not freshly rerun, and it does not establish behavior for every lesson or explicit preferences. No product approval or activation is inferred.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:156 — const recent = state.applications.filter(a => a.lesson_digest === lesson.record_digest && ['supported', 'contradicted'].includes(a.disposition)).slice(-5);
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:157 — if (lesson.preference.posture === 'inferred' && recent.filter(a => a.disposition === 'contradicted').length >= 2 && !state.disabled.includes(lesson.lesson_id)) state.disabled.push(lesson.lesson_id);
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:16 — const feedback = {quote: 'Avoid jargon', instruction: 'Avoid jargon', target: 'response', posture: 'inferred', retention_scope: 'current-interaction', correction_kind: 'misinterpretation', expected_checks: [check]};
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:37 — const state = h.life.inspect({detail: true}); assert.equal(state.disabled.length, 1);

## invalidation

Verdict: supported

Supported, with scope: in apply-scoped mode, a request’s invalidated_refs is compared with the lesson’s grounding source request_ref and marks the assessment unsupported. Projection retains only applicable lessons, so the invalidated lesson is omitted from the request context. The wrapper passes invalidated_refs into the runtime, and the recorded test covers this case; it was not freshly run. This is request-level projection suppression, not permanent disablement or product activation.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:79 — else if ((request.invalidated_refs ?? []).includes(p.grounding.source.request_ref)) disposition = 'unsupported';
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-intent-runtime/src/learning-loop.mjs:91 — const applicable = assessments.filter(a => a.disposition === 'applicable');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs:77 — override_lesson_ids: supplied.override_lesson_ids ?? [], invalidated_refs: supplied.invalidated_refs ?? []
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:63 — for (const options of [{target: 'code'}, {checks: [{check_id: 'override', kind: 'includes', value: 'jargon'}]}, {invalidated_refs: ['learning:["t",2]']}]) {
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:64 — h.set(options); assert.equal(h.life.prepare(request(3)).view.items.length, 0);

## replay

Verdict: supported

The runtime derives a stable request identity from thread and message identity, then rejects preparation when that identity is already recorded in state. This blocks a new dispatch from passing the learning prepare boundary. The supplied recovery test records the behavior after ledger replay; it was not freshly run and does not independently exercise dispatch execution.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs:35 — const identity = (thread, id) => `learning:${canonicalJson([thread, id])}`;
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs:56 — const request_ref = identity(thread, message.params?.clientUserMessageId ?? message.id);
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs:57 — if (state.turns[request_ref]) return fail('learning.request-recorded-dispatch-not-retried');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:45 — assert.equal(recovered.prepare(request(1)).ok, false);

## evolution

Verdict: refuted

Recurring failures can yield a research-required disposition, but when no research providers are configured the runtime returns research-pending with no attempts before runResearchScout can be called. Therefore autonomous web searches are not triggered. No recorded tests were supplied and no test was freshly run; this conclusion is based on runtime implementation only. No product approval or activation is inferred.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/interaction-learning.mjs:20 — trigger_id: triggerId, disposition: prior ? prior.disposition : failed.size >= policy.recurrence_limit ? 'research-required' : 'observe'}, 'record_digest');
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/interaction-learning.mjs:52 — if (!research_providers.length) return {disposition: 'research-pending', records, attempts: [], authority_effect: 'none'};
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/evolution-runtime/src/interaction-learning.mjs:55 — const research = await runResearchScout(target, research_providers.map(p => ({id: p.id, search: input => bounded(p.search, input)})), {enabled: true, maximum_results_per_provider: policy.max_results_per_provider});

## live-evidence

Verdict: refuted

The claim is contradicted by both recorded live experiments. The fresh-thread experiment explicitly says it tied the plain-language summary and did not establish an ARE-specific quality advantage; both summary and ARE achieved 3/3 applicability and control results. The repeated conflict experiment reports identical 18/18 performance and no observed ARE-specific advantage. These are recorded experiments, not freshly rerun tests in this audit.

cyberAlchemy-v2/development/agent-reasoning-engine/planning/interaction-context/full-loop/fresh-thread-transfer-v1/REPORT.md:3 — The existing ARE prototype transferred three explicitly retained conventions into new conversations. It tied a plain-language memory summary; this test does not establish an ARE-specific quality advantage.
cyberAlchemy-v2/development/agent-reasoning-engine/planning/interaction-context/full-loop/fresh-thread-transfer-v1/REPORT.md:8 — | B: same preferences and conditions in a summary | 3/3 | 3/3 |
cyberAlchemy-v2/development/agent-reasoning-engine/planning/interaction-context/full-loop/fresh-thread-transfer-v1/REPORT.md:9 — | C: ARE scoped projection | 3/3 | 3/3 |
cyberAlchemy-v2/development/agent-reasoning-engine/planning/interaction-context/full-loop/conflict-transfer-v1/REPORT.md:3 — ARE and an equal-information plain summary each passed 18/18 evaluation checks: 6/6 in every repetition. The result demonstrates correct use of the supplied controls on this corpus, with no observed ARE-specific answer-quality advantage.

## recovery

Verdict: supported

The recorded local lifecycle test reconstructs the lifecycle using the existing ledger and asserts that the recovered and original record digests match. This is recorded evidence, not a freshly run test in this audit.

cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:42 —   const recovered = createInteractionLearningLifecycle({ledger: h.ledger, configuration});
cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/interaction-learning.test.mjs:43 —   assert.equal(recovered.inspect({detail: true}).record_digest, h.life.inspect({detail: true}).record_digest);
