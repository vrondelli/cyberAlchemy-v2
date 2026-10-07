// Compact, no-gold settlement from the sealed DSH transport ledger.
import {readFileSync,writeFileSync} from 'node:fs';
import {reconcileTransport} from '/repo/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/deepseek-durable-transport.mjs';

const root='/pair/runs/dsh',settlement=JSON.parse(readFileSync(root+'/SETTLEMENT.json','utf8'));
if(settlement.container_state?.Running||settlement.proxy_state?.Running)throw Error('dsh-account.unsettled');
const accounting=reconcileTransport(root+'/transport');
const result={schema_version:'are.g02-task-path-dsh-accounting/v1',status:'stopped_without_final_selection',
  exit_code:settlement.exit_code,elapsed_seconds:settlement.elapsed_seconds,
  failure_code:'dsh-transport.request-budget',
  attempts:accounting.attempts,model_calls:accounting.model_calls,
  known_input_tokens:accounting.known_input_tokens,
  known_output_tokens:accounting.known_output_tokens,
  known_total_tokens:accounting.known_total_tokens,
  unknown_usage_dispatched_requests:accounting.unknown_usage_dispatched_requests,
  cost_complete:accounting.cost_complete,
  claim_ceiling:'No DSH final selection; quality comparison is unscorable.',authority_effect:'none'};
writeFileSync('/out/DSH-ACCOUNTING.json',JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify(result));
