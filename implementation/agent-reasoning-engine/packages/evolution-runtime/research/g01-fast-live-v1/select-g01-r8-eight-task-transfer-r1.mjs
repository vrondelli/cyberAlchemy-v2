// Score-blind, no-model residual development selection. Emits JSON to stdout only.
// This is not a 24-pair campaign or a confirmation cohort.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

const root = '/home/vlad_/are-benchmark-archive';
const input = new Map([
  ['census', [`${root}/g01-r16-source-supply-r1/SUPPLY-CENSUS.json`, '35b8990980132ce22cb8faf657c4087aea4d7cec0a615f0ad7fd7efb8b28e757']],
  ['source', [`${root}/g01-r16-dev-screen-r1/SOURCE-ONLY-MANIFEST.json`, '6f969430e052295d9bf495078589a39379518bb7747a6c8ac9beee00556e446d']],
  ['lineage', [`${root}/g01-r16-dev-screen-r1/GOLD-LINEAGE-ELIGIBILITY.json`, '646c3d367332531c8d7bd82d225ded47edadccc08230e395e00c965515aea5f0']],
  ['r1', [`${root}/g01-r16-clean-cohort-candidate-r1/COHORT-CANDIDATE.json`, '13debf87a53346d0aa667c7b49b1fd0b3291d922d09a5a2a2533e4000365405e']],
  ['r2', [`${root}/g01-r16-clean-cohort-candidate-r2/COHORT-CANDIDATE.json`, 'b9fbc9c5462419d5c1857379835a52425194560055dca8325c9b7d6e049ac112']],
  ['g02', [`${root}/g02-product-replication-r11-20261002/definition/DEFINITION.json`, '0ec225f9df7cc0140dffeee53da9e57c4f2b92176b7b15c8c6fb48728bd46ddf']],
]);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (ok, reason) => {if (!ok) throw Error(`g01-r8-eight-task-transfer.${reason}`);};
const idHash = ids => sha([...ids].sort().join('\n') + '\n');

function main() {
  need(process.argv.length === 2, 'arguments');
  const data = {};
  for (const [key, [path, digest]] of input) {
    const bytes = readFileSync(path);
    need(sha(bytes) === digest, `input-drift:${key}`);
    data[key] = JSON.parse(bytes);
  }
  need(data.census.unscreened_source_valid === 99 && data.census.known_clean_unselected === 5 &&
    data.lineage.summary.clean === 31 && data.lineage.summary.tasks === 99 &&
    data.source.ordered_tasks.length === 99 && data.r1.ordered_tasks.length === 24 &&
    data.r2.ordered_tasks.length === 24 && data.g02.ordered_pairs.length === 24,
  'input-shape');
  need(data.g02.status === 'frozen-before-model-dispatch', 'g02-freeze');
  const used = new Set([...data.r1.ordered_tasks, ...data.r2.ordered_tasks].map(row => row.instance_id));
  need(used.size === 26, 'g01-selected-union');
  const g02 = new Set(data.g02.ordered_pairs.map(row => row.instance_id));
  need(g02.size === 24, 'g02-selected-union');
  const source = new Map(data.source.ordered_tasks.map(row => [row.instance_id, row]));
  need(source.size === 99, 'source-duplicate');
  const clean = data.lineage.tasks.filter(row => row.gold_lineage_clean === true);
  need(clean.length === 31, 'clean-count');
  const left = clean.filter(row => !used.has(row.instance_id));
  need(left.length === 10 && left.filter(row => g02.has(row.instance_id)).length === 2,
    'cross-benchmark-residual');
  const selected = left.filter(row => !g02.has(row.instance_id)).map(row => {
    const src = source.get(row.instance_id);
    need(src && src.repo === row.repo && src.language === row.language,
      `source-join:${row.instance_id}`);
    return {instance_id: src.instance_id, source: src.source, language: src.language,
      repo: src.repo, repo_url: src.repo_url, base_commit: src.base_commit};
  }).sort((a, b) => a.instance_id.localeCompare(b.instance_id));
  need(selected.length === 8 && selected.filter(row => row.repo === 'django/django').length === 5 &&
    selected.filter(row => row.repo === 'huggingface/transformers').length === 3 &&
    selected.every(row => !used.has(row.instance_id) && !g02.has(row.instance_id)),
  'candidate-shape');
  const output = {schema_version: 'are.g01-r8-eight-task-development-transfer-candidate/v1',
    status: 'source-only-not-frozen', selection_rule: 'exhaustive pinned clean residual after G01 r16 r1/r2 and frozen G02 r11 exclusions; lexical instance_id order',
    source_partition: 'pinned-903-development', input_sha256: Object.fromEntries([...input].map(([key, [, digest]]) => [key, digest])),
    g01_selected_union_count: used.size, g02_selected_count: g02.size,
    g02_overlap_count: 2, selected_count: selected.length,
    task_id_set_sha256: idHash(selected.map(row => row.instance_id)),
    selected, model_calls: 0, gold_values_or_paths_used: false,
    reserved_confirmation_opened: false, authority_effect: 'none',
    claim_ceiling: 'Eight-task source-only development transfer candidate; not native-admitted, not a 24-pair benchmark, and no superiority evidence',
    open_questions: ['Will all eight pass exact cache/index and native-reference admission?',
      'What independent population can support a fresh full G01 claim gate?']};
  console.log(JSON.stringify(output, null, 2));
}

try {main();} catch (error) {console.error(JSON.stringify({status: 'failed', error: String(error.message)})); process.exitCode = 2;}
