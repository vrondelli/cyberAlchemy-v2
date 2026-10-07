// Freeze one previously exposed G01 task for a live candidate-only mechanism
// diagnostic. The original paired campaign and its receipts remain immutable.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve, relative} from 'node:path';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const need = (value, code) => {if (!value) throw Error(`g01-span-live-freeze.${code}`);};
const sourceTag = 'g01-shared-reliability-source-r4-shallow-r1';
const policy = 'source-only-go-selected-subspan-r1';
const scriptRelative = 'implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/span-refinement-r1.mjs';

export function prepareExposedSpanLive({priorFreezePath, priorFreezeSha256, sourceRoot, outputRoot}) {
  need([priorFreezePath, sourceRoot, outputRoot].every(x => typeof x === 'string' && x.startsWith('/') && resolve(x) === x), 'absolute-paths');
  const priorBytes = readFileSync(priorFreezePath);
  need(sha(priorBytes) === priorFreezeSha256, 'prior-freeze-drift');
  const prior = JSON.parse(priorBytes);
  need(prior.schema_version === 'are.g01-fast-live-freeze/v1' && prior.arm === 'intent-anchor-terminal-shortlist-distinctive-reasoning-fallback-r1' &&
    prior.sources.every(x => x.path.includes(`/${sourceTag}/`) || x.path === JSON.parse(readFileSync(prior.config_path)).tasks[0].task_path), 'prior-shape');
  need(!existsSync(outputRoot) && existsSync(sourceRoot), 'fresh-roots');
  const sourcePrefix = `/opt/are/evolution-runtime/${sourceTag}/`;
  const sources = prior.sources.map(item => {
    if (!item.path.startsWith(sourcePrefix)) return item;
    const file = join(sourceRoot, relative(sourcePrefix, item.path));
    return {path: file, sha256: sha(readFileSync(file))};
  });
  const rulePath = join(sourceRoot, scriptRelative);
  need(existsSync(rulePath), 'rule-source-missing');
  sources.push({path: rulePath, sha256: sha(readFileSync(rulePath))});
  mkdirSync(outputRoot, {recursive: false, mode: 0o700});
  const freeze = {...prior, output_root: join(outputRoot, 'candidate'), sources, span_refinement_policy: policy,
    claim_ceiling: 'Exposed-task mechanism diagnostic only; no prospective benchmark or ARE-vs-control proof.',
    predecessor_freeze_sha256: priorFreezeSha256, builder_sha256: sha(readFileSync(import.meta.filename)),
    open_questions: ['Does the live, receipt-bound source-only rule trigger and improve this exposed task without changing file selection?']};
  const path = join(outputRoot, 'CANDIDATE-FREEZE.json');
  writeFileSync(path, JSON.stringify(freeze, null, 2) + '\n', {flag: 'wx', mode: 0o600});
  return {freeze_path: path, freeze_sha256: sha(readFileSync(path)), output_root: freeze.output_root, source_count: sources.length};
}

if (process.argv[1] === import.meta.filename) {
  try {console.log(JSON.stringify(prepareExposedSpanLive({priorFreezePath: process.argv[2], priorFreezeSha256: process.argv[3], sourceRoot: process.argv[4], outputRoot: process.argv[5]})));}
  catch (error) {console.error(JSON.stringify({status: 'failed', error: String(error.message)})); process.exitCode = 2;}
}
