import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync,symlinkSync,openSync,ftruncateSync,closeSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createTrajectoryStorage,MAXIMUM_SOURCE_BYTES} from './trajectory-storage.mjs';
const commit='a'.repeat(40);
function fixture(fn){const root=mkdtempSync(join(tmpdir(),'trajectory-storage-'));try{const evidence_root=join(root,'evidence'),source_root=join(root,'sources');mkdirSync(evidence_root);mkdirSync(source_root);return fn({root,evidence_root,source_root,tasks:[{id:'task',repository_cache:join(root,'cache'),base_commit:commit}],binding:{},host_guard:()=>({admitted:true})});}finally{rmSync(root,{recursive:true,force:true});}}
test('source and evidence share one host growth reservation; C is never probed here',()=>fixture(args=>{
 const calls=[];const storage=createTrajectoryStorage({...args,host_guard:input=>{calls.push(input);return {admitted:true};}});
 assert.equal(storage.guard.snapshot().maximum_bytes,128*1024**2);assert.ok(calls[0].growth_reservation_bytes>2*1024**3);
 storage.persistence.writeJson(join(args.evidence_root,'small.json'),{known:1});const now=storage.check();assert.ok(now.evidence.bytes>4096);assert.ok(calls.at(-1).growth_reservation_bytes<calls[0].growth_reservation_bytes);
 assert.equal(storage.admit_source({task:{base_commit:commit},cache:args.tasks[0].repository_cache,source_root:join(args.source_root,'task-r1-control'),phase:'before-prepare'}),true);
 assert.throws(()=>storage.admit_source({task:{base_commit:commit},cache:args.tasks[0].repository_cache,source_root:join(args.source_root,'wrong'),phase:'before-base'}),/assignment/);
}));
test('source aliases, unknown roots and source overrun stop further admission',()=>fixture(args=>{
 const storage=createTrajectoryStorage(args);mkdirSync(join(args.source_root,'task-r1-control'));symlinkSync(args.evidence_root,join(args.source_root,'task-r1-control','alias'));assert.throws(()=>storage.check(),/file-kind/);assert.throws(()=>storage.check(),/stopped/);
}));
test('source logical overrun and host denial fail closed',()=>{
 fixture(args=>{const storage=createTrajectoryStorage(args);const path=join(args.source_root,'task-r1-control');mkdirSync(path);const fd=openSync(join(path,'large'),'wx');ftruncateSync(fd,MAXIMUM_SOURCE_BYTES);closeSync(fd);assert.throws(()=>storage.check(),/source-byte-limit/);});
 fixture(args=>{let healthy=true;const storage=createTrajectoryStorage({...args,host_guard:()=>({admitted:healthy})});healthy=false;assert.throws(()=>storage.check(),/host-denied/);healthy=true;assert.throws(()=>storage.check(),/stopped/);});
 fixture(args=>{mkdirSync(join(args.source_root,'unexpected'));assert.throws(()=>createTrajectoryStorage(args),/unassigned/);});
});

test('source backing must independently pass the same host and guest mount validation',()=>fixture(args=>{
 const paths=[];assert.throws(()=>createTrajectoryStorage({...args,host_guard:input=>{paths.push(input.output);if(input.output===args.source_root)throw Error('guest-root-device-mismatch');return {admitted:true};}}),/device-mismatch/);
 assert.deepEqual(paths,[args.evidence_root,args.source_root]);
}));
