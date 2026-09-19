// Metadata-only replay of retained traces. Open questions: COMPARISON-CAPACITY.md.
import assert from 'node:assert/strict';import {readFileSync,readdirSync,lstatSync,writeFileSync} from 'node:fs';import {join,relative,dirname} from 'node:path';import {createHash} from 'node:crypto';
import {createStageOutputGuard as current} from './trajectory-output-guard.mjs';
import {createStageOutputGuard as successor} from './comparison-output-guard.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const dir=import.meta.dirname,hash=x=>createHash('sha256').update(x).digest('hex'),probe=JSON.parse(readFileSync(join(dir,'COMPARISON-CAPACITY-PROBE-R1.json')));
function snapshot(root){const files=[];function walk(p){const st=lstatSync(p);assert.equal(st.isSymbolicLink(),false);if(st.isDirectory())for(const n of readdirSync(p).sort())walk(join(p,n));else{assert.ok(st.isFile());files.push({relative:relative(root,p),size:st.size,blocks:st.blocks,sha256:hash(readFileSync(p))});}}walk(root);return files;}
function replay(factory,files,options={}){
 const root='/capacity-replay',directory={directory:true,size:4096,blocks:8},nodes=new Map([[root,directory]]),children=new Map([[root,new Set()]]);
 const put=(path,value)=>{nodes.set(path,value);if(value.directory&&!children.has(path))children.set(path,new Set());const parent=dirname(path);if(children.has(parent))children.get(parent).add(path.slice(parent.length+1));};
 const deps={realpath:p=>p,statfs:()=>({bsize:4096}),lstat:p=>{const v=nodes.get(p);if(!v)throw Object.assign(Error('absent'),{code:'ENOENT'});return {...v,isSymbolicLink:()=>false,isDirectory:()=>v.directory,isFile:()=>!v.directory};},readdir:p=>[...(children.get(p)??[])]};
 const guard=factory({root,deps,...options});let copied=0,failure=null;
 try{for(let i=0;i<12;i++)for(const f of files){const name=String(i).padStart(2,'0')+'/'+f.relative,lease=guard.reserve({path:name,bytes:Math.max(f.size,f.blocks*512)});let cursor=root;for(const p of name.split('/').slice(0,-1)){cursor=join(cursor,p);if(!nodes.has(cursor))put(cursor,directory);}put(join(root,name),{directory:false,size:f.size,blocks:f.blocks});lease.complete();copied++;}}
 catch(error){failure=String(error.message);}
 return {passed:failure===null,failure,materialized_files:copied,physical_file_copies:0,state:guard.snapshot()};
}
const largest=probe.rows.reduce((a,b)=>a.allocated_or_logical_bytes>b.allocated_or_logical_bytes?a:b),mostEntries=probe.rows.reduce((a,b)=>a.entries>b.entries?a:b),largestResult=probe.rows.reduce((a,b)=>a.result_bytes>b.result_bytes?a:b);
const files=snapshot(largest.path),entryFiles=snapshot(mostEntries.path),resultFiles=snapshot(largestResult.path).filter(f=>f.relative==='result.json');
const old=replay(current,files),runs=replay(successor,files),entries=replay(successor,entryFiles),outcomes=replay(successor,resultFiles,{maximum_bytes:64*1024**2});
assert.equal(old.passed,false);assert.equal(runs.passed,true);assert.equal(entries.passed,true);assert.equal(outcomes.passed,true);
const combined_growth_bytes=2*1024**3+(256+64+32+32+32)*1024**2,binding=JSON.parse(readFileSync(join(dir,'../storage-host-binding.json'))),storage=guardStorage({binding,output:dir,growth_reservation_bytes:combined_growth_bytes});
const result={schema:'are.comparison-capacity-qualification/v1',largest_run:{source:largest.path,files},most_entries:{source:mostEntries.path,files:entryFiles},largest_result:{source:largestResult.path,files:resultFiles},old_run_guard:old,successor_runs:runs,successor_entries:entries,successor_outcomes:outcomes,combined_growth_bytes,storage,provider_calls:0,physical_file_copies:0,new_run_admitted:false,claim:'Twelve copies of empirical maximum-byte and maximum-entry traces fit separately; not a future upper bound or live campaign approval.',open_questions_ref:'COMPARISON-CAPACITY.md'};
writeFileSync(join(dir,'COMPARISON-CAPACITY-QUALIFICATION-R1.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({old_rejected:!old.passed,runs:runs.state,outcomes:outcomes.state,combined_growth_bytes,host_free_bytes:storage.host_free_bytes,guest_free_bytes:storage.guest_free_bytes,physical_file_copies:0}));
