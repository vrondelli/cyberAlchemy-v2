// Offline owner replay of a copied installed task; no dispatch. Open questions: PLAN.md.
import assert from 'node:assert/strict';
import {readFileSync,cpSync,mkdtempSync,rmSync,readdirSync,lstatSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {projectNativeRuns} from '../../runtime/src/features/runs/run-adapters.ts';
assert.equal(process.argv.length,4,'Usage: node verify-existing-native.mjs CONSOLE_CONFIG_JSON NEW_DRIVER');
const config=JSON.parse(readFileSync(resolve(process.argv[2]))),driver=resolve(process.argv[3]),exec=promisify(execFile);
assert.equal(config.mode,'native-fixture');
const origin=`http://127.0.0.1:${config.port}`;
async function snapshot(){const response=await fetch(origin+'/api/v1/native-tasks');assert.equal(response.status,200);return response.json();}
function files(root){return readdirSync(root).sort().flatMap(name=>{const p=join(root,name),s=lstatSync(p);assert.ok(!s.isSymbolicLink(),'SYMLINK_NOT_ACCEPTED');return s.isDirectory()?files(p):[{path:p,sha256:createHash('sha256').update(readFileSync(p)).digest('hex')}];});}
const before=await snapshot();assert.equal(before.active,false,'CONSOLE_MUST_BE_IDLE');
const savedBefore=readFileSync(resolve(config.state,'tasks.json'));
const job=before.jobs.find(job=>job.status==='succeeded');assert.ok(job,'NO_COMPLETED_TASK');assert.match(job.id,/^[a-f0-9-]{36}$/);
const original=resolve(config.state,job.id,'orchestrator'),binding=resolve(config.state,job.id,'binding.json'),originalHashes=files(original),root=mkdtempSync('/tmp/wrp-');
try{
 cpSync(original,resolve(root,'orchestrator'),{recursive:true});cpSync(binding,resolve(root,'binding.json'));
 const {stdout}=await exec(driver,[resolve(root,'orchestrator'),resolve(root,'binding.json'),resolve(root,'unused.sock'),resolve(root,'unused.token'),'replay'],{timeout:15000,maxBuffer:1024*1024});
 const owner=JSON.parse(stdout);assert.equal(owner.replayed,true);assert.equal(owner.schema_version,'are-native-owner-result/v1');
 const now=Date.now(),source={runtimeId:'local-native-console-01',label:'Local native console',location:'local',observedAtMs:now,nowMs:now,maxAgeMs:5000,available:true};
 const projected=await projectNativeRuns(before,source,new Map([[job.id,owner]]));const run=projected.runs.find(r=>r.launchId===job.id);
 assert.equal(run.runRef.runKey,owner.run_key);assert.equal(run.result.verification,'owner-verified');assert.equal(run.result.content,job.result.output);assert.equal(run.mode,'fixture');assert.equal(projected.runs.filter(r=>r.launchId===job.id).length,1);
 assert.deepEqual(files(original),originalHashes,'INSTALLED_HISTORY_CHANGED_DURING_CHECK');assert.deepEqual(readFileSync(resolve(config.state,'tasks.json')),savedBefore,'INSTALLED_LAUNCH_RECORDS_CHANGED_DURING_CHECK');
 const after=await snapshot();assert.equal(after.fixture_budget_remaining,before.fixture_budget_remaining);assert.equal(after.jobs.length,before.jobs.length);
 console.log(JSON.stringify({schema_version:'workspace-run-adapter-existing-history-evidence/v1',status:'PASS',source:'local-native-console-01',launch_id:job.id,view_id:run.viewId,owner_run_key:run.runRef.runKey,verification:run.result.verification,icon:run.icon,mode:run.mode,run_count:projected.runs.length,fixture_budget_before:before.fixture_budget_remaining,fixture_budget_after:after.fixture_budget_remaining,installed_history_unchanged:true,installed_launch_records_unchanged:true,replayed_from_copy:true,external_model_calls:0,open_questions_ref:'PLAN.md#open-questions'},null,2));
}finally{rmSync(root,{recursive:true,force:true});}
