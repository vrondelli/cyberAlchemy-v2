import fs from 'node:fs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {root,hash} from './matrix.mjs';
const base='development/reconciliation-v1/';
const read=p=>fs.readFileSync(path.join(root,p));
const json=p=>JSON.parse(read(p));
const before=json(base+'contracts/preservation-before.json');
const previous=json(before.previous_snapshot_ref);
const matrix=json(base+'contracts/support-matrix.json');
const sync=process.argv[2]?json(process.argv[2]):[];
const errors=[];
const check=(condition,label)=>{if(!condition)errors.push(label);};
const current=p=>fs.existsSync(path.join(root,p))?hash(read(p)):null;
const allowed=new Map(before.planning_preimages.map(p=>[p.path,p]));
for(const row of sync){check(allowed.has(row.path),'invalid synchronization path '+row.path);check(row.before_sha256===allowed.get(row.path)?.sha256,'invalid synchronization preimage '+row.path);check(/^[a-f0-9]{64}$/.test(row.after_sha256),'invalid synchronization digest');}
check(new Set(sync.map(r=>r.path)).size===sync.length,'duplicate synchronization');
for(const p of before.planning_preimages){check(hash(gunzipSync(Buffer.from(p.gzip_base64,'base64')))===p.sha256,'corrupt planning backup '+p.path);check(current(p.path)===(sync.find(r=>r.path===p.path)?.after_sha256??p.sha256),'planning drift '+p.path);}
for(const row of previous.selected_files){if(allowed.has(row.path))continue;check(current(row.path)===row.sha256,'prior source drift '+row.path);}
for(const row of before.prior_recovery_files)check(current(row.path)===row.sha256,'prior recovery changed '+row.path);
for(const row of matrix.evidence)check(current(row.path)===row.sha256,'matrix source changed '+row.path);
const git=(...args)=>execFileSync('git',['-C',root,...args],{maxBuffer:8*1024*1024}).toString();
check(git('rev-parse','HEAD').trim()===previous.git.head,'HEAD changed');
const prefix=path.relative(previous.git.root,root)+'/';
for(const row of previous.git_preimages){let actual=null;try{actual=hash(execFileSync('git',['-C',root,'show',row.revision==='HEAD'?`HEAD:${prefix}${row.path}`:`:${prefix}${row.path}`],{maxBuffer:8*1024*1024}));}catch{}check(actual===row.sha256,'Git preimage changed '+row.path+' '+row.revision);}
const changed=[...new Set([...git('diff','--name-only','-z','HEAD','--','.').split('\0'),...git('ls-files','--others','--exclude-standard','-z','--','.').split('\0')].filter(Boolean))].map(p=>p.startsWith(prefix)?p.slice(prefix.length):p);
const unexpected=changed.filter(p=>!previous.git.preexisting_changed_paths.includes(p)&&!before.prior_recovery_files.some(r=>r.path===p)&&!p.startsWith(base+'contracts/'));
check(!unexpected.length,'unexpected changed paths '+unexpected.join(', '));
const oldWork=JSON.parse(gunzipSync(Buffer.from(before.planning_preimages.find(r=>r.path===base+'WORK-ITEMS.json').gzip_base64,'base64')));
const newWork=json(base+'WORK-ITEMS.json');
check(JSON.stringify(oldWork.work_items.filter(r=>r.id!=='DSR-003'))===JSON.stringify(newWork.work_items.filter(r=>r.id!=='DSR-003')),'unrelated work item changed');
check(JSON.stringify(oldWork.validation_cases.filter(r=>r.id!=='V04'))===JSON.stringify(newWork.validation_cases.filter(r=>r.id!=='V04')),'unrelated validation changed');
check(JSON.stringify(oldWork.decision_register)===JSON.stringify(newWork.decision_register),'decision register changed');
console.log(JSON.stringify({schema_version:'domainspec.dsr003-preservation/v1-candidate',task_id:'DSR-003',status:errors.length?'fail':'pass',authority_effect:'none',prior_snapshot_paths:previous.selected_files.length,prior_recovery_files:before.prior_recovery_files.length,matrix_source_bindings:matrix.evidence.length,git_preimages:previous.git_preimages.length,authorized_synchronizations:sync,errors,unexpected_paths:unexpected,open_questions_ref:'../DECISIONS.md'},null,2));
if(errors.length)process.exitCode=1;
