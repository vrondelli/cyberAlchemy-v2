import {readFileSync, writeFileSync, realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSecretProviderRegistry, createSecretReference} from '../secret-provider.mjs';
import {createSopsAgeProcessSecretProvider} from '../sops-age-secret-provider.mjs';
import {createReadOnlyToolRuntime} from '../read-only-tools.mjs';
import {createGlmClient, MODEL, need} from './transport.mjs';
import {runGlmAgent} from './agent.mjs';
import {validateRetentionPolicy} from './retention.mjs';
import {validateDeliveryPolicy} from './delivery.mjs';
import {completionBudget,validateCompletionPolicy,validateCompletionRequirements,completionTokenMargin} from './completion.mjs';
import {validateSourcePolicy} from './source-preservation.mjs';

const bridgePaths = ['python_command', 'project_root', 'key_file', 'vault_file'];

export function parseCredential(credential) {
  need(credential && typeof credential === 'object' && !Array.isArray(credential) && Object.keys(credential).every(k => ['provider_kind','provider_id','locator','timeout_ms',...bridgePaths].includes(k)), 'credential-config-invalid');
  need(credential.provider_kind === 'local-sops-age' && credential.provider_id === 'local-model-secrets' && credential.locator === 'model/zai-key', 'credential-config-invalid');
  for (const key of bridgePaths) {
    if (Object.hasOwn(credential, key)) need(typeof credential[key] === 'string' && credential[key].length > 0 && !credential[key].includes('\0'), 'credential-path-invalid');
  }
  if(Object.hasOwn(credential,'timeout_ms'))need(Number.isSafeInteger(credential.timeout_ms)&&credential.timeout_ms>=1000&&credential.timeout_ms<=300000,'credential-timeout-invalid');
  return structuredClone(credential);
}

export function parseConfig(value) {
  const keys = ['schema_version','model','credential','run_id','request','fixture_root','state_directory','observation_allowlist','mutation_allowlist','context_limit','recycle_at','safety_margin','retention_policy','delivery_policy','completion_policy','source_policy','completion_requirements','model_timeout_ms','maximum_model_retries'];
  need(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(k => keys.includes(k)), 'config-fields-invalid');
  need(value.schema_version === 'are.glm-flash-config/v1' && value.model === MODEL, 'config-model-invalid');
  parseCredential(value.credential);
  if(Object.hasOwn(value,'maximum_model_retries'))need(Number.isSafeInteger(value.maximum_model_retries)&&value.maximum_model_retries>=0&&value.maximum_model_retries<=2,'config-model-retries-invalid');
  if(Object.hasOwn(value,'model_timeout_ms'))need(Number.isSafeInteger(value.model_timeout_ms)&&value.model_timeout_ms>=30000&&value.model_timeout_ms<=60000,'config-model-timeout-invalid');
  validateRetentionPolicy(value.retention_policy);
  validateDeliveryPolicy(value.delivery_policy);
  need(validateCompletionPolicy(value.completion_policy)==='none'||value.delivery_policy==='bounded-reads-v1','completion-requires-bounded-delivery');
  need(validateSourcePolicy(value.source_policy)==='none'||value.delivery_policy==='bounded-reads-v1','source-requires-bounded-delivery');
  for (const key of ['run_id','request','fixture_root','state_directory']) need(typeof value[key] === 'string' && value[key].length > 0 && !value[key].includes('\0'), 'config-string-invalid');
  for (const key of ['observation_allowlist','mutation_allowlist']) need(Array.isArray(value[key]) && value[key].length > 0 && value[key].every(p => typeof p === 'string' && p.length > 0), 'config-allowlist-invalid');
  need(value.mutation_allowlist.every(p => value.observation_allowlist.includes(p)), 'mutation-not-observable');
  for (const key of ['context_limit','recycle_at','safety_margin']) need(Number.isSafeInteger(value[key]) && value[key] > 0, 'config-budget-invalid');
  // Deliberately far below the advertised model window until long-context conformance.
  need(value.context_limit <= 32768 && value.recycle_at <= value.context_limit - value.safety_margin && value.recycle_at > 2048, 'config-budget-invalid');
  validateCompletionRequirements(value.completion_requirements,value.observation_allowlist,value.completion_policy);
  return structuredClone(value);
}

// Client injection is a trusted programmatic test seam, never a JSON config field.
export async function runConfiguredGlm(config, {create_client = createGlmClient} = {}) {
  const c = parseConfig(config);
  const root = realpathSync(c.fixture_root);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 600000);
  try {
    const provider = createSopsAgeProcessSecretProvider({provider_id: c.credential.provider_id,
      ...Object.fromEntries(bridgePaths.filter(key => Object.hasOwn(c.credential, key)).map(key => [key, c.credential[key]])),
      ...(Object.hasOwn(c.credential,'timeout_ms')?{timeout_ms:c.credential.timeout_ms}:{})});
    const registry = createSecretProviderRegistry({providers: [provider]});
    const reference = createSecretReference({provider_id: c.credential.provider_id, locator: c.credential.locator});
    const client = create_client({...completionBudget(c.completion_policy,c.recycle_at),...(c.maximum_model_retries===undefined?{}:{maximum_model_retries:c.maximum_model_retries}),...(c.model_timeout_ms===undefined?{}:{model_timeout_ms:c.model_timeout_ms}),token_margin:completionTokenMargin(c.completion_policy),api_key_ref: reference, secret_registry: registry, signal: controller.signal});
    const tools = createReadOnlyToolRuntime({repository_root: root, observation_allowlist: c.observation_allowlist, maximum_result_bytes: 12000});
    return await runGlmAgent({run_id: c.run_id, request: c.request, fixture_root: root, client, retention_policy: c.retention_policy, delivery_policy: c.delivery_policy, completion_policy:c.completion_policy, completion_requirements:c.completion_requirements, source_policy:c.source_policy,
      observation_allowlist: c.observation_allowlist, mutation_allowlist: c.mutation_allowlist,
      verification_command: [], tool_runtime: tools, tool_policy: {allow: [...tools.tool_names,'read-context-evidence',...(c.delivery_policy==='bounded-reads-v1'?['read-inspection-evidence']:[])]}, signal: controller.signal,
      context_recycling: {directory: resolve(c.state_directory), context_limit: c.context_limit, recycle_at: c.recycle_at, safety_margin: c.safety_margin,
        state: {objective: c.request, constraints: ['Propose only; preserve test files.'], completed: [], pending: [c.request], facts: [], lessons: [], evidence_refs: [`run:${c.run_id}`]}}});
  } finally { clearTimeout(timer); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    need(process.argv.length === 4, 'usage-config-output-required');
    // Reserve output before making paid calls; never overwrite an existing result.
    const {openSync, closeSync} = await import('node:fs');
    const fd = openSync(resolve(process.argv[3]), 'wx', 0o600);
    try {
      const result = await runConfiguredGlm(JSON.parse(readFileSync(resolve(process.argv[2]), 'utf8')));
      writeFileSync(fd, JSON.stringify(result, null, 2) + '\n');
      console.log(JSON.stringify({status: result.status, model: MODEL, output: resolve(process.argv[3]), reasons: result.reason_codes ?? []}));
      process.exitCode = result.status === 'AWAITING_APPROVAL' ? 0 : 1;
    } finally { closeSync(fd); }
  } catch { console.error('GLM runner failed; check configuration and private output destination.'); process.exitCode = 1; }
}
