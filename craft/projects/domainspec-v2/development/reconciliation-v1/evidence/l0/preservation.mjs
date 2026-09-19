import fs from 'node:fs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {root,dir,hash,json} from '../../definition-pack/build.mjs';
const base='development/reconciliation-v1/';
const read=p=>fs.readFileSync(path.join(root,p));
const load=p=>JSON.parse(read(p));
const before=load(base+'evidence/l0/preservation-before.json');
const snapshot=load(base+'recovery/source-snapshot.json');
const matrix=load(base+'contracts/support-matrix.json');
const sync=fs.existsSync(path.join(root,base+'evidence/l0/synchronizations.json'))?load(base+'evidence/l0/synchronizations.json'):[];
const errors=[];const check=(x,message)=>{if(!x)errors.push(message);};
const current=p=>fs.existsSync(path.join(root,p))?hash(read(p)):null;
const allowed=new Map(before.planning_preimages.map(p=>[p.path,p]));
for(const row of sync){check(allowed.has(row.path),'unexpected synchronization '+row.path);check(row.before_sha256===allowed.get(row.path)?.sha256,'invalid preimage '+row.path);check(current(row.path)===row.after_sha256,'synchronization drift '+row.path);}
check(new Set(sync.map(r=>r.path)).size===sync.length,'duplicate synchronization');
for(const row of before.planning_preimages){check(hash(gunzipSync(Buffer.from(row.gzip_base64,'base64')))===row.sha256,'corrupt planning preimage '+row.path);check(current(row.path)===(sync.find(r=>r.path===row.path)?.after_sha256??row.sha256),'planning drift '+row.path);}
for(const row of snapshot.selected_files)if(!allowed.has(row.path))check(current(row.path)===row.sha256,'prior selected source drift '+row.path);
for(const row of [...before.prior_files,...before.compiler_sources])check(current(row.path)===row.sha256,'prior recovery or matrix artifact drift '+row.path);
for(const row of matrix.evidence)check(current(row.path)===row.sha256,'matrix source drift '+row.path);
const git=(...args)=>execFileSync('git',['-C',root,...args],{maxBuffer:8*1024*1024}).toString();
check(git('rev-parse','HEAD').trim()===snapshot.git.head,'HEAD changed');
const prefix=path.relative(snapshot.git.root,root)+'/';
for(const row of snapshot.git_preimages){let actual=null;try{actual=hash(execFileSync('git',['-C',root,'show',row.revision==='HEAD'?`HEAD:${prefix}${row.path}`:`:${prefix}${row.path}`],{maxBuffer:8*1024*1024}));}catch{}check(actual===row.sha256,'Git preimage changed '+row.path+' '+row.revision);}
const changed=[...new Set([...git('diff','--name-only','-z','HEAD','--','.').split('\0'),...git('ls-files','--others','--exclude-standard','-z','--','.').split('\0')].filter(Boolean))].map(p=>p.startsWith(prefix)?p.slice(prefix.length):p);
const unexpected=changed.filter(p=>!snapshot.git.preexisting_changed_paths.includes(p)&&!before.prior_files.some(r=>r.path===p)&&!p.startsWith(base+'verticals/entity-query/')&&!p.startsWith(base+'evidence/l0/'));
check(!unexpected.length,'unexpected changed paths '+unexpected.join(', '));
const previousWork=JSON.parse(gunzipSync(Buffer.from(before.planning_preimages.find(r=>r.path.endsWith('/WORK-ITEMS.json')).gzip_base64,'base64')));
const currentWork=load(base+'WORK-ITEMS.json');
const scrub=w=>{const v=structuredClone(w);delete v.current_frontier;v.work_items=v.work_items.filter(x=>x.id!=='DSR-007');v.validation_cases=v.validation_cases.filter(x=>!['V08','V09'].includes(x.id));return v;};
check(json(scrub(previousWork))===json(scrub(currentWork)),'unrelated work-pack field changed');
const report={schema_version:'domainspec.dsr007-preservation/v1-candidate',task_id:'DSR-007',status:errors.length?'fail':'pass',authority_effect:'none',prior_selected_paths:snapshot.selected_files.length,prior_reconciliation_files:before.prior_files.length,compiler_source_files:before.compiler_sources.length,matrix_source_bindings:matrix.evidence.length,git_preimages:snapshot.git_preimages.length,synchronizations:sync,errors,unexpected_paths:unexpected,open_questions_ref:'REPORT.md#open-questions'};
console.log(json(report));if(errors.length)process.exitCode=1;
