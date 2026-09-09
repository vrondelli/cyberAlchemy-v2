// Dashboard candidate using existing reference snapshots. Open questions: PLAN.md.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const runtime=fileURLToPath(new URL('../../runtime/',import.meta.url));
const snapshots=['workspace.generated.ts','foundation.generated.ts','foundation-capability-instance.generated.ts'];
const hashes=()=>Object.fromEntries(snapshots.map(file=>[file,createHash('sha256').update(readFileSync(resolve(runtime,'src/domain',file))).digest('hex')]));
const before=hashes();
for(const [command,args] of [['tsc',['--noEmit']],['vite',['build','--outDir','dist-dashboard']]]){
 const result=spawnSync(resolve(runtime,'node_modules/.bin',command),args,{cwd:runtime,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);
}
assert.deepEqual(hashes(),before,'REFERENCE_SNAPSHOT_CHANGED_DURING_BUILD');
writeFileSync(resolve(runtime,'dist-dashboard/dashboard-build.json'),JSON.stringify({schema_version:'workspace-dashboard-build/v1-candidate',reference_snapshot_mode:'bundled-not-regenerated',reference_snapshot_sha256:before,authority_effect:'none',open_questions_ref:'workspace/plans/orchestrator-integration/PLAN.md#open-questions'},null,2)+'\n');
