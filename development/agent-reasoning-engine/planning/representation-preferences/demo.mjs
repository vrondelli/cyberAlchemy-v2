// Scripted host demonstration; no external model calls or benchmark claim.
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {createInteractionReview} from '../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-review.mjs';
const dir = mkdtempSync(join(tmpdir(), 'are-preference-demo-'));
let app, n = 0;
const create = () => app = createInteractionReview({state_path: join(dir, 'state.jsonl'),
  objective_provider: i => ({...(i.state.active_objective ? {transition: 'continue', referent_objective_id: i.state.active_objective.objective_id}
    : {transition: 'new', objective: {description: i.request}}), evidence_span: {start: 0, end: i.request.length},
    ...(i.requirement_snapshot ? {requirement_delta: {retained: i.requirement_snapshot.requirements, added: [], removed: []}} : {})}),
  response_provider: message => {
    const view = JSON.parse(message.params.additionalContext['cyberalchemy.are.interaction-learning'].value);
    return view.items.some(i => i.instruction === 'Use DAG for plans.') ? 'Plan: prepare → check → finish (scripted)' : 'Scripted response';
  }});
const send = async (text, extra = {}) => {
  const r = await app.submit({request_id: `demo-${++n}`, thread_id: 'demo', text, ...(n === 1 ? {requirements: []} : {}), ...extra});
  assert.equal(r.ok, true, JSON.stringify(r)); return r;
};
try {
  create(); let r;
  for (let i = 0; i < 3; i++) r = await send('Plan a picnic in a DAG');
  const offer = r.preference_offers[0]; assert.ok(offer); assert.equal(app.inspect().lessons.length, 0);
  await send(offer.confirmation_text, {preference_decision: {offer_id: offer.offer_id, action: 'accept', retention_scope: 'current-product'}});
  app.close(); create();
  const retained = await send('Plan a picnic');
  const overridden = await send('Plan a picnic in plain text');
  const unrelated = await send('Compare options');
  assert.equal(retained.selected_lessons.length, 1); assert.equal(overridden.selected_lessons.length, 0); assert.equal(unrelated.selected_lessons.length, 0);
  console.log(JSON.stringify({kind: 'scripted-host-demonstration', external_model_calls: 0, offer: offer.prompt,
    confirmation: offer.confirmation_text, after_restart: retained.output,
    selected_after_restart: retained.selected_lessons.length, selected_with_override: overridden.selected_lessons.length,
    selected_for_unrelated_task: unrelated.selected_lessons.length, authority_effect: 'none'}, null, 2));
} finally {app?.close(); rmSync(dir, {recursive: true, force: true});}
