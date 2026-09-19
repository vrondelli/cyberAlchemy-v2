// Dedicated tokenizer-only factory for reviewed historical H-L prompt projections.
import {createHistoricalPromptTokenizer} from './recent-evidence-historical-tokenizer-r2.mjs';
import {createIndexTokenizer} from './packet-diversity-v1/live-client-admission-v5.mjs';
import {credentials} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/glm-episodes-v1/analysis/provider-study-v1/calibrate.mjs';

const need = (value, message) => { if (!value) throw Error('recent-populated-client.' + message); };

export function recentPopulatedLiveClientFactory({credential_path, signal, before_dispatch}) {
  need(signal instanceof AbortSignal && !signal.aborted && typeof before_dispatch === 'function', 'admission');
  const {registry, reference} = credentials(credential_path);
  return Object.freeze({
    create_client({cell, signal: cellSignal, record_event = async () => {}}) {
      need(cellSignal === signal && cell?.comparison_arm === 'recent-evidence-ledger', 'cell');
      need(cell.context_limit === 8000 && cell.limits?.output_cap === 2048 &&
        cell.limits.total_tokens === 96000 && cell.limits.maximum_calls === 96, 'budget');
      need(cell.provider_profile?.request_tokenizer_transport_attempts === 1 &&
        cell.provider_profile.index_tokenizer_transport_attempts === 1, 'single-attempt-policy');
      const client = createHistoricalPromptTokenizer({credential_path, signal,
        maximum_calls: cell.provider_profile.request_tokenizer_maximum_calls,
        token_margin: cell.provider_profile.token_margin, output_cap: cell.limits.output_cap,
        before_dispatch, record: record_event});
      const index = createIndexTokenizer({registry, reference,
        maximum_calls: cell.provider_profile.index_tokenizer_maximum_calls,
        maximum_transport_attempts: 1, record: receipt => record_event({kind: 'index-tokenizer', receipt}),
        signal, before_dispatch});
      return Object.freeze({...client, index_receipts: index.receipts, measure_index: index.measure});
    },
    measure_index_tokens: (text, client) => client.measure_index(text),
  });
}
