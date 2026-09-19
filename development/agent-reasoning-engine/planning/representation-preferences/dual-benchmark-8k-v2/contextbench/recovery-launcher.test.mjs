import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {launchRecovery} from './recovery-launcher.mjs';
const read=p=>JSON.parse(readFileSync(p));
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'recovery-supervisor-')),paths={};
 for(const [key,name]of Object.entries({generation_root:'generation',source_root:'sources',score_root:'scores',supervision_root:'supervisor'})){paths[key]=join(root,name);mkdirSync(paths[key]);}
 const config={tasks:[1,2,3,4].map(i=>({id:'t'+i}))},terminal={status:'sealed',workers_settled:true,usage:{total_tokens:300},unknown_usage_calls:0,conservative_total_tokens:300};
 const events=[];
 return {root,paths,config,terminal,events,args:{...paths,config,binding:{},host_guard:()=>({admitted:true}),
 qualify:async()=>({admitted:true}),settle:async()=>{events.push('settle');return {local_settled:true};},
 generate:async()=>{events.push('generate');return terminal;},score:async({terminal:stored})=>{events.push('score');assert.deepEqual(stored,terminal);return {development_target_passed:false};}}};
}
test('durable terminal precedes settlement and scoring; immutable shared configuration',async()=>{
 const f=fixture();try{
 f.args.qualify=async({config})=>{assert.throws(()=>config.tasks.push({id:'bad'}));f.config.tasks.pop();return {admitted:true};};
 f.args.settle=async()=>{assert.deepEqual(read(join(f.paths.supervision_root,'GENERATION-TERMINAL.json')),f.terminal);f.events.push('settle');return {local_settled:true};};
 const r=await launchRecovery(f.args);assert.equal(r.status,'scored');assert.equal(r.assigned_arms,8);assert.equal(r.campaign_goal_achieved,false);assert.deepEqual(f.events,['generate','settle','score']);
 assert.deepEqual(read(join(f.paths.supervision_root,'RESULTS.json')),r);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('deadline abort waits for generation settlement and preserves cost; scoring suppressed',async()=>{
 const f=fixture();try{
 let finished=false;f.args.deadline_ms=10;
 f.args.generate=async({signal})=>{await new Promise(resolve=>signal.addEventListener('abort',()=>setTimeout(()=>{finished=true;resolve();},15),{once:true}));return {...f.terminal,status:'incomplete'};};
 f.args.settle=async()=>{assert.equal(finished,true);return {local_settled:true};};
 const r=await launchRecovery(f.args);assert.equal(finished,true);assert.equal(r.status,'incomplete');assert.equal(r.abort_reason,'generation-deadline');assert.equal(r.known_usage.total_tokens,300);assert.ok(!f.events.includes('score'));
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('generation exception retains attached terminal and checks settlement',async()=>{
 const f=fixture();try{
 f.args.generate=async()=>{throw Object.assign(Error('disk finalization'),{result:{...f.terminal,status:'finalization-failed'}});};
 const r=await launchRecovery(f.args);assert.equal(r.failure,'disk finalization');assert.equal(r.terminal_saved,true);assert.equal(r.known_usage.total_tokens,300);assert.deepEqual(f.events,['settle']);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('unsettled local transport, cancellation and denied qualification cannot score',async()=>{
 for(const mode of ['unsettled','cancelled','denied']){
 const f=fixture();try{
 if(mode==='unsettled')f.args.settle=async()=>({local_settled:false});
 if(mode==='cancelled'){const c=new AbortController();c.abort();f.args.signal=c.signal;}
 if(mode==='denied')f.args.qualify=async()=>({admitted:false});
 const r=await launchRecovery(f.args);assert.equal(r.status,'incomplete');assert.ok(!f.events.includes('score'));if(mode!=='unsettled')assert.ok(!f.events.includes('generate'));
 }finally{rmSync(f.root,{recursive:true,force:true});}
 }
});
test('terminal mutation during scoring invalidates launcher result',async()=>{
 const f=fixture();try{
 f.args.score=async()=>{writeFileSync(join(f.paths.supervision_root,'GENERATION-TERMINAL.json'),'{}');return {development_target_passed:true};};
 const r=await launchRecovery(f.args);assert.equal(r.status,'incomplete');assert.equal(r.development_target_passed,false);assert.equal(r.score_summary,null);assert.match(r.failure,/terminal-drift/);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('overlapping directories and missing required qualifications reject before effects',async()=>{
 const f=fixture();try{
 await assert.rejects(launchRecovery({...f.args,settle:undefined}),/qualification-and-settlement-required/);
 await assert.rejects(launchRecovery({...f.args,score_root:f.args.generation_root}),/disjoint-roots/);
 assert.deepEqual(f.events,[]);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});

test('terminal write failure and absent terminal still run local settlement',async()=>{
 for(const mode of ['write-failure','missing','unsettled-workers']){
 const f=fixture();try{
 f.args.generate=async()=>{
  if(mode==='write-failure')writeFileSync(join(f.paths.supervision_root,'GENERATION-TERMINAL.json'),'occupied');
  return mode==='missing'?null:mode==='unsettled-workers'?{...f.terminal,workers_settled:false}:f.terminal;
 };
 const r=await launchRecovery(f.args);assert.equal(r.status,'incomplete');assert.deepEqual(f.events,['settle']);
 if(mode==='write-failure')assert.equal(r.terminal_saved,false);
 }finally{rmSync(f.root,{recursive:true,force:true});}
 }
});
test('cancellation during scoring suppresses success',async()=>{
 const f=fixture();try{
 const c=new AbortController();f.args.signal=c.signal;
 f.args.score=async()=>{c.abort();return {development_target_passed:true};};
 const r=await launchRecovery(f.args);assert.equal(r.status,'incomplete');assert.equal(r.development_target_passed,false);assert.match(r.failure,/cancelled-during-scoring/);
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
