// Mechanical overlay builder against immutable full-cycle-80 ranked acquisition.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const base=resolve(here,'../full-cycle-80/snapshot/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/ranked-source-acquisition.mjs');
const destination=resolve(here,'ranked-source-acquisition.mjs');
const sha=text=>createHash('sha256').update(text).digest('hex');
const source=readFileSync(base,'utf8');
if(sha(source)!=='43cfc984f0dd0d9f53030c5fb8358d91b79f1c77b5adf1df2e32623c284497f6')throw Error('ranked-focus.frozen-source-drift');
const anchor='  const primer = query(problem_statement);';
if(source.split(anchor).length!==2)throw Error('ranked-focus.patch-anchor');
const replacement="  const primer = query(problem_statement.replace(/<!--[\\s\\S]*?-->/g, ' ').replace(/https?:\\/\\/\\S+/g, ' '));";
const candidate=source.replace(anchor,replacement);
writeFileSync(destination,candidate,{flag:'wx',mode:0o600});
console.log(JSON.stringify({base_sha256:sha(source),candidate_sha256:sha(candidate),destination}));
