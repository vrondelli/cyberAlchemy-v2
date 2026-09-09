import {execFileSync} from 'node:child_process';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {PassThrough} from 'node:stream';
import {createInterface} from 'node:readline';
import {createCodexAppServerWrapper, createAppServerRpcClient, spawnAppServerRpcTransport, loadRepositoryProfile, protocolBindingCheck} from '../../../packages/codex-app-server-wrapper/index.mjs';
const root = resolve(import.meta.dirname, '../../../../../..');
const wrapperRoot = resolve(import.meta.dirname, '../../../packages/codex-app-server-wrapper');
const profile = JSON.parse(readFileSync(resolve(import.meta.dirname, '../profile.json')));
const loaded = loadRepositoryProfile(resolve(wrapperRoot, 'profiles/interaction-learning-canary-v1.json'), root);
let version;
try {version = execFileSync('codex', ['--version'], {encoding: 'utf8', timeout: 10000}).trim();} catch {version = 'unavailable';}
const binding = loaded.ok ? protocolBindingCheck(loaded.value.protocol_binding, version) : loaded;
const report = {schema_version: 'are.interaction-learning-live/v1', status: 'NOT_RUN', observed_binary: version,
  pinned_binary: loaded.value?.protocol_binding.observed_codex_version, configured_model: profile.live.model, observed_model: null,
  turn_start_calls: 0, optional_provider_calls: 0, max_turn_start_calls: 24, model_tokens: null, monetary_cost: null,
  authority_effect: 'none', runs: [], reason_codes: binding.reason_codes ?? [], claim_limit: 'Six-turn synthetic live canary per variant, not a general learning-quality claim.'};
if (binding.ok) {
  const scratch = mkdtempSync(resolve(tmpdir(), 'are-interaction-live-')), deadline = Date.now() + 30 * 60 * 1000;
  try {
    for (const variant of ['V0', 'V1', 'V2', 'V3']) {
      const raw = spawnAppServerRpcTransport({command: 'codex', args: ['app-server', '--stdio']});
      let supplied = {}, currentRequest = null, genericSummary = null;
      const wrapper = createCodexAppServerWrapper({loaded_profile: {...loaded.value, interaction_learning: {...loaded.value.interaction_learning,
        enabled: variant !== 'V0', policy: {mode: variant === 'V1' ? 'observe' : 'apply-scoped'}}},
        decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog, ontology_snapshot: loaded.ontology_snapshot,
        source_snapshot: loaded.source_snapshot, interaction_input_provider: () => supplied});
      const input = new PassThrough(), output = new PassThrough(); let clientChain = Promise.resolve(), serverChain = Promise.resolve();
      const sendActions = actions => {for (let m of actions.to_server) {
        if (m.method === 'turn/start') {if (Date.now() >= deadline || report.turn_start_calls >= 24) throw Error('live.dispatch-budget-exhausted'); report.turn_start_calls++;
        }
        raw.input.write(JSON.stringify(m) + '\n');
      } for (const m of actions.to_client) output.write(JSON.stringify(m) + '\n');};
      const fromClient = createInterface({input}), fromServer = createInterface({input: raw.output});
      fromClient.on('line', line => {clientChain = clientChain.then(async () => sendActions(await wrapper.processClientMessage(JSON.parse(line)))).catch(error => raw.failure.emit('failure', error));});
      fromServer.on('line', line => {serverChain = serverChain.then(async () => sendActions(await wrapper.processServerMessage(JSON.parse(line)))).catch(error => raw.failure.emit('failure', error));});
      const transport = {input, output, ready: raw.ready, failure: raw.failure, get_failure: raw.get_failure,
        close: async () => {fromClient.close(); fromServer.close(); await raw.close(); wrapper.close();}};
      const client = createAppServerRpcClient({transport, request_timeout_ms: 60000, completion_timeout_ms: 120000});
      try {
        await client.initialize({clientInfo: {name: 'are-interaction-live', version: '1'}, capabilities: {experimentalApi: true}});
        const thread = await client.startThread({cwd: scratch, ephemeral: true, model: profile.live.model, approvalPolicy: 'never', sandbox: 'read-only'});
        report.observed_model = thread.model ?? null;
        const prompts = ['Explain context management. Include the word jargon.', 'Avoid jargon. Explain context management plainly.', 'Explain the context workflow again.', 'For this response, include the word jargon.', 'Explain the context workflow plainly.', 'Explain context management one final time.'];
        for (let i = 0; i < prompts.length; i++) {
          const prior = Object.values(wrapper.inspectLearningState({detail: true}).turns).at(-1);
          supplied = i === 1 && variant !== 'V0' ? {feedback: {episode_ref: prior?.request_ref, quote: 'Avoid jargon', instruction: 'Avoid jargon in explanations.', target: 'response', posture: 'explicit', retention_scope: 'current-interaction', correction_kind: 'new-preference', expected_checks: [{check_id: 'plain', kind: 'excludes', value: 'jargon'}]}} : {};
          if (i === 3) supplied.checks = [{check_id: 'override', kind: 'includes', value: 'jargon'}];
          if (i === 2) genericSummary = 'Avoid jargon in explanations.';
          currentRequest = prompts[i]; const started = performance.now();
          const done = await client.runTurn({threadId: thread.thread.id, ...(variant === 'V1' && genericSummary ? {additionalContext: {'canary.generic-summary': {kind: 'application', value: genericSummary}}} : {}), input: [{type: 'text', text: `${currentRequest} Do not use tools; answer in one short paragraph.`}], approvalPolicy: 'never', sandboxPolicy: {type: 'readOnly', networkAccess: false}});
          report.runs.push({variant, turn: i + 1, response: done.text, latency_ms: performance.now() - started, learning: wrapper.inspectLearningState()});
        }
      } finally {await client.close();}
    }
    report.status = 'PASS';
    report.claim_limit = 'Live dispatch/completion smoke test only; observed outputs require the separately declared quality evaluation.';
  } catch (error) {report.status = 'FAIL'; report.reason_codes = [error.message];}
  finally {rmSync(scratch, {recursive: true, force: true});}
}
console.log(JSON.stringify(report, null, 2));
if (report.status === 'FAIL') process.exitCode = 1;
