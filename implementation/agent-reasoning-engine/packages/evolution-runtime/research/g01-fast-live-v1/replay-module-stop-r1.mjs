// Read-only counterfactual: inspect delivered source at a historical stop check.
// It cannot replay GLM responses or infer the score of an unrun trajectory.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {bindInvestigationEvidence} from '../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-evidence-join-r1.mjs';
import {sourceCandidate} from '../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-terminal-r3.mjs';
import {hasModuleManifestStopEvidence} from '../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-episode-r3.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, code) => {if (!value) throw Error(`g01-module-stop-replay.${code}`);};

export function replayModuleStop({episodePath, taskPath, checkModelCalls = 12}) {
  need([episodePath, taskPath].every(x => typeof x === 'string' && x.startsWith('/') && resolve(x) === x), 'absolute-paths');
  need(Number.isSafeInteger(checkModelCalls) && checkModelCalls > 0, 'check-calls');
  const episodeBytes = readFileSync(episodePath), taskBytes = readFileSync(taskPath);
  const episode = JSON.parse(episodeBytes), task = JSON.parse(taskBytes);
  need(episode.status === 'final_context_selected' && episode.branches.length === 1 &&
    typeof task.problem_statement === 'string', 'input-shape');
  const models = episode.branches[0].receipt_indices.filter(index => episode.receipts[index]?.kind === 'model');
  need(models.length >= checkModelCalls, 'insufficient-model-receipts');
  const stopReceiptIndex = models[checkModelCalls - 1];
  const joined = bindInvestigationEvidence({branches: episode.branches, receipts: episode.receipts});
  const delivered = joined.read_observations.filter(read => read.first_confirmed_receipt <= stopReceiptIndex && sourceCandidate(read));
  const relevant = delivered.filter(read => read.path === 'go.mod').map(read => ({path: read.path, start_line: read.start_line, end_line: read.end_line, first_confirmed_receipt: read.first_confirmed_receipt}));
  return {schema_version: 'are.g01-module-stop-counterfactual/v1', status: 'read-only-event-replay',
    episode_sha256: sha(episodeBytes), task_sha256: sha(taskBytes), check_model_calls: checkModelCalls,
    stop_receipt_index: stopReceiptIndex, delivered_wide_ranges: new Set(delivered.map(read => `${read.path}\0${read.start_line}\0${read.end_line}\0${read.source_sha256}`)).size,
    root_go_mod_reads: relevant, module_manifest_evidence: hasModuleManifestStopEvidence(task.problem_statement, delivered),
    claim_ceiling: 'Historical delivered-read eligibility only; does not prove saved calls, final selection, quality, or cost for an unrun trajectory.'};
}

if (process.argv[1] === import.meta.filename) {
  try {console.log(JSON.stringify(replayModuleStop({episodePath: process.argv[2], taskPath: process.argv[3], checkModelCalls: Number(process.argv[4] ?? 12)})));}
  catch (error) {console.error(JSON.stringify({status: 'failed', error: String(error.message)})); process.exitCode = 2;}
}
