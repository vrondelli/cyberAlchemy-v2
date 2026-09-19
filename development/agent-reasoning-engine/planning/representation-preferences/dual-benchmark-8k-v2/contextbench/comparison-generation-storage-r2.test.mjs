import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {buildComparisonSchedule} from './comparison-schedule.mjs';import {createComparisonGenerationStorage} from './comparison-generation-storage-r2.mjs';
const cohort_path=fileURLToPath(new URL('./RECOVERY-TRAJECTORY-COHORT-R1.json',import.meta.url));
const sources={cohort_path,cohort_sha256:createHash('sha256').update(readFileSync(cohort_path)).digest('hex'),config_path:fileURLToPath(new URL('./discovery-v1/live-config.json',import.meta.url))};
function fixture(t){const root=mkdtempSync(join(tmpdir(),'comparison-storage-'));t.after(()=>rmSync(root,{recursive:true,force:true}));const paths=Object.fromEntries(['outcome_root','runs_root','metadata_root'].map(k=>{const p=join(root,k);mkdirSync(p);return [k,p];}));return {...paths,source_root:join(root,'sources'),schedule:buildComparisonSchedule(sources),sources,binding:{}};}
test('all twelve source assignments and every dispatch check share bounded storage',t=>{
 const f=fixture(t),calls=[];const s=createComparisonGenerationStorage(f,{host_guard:a=>{calls.push(a);return {admitted:true};}});const config=JSON.parse(readFileSync(sources.config_path));
 assert.equal(calls.length,4);assert.deepEqual(s.check().evidence.map(x=>x.maximum_bytes),[64,256,32].map(x=>x*1024**2));assert.ok(calls.every(c=>c.growth_reservation_bytes>2*1024**3));
 for(const slot of f.schedule.slots){const task=config.tasks.find(t=>t.id===slot.task_id);assert.equal(s.admit_source({task,cache:task.repository_cache,source_root:join(f.source_root,String(slot.sequence).padStart(2,'0')),phase:'before-prepare'}),true);}
 assert.equal(s.before_model_dispatch(),true);s.metadata_persistence.writeJson(join(f.metadata_root,'fixture.json'),{ok:true});assert.ok(s.check().evidence[2].bytes>0);
});
test('host denial prevents construction; subsequent denial permanently stops dispatch',t=>{
 const f=fixture(t);assert.throws(()=>createComparisonGenerationStorage(f,{host_guard:()=>({admitted:false})}),/host-denied/);
 let admitted=true;const s=createComparisonGenerationStorage(f,{host_guard:()=>({admitted})});admitted=false;assert.throws(()=>s.before_model_dispatch(),/host-denied/);admitted=true;assert.throws(()=>s.before_model_dispatch(),/stopped/);
});
test('overlapping roots and wrong source assignment reject before source preparation',t=>{
 const f=fixture(t);assert.throws(()=>createComparisonGenerationStorage({...f,source_root:join(f.runs_root,'..source')},{host_guard:()=>({admitted:true})}),/root-overlap/);
 const s=createComparisonGenerationStorage(f,{host_guard:()=>({admitted:true})}),task=JSON.parse(readFileSync(sources.config_path)).tasks[0];assert.throws(()=>s.admit_source({task,cache:task.repository_cache,source_root:join(f.source_root,'12'),phase:'before-prepare'}),/source-assignment/);
});
test('unexpected or symlink source contents reject dispatch',t=>{
 for(const symlink of [false,true]){const f=fixture(t),s=createComparisonGenerationStorage(f,{host_guard:()=>({admitted:true})});mkdirSync(f.source_root);if(symlink)symlinkSync(f.metadata_root,join(f.source_root,'00'));else writeFileSync(join(f.source_root,'unknown'),'x');assert.throws(()=>s.before_model_dispatch(),/source-entry|unassigned-source/);}
});
