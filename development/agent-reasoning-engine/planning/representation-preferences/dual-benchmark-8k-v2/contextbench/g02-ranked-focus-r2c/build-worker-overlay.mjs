// Mechanical opt-in worker overlay for the previously measured screen worker.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const base=resolve(here,'../deepseek-pilot-are-worker-screen-v1.mjs');
const destination=resolve(here,'deepseek-pilot-are-worker-screen-v2.mjs');
const sha=text=>createHash('sha256').update(text).digest('hex');
const source=readFileSync(base,'utf8');
if(sha(source)!=='f7bde089a1031aa6ec42129235fd854e36a1ec4daa049d370ec3a633edd7a211')throw Error('screen-v2.source-drift');
const oldCell=" const cell=full?buildFullWindowCell({config,task_id,variant}):buildComparisonCell({config,task_id,arm:'current-are'});";
const newCell=` const originalCell=full?buildFullWindowCell({config,task_id,variant}):buildComparisonCell({config,task_id,arm:'current-are'});
 const reserve=parseScreenTokenCeiling(process.env.ARE_SCREEN_FINALIZATION_RESERVE_TOKENS);
 if(reserve!==null&&(ceiling===null||reserve>=ceiling))throw Error('screen.invalid-finalization-reserve');
 const cell=reserve===null?originalCell:{...originalCell,limits:{...originalCell.limits,total_tokens:ceiling,finalization_reserve_tokens:reserve}};`;
const oldSeal="...(ceiling===null?{}:{screen_token_ceiling:ceiling,screen_budget:screenTokenBudget(client?.receipts??[],ceiling)})";
const newSeal="...(ceiling===null?{}:{screen_token_ceiling:ceiling,screen_budget:screenTokenBudget(client?.receipts??[],ceiling)}),...(reserve===null?{}:{screen_finalization_reserve_tokens:reserve})";
if(source.split(oldCell).length!==2||source.split(oldSeal).length!==2)throw Error('screen-v2.patch-anchor');
const candidate=source.replace(oldCell,newCell).replace(oldSeal,newSeal);
writeFileSync(destination,candidate,{flag:'wx',mode:0o600});
console.log(JSON.stringify({base_sha256:sha(source),candidate_sha256:sha(candidate),destination}));
