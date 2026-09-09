import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const mode = process.argv[process.argv.indexOf('--mode') + 1];
const files = {'local-benchmark': ['run.mjs'], 'live-canary': ['live.mjs'], mock: ['--test', '../../../packages/codex-app-server-wrapper/test/interaction-learning.test.mjs']};
if (!Object.hasOwn(files, mode)) throw Error('Use --mode mock|local-benchmark|live-canary');
const args = files[mode].map(x => x.startsWith('--') ? x : resolve(import.meta.dirname, x));
const result = spawnSync(process.execPath, args, {encoding:'utf8', timeout:mode==='live-canary'?31*60*1000:120000, maxBuffer:16*1024*1024});
if (mode==='mock') console.log(JSON.stringify({schema_version:'are.interaction-learning-mock/v1',status:result.status===0?'PASS':'FAIL',output:result.stdout,diagnostic:result.stderr,
  claim_limit:'Labeled mock research and comparison measurements verify branch and persistence behavior, not empirical improvement.',authority_effect:'none'},null,2));
else process.stdout.write(result.stdout ?? '');
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.status ?? 1;
