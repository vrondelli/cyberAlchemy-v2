// Three distinct tokenizer-only probes for the state measurement path. No model calls.
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {credentials} from '../glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';
import {createIndexTokenizer} from './live-client.mjs';

const [credentialPath, outputPath] = process.argv.slice(2);
if (!outputPath) throw Error('credential and output paths required');
const {registry, reference} = credentials(credentialPath);
const events = [];
const tokenizer = createIndexTokenizer({registry, reference, maximum_calls: 3, record: event => events.push(structuredClone(event))});
const probes = [
  'ARE ContextBench state tokenizer health probe alpha.',
  'ARE ContextBench state tokenizer health probe beta with distinct bytes.',
  'ARE ContextBench state tokenizer health probe gamma with a third distinct request.',
];
const rows = [];
let failure = null;
try {
  for (let index = 0; index < probes.length; index++) rows.push({index, tokens: await tokenizer.measure(probes[index])});
} catch (error) {
  failure = error.message;
} finally {
  const passed = failure === null && rows.length === probes.length && tokenizer.receipts.every(receipt => receipt.dispatched && receipt.status === 200 && Number.isSafeInteger(receipt.tokens));
  const result = {
    schema_version: 'are.contextbench-state-tokenizer-preflight/v1',
    status: passed ? 'passed' : 'failed',
    endpoint: 'https://api.z.ai/api/paas/v4/tokenizer',
    probes: rows,
    receipts: tokenizer.receipts,
    event_count: events.length,
    maximum_calls: 3,
    model_calls: 0,
    failure,
    claim_ceiling: 'Three distinct tokenizer-path requests only; no model endpoint or benchmark outcome claim.',
    authority_effect: 'none',
    open_questions_ref: 'agent-reasoning-engine/research/contextbench-v1/PLAN-round7.md#open-questions',
  };
  writeFileSync(resolve(outputPath), JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({status: result.status, probes: rows.length, model_calls: 0, failure}));
  if (!passed) process.exitCode = 1;
}
