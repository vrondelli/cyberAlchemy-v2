// Freeze a source-only stopping-rule diagnostic on an already exposed G01 task.
// The predecessor result and its source snapshot remain immutable.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, code) => {if (!value) throw Error(`g01-module-stop-freeze.${code}`);};
const predecessorRoot = '/opt/are/evolution-runtime/g01-source-span-live-dev-r6/';
const episodeRelative = 'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/intent-anchor-episode-r3.mjs';

export function prepareExposedModuleStopLive({priorFreezePath, priorFreezeSha256, sourceRoot, outputRoot}) {
  need([priorFreezePath, sourceRoot, outputRoot].every(x => typeof x === 'string' && x.startsWith('/') && resolve(x) === x), 'absolute-paths');
  const priorBytes = readFileSync(priorFreezePath);
  need(sha(priorBytes) === priorFreezeSha256, 'prior-freeze-drift');
  const prior = JSON.parse(priorBytes);
  need(prior.schema_version === 'are.g01-fast-live-freeze/v1' &&
    prior.arm === 'intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1' &&
    prior.span_refinement_policy === 'source-only-go-selected-subspan-r1' &&
    prior.sources.some(x => x.path === predecessorRoot + episodeRelative), 'prior-shape');
  need(!existsSync(outputRoot) && existsSync(sourceRoot), 'fresh-roots');
  const sources = prior.sources.map(item => {
    if (!item.path.startsWith(predecessorRoot)) return item;
    const file = join(sourceRoot, relative(predecessorRoot, item.path));
    return {path: file, sha256: sha(readFileSync(file))};
  });
  const originalEpisode = prior.sources.find(item => item.path === predecessorRoot + episodeRelative);
  const newEpisode = sources.find(item => item.path === join(sourceRoot, episodeRelative));
  need(originalEpisode && newEpisode && originalEpisode.sha256 !== newEpisode.sha256, 'episode-unchanged');
  need(sources.filter(item => item.path === newEpisode.path).length === 1 &&
    sources.filter((item, index) => item.sha256 !== prior.sources[index].sha256).length === 1, 'unexpected-source-drift');
  mkdirSync(outputRoot, {recursive: false, mode: 0o700});
  const freeze = {...prior, output_root: join(outputRoot, 'candidate'), sources,
    module_manifest_stop_policy: 'source-only-root-go-mod-rename-r1',
    claim_ceiling: 'Exposed-task mechanism diagnostic only; no prospective benchmark or ARE-vs-control proof.',
    predecessor_freeze_sha256: priorFreezeSha256, builder_sha256: sha(readFileSync(import.meta.filename)),
    open_questions: ['Does a root go.mod read permit a lower-cost live selection without quality loss on this exposed task?']};
  const path = join(outputRoot, 'CANDIDATE-FREEZE.json');
  writeFileSync(path, JSON.stringify(freeze, null, 2) + '\n', {flag: 'wx', mode: 0o600});
  return {freeze_path: path, freeze_sha256: sha(readFileSync(path)), output_root: freeze.output_root, source_count: sources.length};
}

if (process.argv[1] === import.meta.filename) {
  try {console.log(JSON.stringify(prepareExposedModuleStopLive({priorFreezePath: process.argv[2], priorFreezeSha256: process.argv[3], sourceRoot: process.argv[4], outputRoot: process.argv[5]})));}
  catch (error) {console.error(JSON.stringify({status: 'failed', error: String(error.message)})); process.exitCode = 2;}
}
