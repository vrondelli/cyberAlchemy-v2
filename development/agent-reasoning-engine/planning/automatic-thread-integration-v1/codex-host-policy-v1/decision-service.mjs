import {createServer} from 'node:http';
import {createHash, randomUUID} from 'node:crypto';
import {budgetDecision} from '../recycling-v1/recycling.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const integer = value => Number.isSafeInteger(value) && value >= 0;
const demand = (condition, reason) => { if (!condition) throw Error(reason); };

/** Offline policy peer. The injected meter is a trust boundary, not a token estimator.
 * Every profile must measure complete provider framing; synthetic test meters establish
 * protocol behavior only. This service neither invokes a model nor resumes a host. */
export async function startDecisionService({scope, state_digest, checkpoint_ref, profiles, maximum_output_tokens}) {
  demand(typeof scope === 'string' && scope.length > 0, 'scope-required');
  demand(typeof state_digest === 'string' && /^[a-f0-9]{64}$/.test(state_digest), 'state-digest-required');
  demand(typeof checkpoint_ref === 'string' && checkpoint_ref.length > 0, 'checkpoint-required');
  demand(integer(maximum_output_tokens) && maximum_output_tokens > 0, 'output-cap-required');
  // Snapshot policy values and callback identity so external edits cannot change an active peer.
  const boundProfiles = new Map(Object.entries(profiles).map(([model, profile]) => [model, Object.freeze({...profile})]));
  const route = `/${randomUUID()}`;
  const decisions = [];
  const seen = new Set();
  let sequence = 0;
  const server = createServer(async (request, response) => {
    let message;
    try {
      demand(request.method === 'POST' && request.url === route, 'unknown-route');
      demand(!request.headers['content-encoding'], 'compressed-envelope');
      let length = 0; const chunks = [];
      for await (const chunk of request) {
        length += chunk.length;
        demand(length <= 2_097_152, 'envelope-too-large');
        chunks.push(chunk);
      }
      message = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      demand(message.version === 1 && message.scope === scope, 'scope-or-version-mismatch');
      demand(typeof message.request_id === 'string' && message.request_id.length <= 128 && message.request_id.length > 0, 'request-id-required');
      demand(typeof message.body === 'string' && Buffer.byteLength(message.body) <= 1_048_576, 'invalid-body');
      demand(message.request_digest === hash(message.body), 'request-digest-mismatch');
      demand(seen.size < 10_000 && !seen.has(message.request_id), 'replayed-or-exhausted-request');
      seen.add(message.request_id);
      let decision;
      if (message.kind === 'native_compaction') {
        demand(message.body === '', 'invalid-compaction-envelope');
        decision = {action:'recycle', reason:'native-compaction-intercepted'};
      } else {
        demand(message.kind === 'provider', 'unknown-kind');
        const body = JSON.parse(message.body);
        demand(body && !Array.isArray(body) && typeof body === 'object', 'invalid-request');
        demand(Array.isArray(body.input) && !Object.hasOwn(body, 'previous_response_id') && body.store === false && !body.background, 'full-context-required');
        demand(integer(body.max_output_tokens) && body.max_output_tokens > 0 && body.max_output_tokens <= maximum_output_tokens, 'invalid-output-cap');
        const profile = boundProfiles.get(body.model);
        demand(profile && typeof profile.measure_request === 'function' && typeof profile.measurement_ref === 'string' && profile.measurement_ref.length > 0, 'unknown-model-bound');
        const upper = profile.measure_request(Object.freeze({serialized_body:message.body}));
        demand(integer(upper), 'unknown-input-bound');
        const policy = {limit_ref:profile.limit_ref, compaction_limit:profile.compaction_limit, recycle_at:profile.recycle_at, safety_margin:profile.safety_margin};
        const context = {task_id:scope, context_id:scope, state_digest, checkpoint_ref, generation:0, observation_sequence:++sequence, status:'running'};
        decision = budgetDecision({route:context, policy,
          observation:{kind:'context-upper-bound', evidence_ref:profile.measurement_ref, upper_bound:0, context_id:scope, generation:0, sequence, limit_ref:profile.limit_ref},
          nextStep:{input_upper_bound:upper, growth_upper_bound:body.max_output_tokens, evidence_ref:profile.measurement_ref, request_digest:message.request_digest},
          // These controls describe only the supported, complete-body offline transport path.
          control:{owns_every_provider_step:true,bounds_all_growth:true,in_flight_steps:0}});
      }
      const result = {version:1, scope, request_id:message.request_id, request_digest:message.request_digest, ...decision};
      decisions.push({kind:message.kind, request_id:message.request_id, request_digest:message.request_digest, ...decision});
      response.writeHead(200, {'content-type':'application/json'}).end(JSON.stringify(result));
    } catch {
      // Do not echo payloads, credential-shaped data, or arbitrary exception messages.
      response.writeHead(400, {'content-type':'application/json'}).end('{"action":"block"}');
    }
  });
  server.requestTimeout = 3000;
  server.headersTimeout = 3000;
  server.maxConnections = 16;
  await new Promise((resolve,reject) => {server.once('error',reject); server.listen(0,'127.0.0.1',resolve);});
  return {endpoint:`http://127.0.0.1:${server.address().port}${route}`,
    snapshot:() => structuredClone(decisions),
    async close() {server.closeAllConnections(); await new Promise(resolve => server.close(resolve));}};
}
