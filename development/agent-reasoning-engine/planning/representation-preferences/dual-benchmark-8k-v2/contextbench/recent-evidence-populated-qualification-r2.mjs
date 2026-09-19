// Real-tokenizer qualification of H-L ledgers rendered into reviewed discovery requests.
// Open questions: RECENT-EVIDENCE-LEDGER-PROTOCOL-R1.md.
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {buildCoverageLedger, renderCoverageLedger} from './recent-evidence-ledger-r1.mjs';
import {buildCoverageLedger as buildHistoricalLedger} from './ranked-read-ledger-r1.mjs';
import {providerAttemptHealth} from './provider-attempt-health.mjs';
import {retainedReasoning} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/accounting-v1/accounting.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';

const PREFIX = 'Evidence coverage ledger (not relevance or gold coverage): ';
const hash = value => createHash('sha256').update(value).digest('hex');
const need = (value, message) => { if (!value) throw Error('recent-populated-qualification.' + message); };
const modelCount = client => [...(client?.receipts ?? []), ...(client?.index_receipts ?? [])]
  .filter(receipt => receipt?.kind === 'model').length;
const canonical = entries => entries.map(entry => stable(entry)).sort();

export async function qualifyRecentPopulatedRequests({task, cell, events, receipts, snapshots, ranked_evidence,
  donor_sha256, out, persistence, signal, create_client, measure_index_tokens, before_measure}) {
  need(signal instanceof AbortSignal && !signal.aborted, 'active-signal');
  need(cell?.comparison_arm === 'recent-evidence-ledger' && cell.instance_id === task.instance_id &&
    cell.context_limit === 8000 && cell.limits?.output_cap === 2048 && cell.limits.total_tokens === 96000 &&
    cell.limits.maximum_calls === 96 && cell.provider_profile?.token_margin === 512, 'fixed-cell');
  need(Array.isArray(events) && Array.isArray(receipts) && Array.isArray(snapshots) && ranked_evidence instanceof Map,
    'historical-inputs');
  need(typeof create_client === 'function' && typeof measure_index_tokens === 'function' &&
    typeof before_measure === 'function', 'callbacks');
  let client;
  const rows = [], captures = [];
  const record = event => persistence.append(join(out, 'events.jsonl'), stable(event) + '\n');
  try {
    need(await before_measure() === true, 'storage-admission');
    client = await create_client({cell, task, signal, record_event: record});
    need(Array.isArray(client.receipts) && Array.isArray(client.index_receipts) &&
      typeof client.measureHistoricalEnvelope === 'function', 'client');
    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      if (event.kind !== 'request-capture' || event.phase !== 'discover') continue;
      const response = events.slice(index + 1).find(candidate => candidate.kind === 'response-capture');
      need(response?.phase === 'discover', 'response-capture');
      const receipt_index = response.response_capture?.receipt_index;
      need(Number.isSafeInteger(receipt_index) && receipt_index >= 0 && receipt_index < receipts.length,
        'receipt-index');
      const historicalReceipts = receipts.slice(0, receipt_index);
      const input = {captures, receipts: historicalReceipts, snapshots, ranked_evidence};
      const historical = buildHistoricalLedger(input), recent = buildCoverageLedger(input);
      need(stable(canonical(historical.entries)) === stable(canonical(recent.entries)), 'coverage-changed');
      const rendered = await renderCoverageLedger({ledger: recent,
        measure_tokens: async text => {
          need(await before_measure() === true, 'storage-admission');
          return measure_index_tokens(text, client);
        }, maximum_tokens: 384, maximum_entries: 4});
      const wire = JSON.parse(event.capture.prompt), messages = structuredClone(wire.messages);
      const positions = messages.map((message, position) => ({message, position}))
        .filter(({message}) => message.role === 'system' && message.content?.startsWith(PREFIX));
      need(positions.length === 1 && Array.isArray(wire.tools), 'ledger-message');
      const historicalView = JSON.parse(positions[0].message.content.slice(PREFIX.length));
      const expectedHistorical = historical.entries.slice(0, historicalView.entries.length)
        .map(({observation_ids, ...entry}) => entry);
      need(stable(expectedHistorical) === stable(historicalView.entries) &&
        historical.entries.length - historicalView.entries.length === historicalView.omitted_entries,
      'historical-ledger-binding');
      messages[positions[0].position].content = PREFIX + rendered.text;
      const prompt = stable({messages, tools: wire.tools});
      need(await before_measure() === true, 'storage-admission');
      const retained = retainedReasoning(messages, historicalReceipts);
      const envelope_tokens = await client.measureHistoricalEnvelope(prompt, historicalReceipts);
      need(Number.isSafeInteger(envelope_tokens) && envelope_tokens <= 8000, 'request-envelope');
      const request_sha256 = hash(stable({model: client.model, messages, tools: wire.tools}));
      const receipt = client.receipts.find(candidate => candidate.request_sha256 === request_sha256);
      need(receipt?.kind === 'tokenizer' && receipt.dispatched === true && receipt.status === 200 &&
        receipt.request_sha256 === request_sha256 &&
        receipt.input_tokens + cell.provider_profile.token_margin + retained.tokens + cell.limits.output_cap + 2 === envelope_tokens &&
        receipt.retained_reasoning_reservation === retained.tokens &&
        receipt.retained_reasoning_occurrences === retained.message_occurrences,
      'request-receipt');
      const candidateView = JSON.parse(rendered.text);
      rows.push({receipt_index, historical_prompt_sha256: event.capture.prompt_sha256,
        candidate_prompt_sha256: hash(prompt), request_sha256, envelope_tokens,
        projected_tokens: envelope_tokens - 2, retained_reasoning_reservation: retained.tokens,
        retained_reasoning_occurrences: retained.message_occurrences, ledger_entries: recent.entries.length,
        included_entries: rendered.included_entries, omitted_entries: rendered.omitted_entries,
        historical_paths: historicalView.entries.map(entry => entry.path),
        candidate_paths: candidateView.entries.map(entry => entry.path)});
      captures.push(event.capture);
    }
    need(rows.length > 0 && rows.some(row => row.ledger_entries > 0 && row.included_entries > 0), 'no-populated-ledger');
    need(modelCount(client) === 0 && client.receipts.length >= 1 && client.receipts.length <= rows.length &&
      client.receipts.every(receipt => receipt.kind === 'tokenizer') &&
      client.index_receipts.every(receipt => receipt.kind === 'index-tokenizer'), 'tokenizer-only');
    need(providerAttemptHealth([...client.receipts, ...client.index_receipts]).healthy, 'provider-health');
    const report = {schema: 'are.recent-evidence-populated-qualification/v2', qualified: true, model_calls: 0,
      task_id: task.instance_id, cell_sha256: hash(stable(cell)), donor_sha256, requests_measured: rows.length,
      populated_requests: rows.filter(row => row.included_entries > 0).length,
      maximum_envelope_tokens: Math.max(...rows.map(row => row.envelope_tokens)), rows,
      receipts: structuredClone(client.receipts), index_receipts: structuredClone(client.index_receipts),
      scope: 'Reviewed historical discovery requests with H-L ledger substitution and live tokenizer measurement; no model generation or quality claim.',
      live_generation_admitted: false};
    persistence.writeJson(join(out, 'RESULTS.json'), report);
    return report;
  } catch (error) {
    error.result = {qualified: false, model_calls: modelCount(client), rows,
      receipts: structuredClone(client?.receipts ?? []), index_receipts: structuredClone(client?.index_receipts ?? []),
      error: String(error.message)};
    throw error;
  }
}
