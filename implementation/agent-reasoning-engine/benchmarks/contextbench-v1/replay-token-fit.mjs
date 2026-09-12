// Replay the stopped round-seven state boundary through the successor fitter. No model calls.
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {credentials} from '../glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
import {createIndexTokenizer} from './live-client.mjs';
import {buildTaskStateProjection} from './task-state.mjs';

const [matrixPath, manifestPath, stoppedResultPath, credentialPath, outputPath] = process.argv.slice(2);
if (!outputPath) throw Error('matrix manifest stopped-result credential output required');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const matrix = JSON.parse(readFileSync(matrixPath));
const manifest = JSON.parse(readFileSync(manifestPath));
const resultBytes = readFileSync(stoppedResultPath), stopped = JSON.parse(resultBytes);
const cell = matrix.cells.find(candidate => candidate.instance_id === stopped.instance_id && candidate.state_arm === 'state');
const taskEntry = manifest.tasks.find(candidate => candidate.instance_id === stopped.instance_id);
if (!cell || !taskEntry) throw Error('replay.source-binding-missing');
const taskPath = resolve(new URL('.', new URL('file://' + resolve(manifestPath))).pathname, taskEntry.file);
const task = JSON.parse(readFileSync(taskPath));
const {registry, reference} = credentials(credentialPath);
const tokenizer = createIndexTokenizer({registry, reference, maximum_calls: 4});
let projection, failure = null;
try {
  projection = await buildTaskStateProjection({task, captures: stopped.captures, receipts: stopped.receipts, events: stopped.events,
    generation: Math.max(...stopped.task_state_presentations.map(item => item.generation)), max_evidence: cell.limits.task_state_evidence,
    max_outcomes: cell.limits.task_state_outcomes, max_bytes: cell.limits.task_state_bytes, max_tokens: cell.limits.task_state_tokens,
    measure_tokens: tokenizer.measure});
} catch (error) { failure = error.message; }
const first = tokenizer.receipts[0]?.tokens, last = tokenizer.receipts.at(-1)?.tokens;
const passed = failure === null && first > cell.limits.task_state_tokens && last <= cell.limits.task_state_tokens && tokenizer.receipts.length <= 4 &&
  projection.fit.evicted_evidence + projection.fit.evicted_outcomes > 0 && projection.outcomes.at(-1)?.step === Math.max(...stopped.events.map(event => event.step));
const {text, ...safeProjection} = projection ?? {};
const replay = {schema_version: 'are.contextbench-token-fit-replay/v1', status: passed ? 'passed' : 'failed',
  predecessor_result_ref: resolve(stoppedResultPath), predecessor_result_sha256: sha(resultBytes), predecessor_error: stopped.error,
  token_cap: cell.limits.task_state_tokens, initial_measured_tokens: first ?? null, final_measured_tokens: last ?? null,
  tokenizer_calls: tokenizer.receipts.length, receipts: tokenizer.receipts, projection: projection ? safeProjection : null, failure,
  model_calls: 0, claim_ceiling: 'Exact stopped-trace state fitting through the provider tokenizer; no model outcome or benchmark claim.',
  authority_effect: 'none', open_questions_ref: 'agent-reasoning-engine/research/contextbench-v1/PLAN-round8.md#open-questions'};
writeFileSync(resolve(outputPath), JSON.stringify(replay, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({status: replay.status, initial_measured_tokens: first, final_measured_tokens: last, tokenizer_calls: replay.tokenizer_calls, evicted: projection ? projection.fit.evicted_evidence + projection.fit.evicted_outcomes : null, failure}));
if (!passed) process.exitCode = 1;
