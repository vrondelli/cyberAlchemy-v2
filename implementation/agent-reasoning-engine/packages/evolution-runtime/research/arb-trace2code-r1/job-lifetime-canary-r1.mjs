// Synthetic 20-second supervisor probe only, never executes benchmark/model calls.
// Open Questions: evidence/G01-CAMPAIGN-DURABILITY-R1.json.
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
const root=process.argv[2];
if(process.argv.length!==3 || !/^\/tmp\/are-job-lifetime-canary-[A-Za-z0-9_-]+$/.test(root)) throw Error('canary.exact-private-tmp-root');
mkdirSync(root,{mode:0o700});
createReceipt(join(root,'STARTED.json'),{status:'synthetic-started',pid:process.pid,started_at:new Date().toISOString(),provider_calls:0});
await new Promise(resolve=>setTimeout(resolve,20000));
createReceipt(join(root,'RESULT.json'),{status:'synthetic-complete',pid:process.pid,completed_at:new Date().toISOString(),provider_calls:0});
