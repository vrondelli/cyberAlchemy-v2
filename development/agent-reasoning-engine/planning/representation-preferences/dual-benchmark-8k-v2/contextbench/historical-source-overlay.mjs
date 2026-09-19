// Exact historical bytes at original module URLs. Open questions: COMPACT-DESCRIPTIVE-SCORING.md.
import assert from 'node:assert/strict';
import {readFileSync,realpathSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=path=>{assert.equal(realpathSync(path),path,'historical-source.canonical-path');assert.ok(lstatSync(path).isFile(),'historical-source.regular-file');return readFileSync(path);};
export function createHistoricalSourceOverlay({recovery_path,recovery_sha256,repository_root}){
 recovery_path=resolve(recovery_path);repository_root=resolve(repository_root);
 const bytes=read(recovery_path);assert.equal(hash(bytes),recovery_sha256,'historical-source.recovery-pin');
 const recovery=JSON.parse(bytes);assert.equal(recovery.schema,'are.exact-historical-source-recovery/v1');
 const freezeBytes=read(recovery.freeze_ref);assert.equal(hash(freezeBytes),recovery.freeze_sha256,'historical-source.freeze-pin');
 const freeze=JSON.parse(freezeBytes),entries=new Map();
 assert.ok(Array.isArray(recovery.entries)&&recovery.entries.length>0,'historical-source.entries');
 for(const entry of recovery.entries){
  assert.equal(resolve(entry.original_path),entry.original_path);assert.equal(resolve(entry.snapshot_path),entry.snapshot_path);
  assert.notEqual(entry.original_path,entry.snapshot_path);
  assert.ok(!entries.has(entry.original_path),'historical-source.duplicate');
  assert.equal(freeze.files.find(b=>resolve(repository_root,b.path)===entry.original_path)?.sha256,entry.sha256,'historical-source.original-pin');
  assert.equal(hash(read(entry.snapshot_path)),entry.sha256,'historical-source.snapshot-pin');entries.set(entry.original_path,Object.freeze({...entry}));
 }
 function verifyManifest(){assert.equal(hash(read(recovery_path)),recovery_sha256,'historical-source.recovery-drift');assert.equal(hash(read(recovery.freeze_ref)),recovery.freeze_sha256,'historical-source.freeze-drift');}
 function verifyBinding(binding){
  verifyManifest();const original=resolve(repository_root,binding.path),entry=entries.get(original);
  if(entry)assert.equal(binding.sha256,entry.sha256,'historical-source.conflicting-pin');
  const selected=entry?.snapshot_path??original;assert.equal(hash(read(selected)),binding.sha256,'historical-source.binding-drift');
  return {original_path:original,verified_path:selected,sha256:binding.sha256,substituted:Boolean(entry)};
 }
 function moduleSource(path){
  path=resolve(path);const entry=entries.get(path);if(!entry)return null;
  verifyManifest();const bytes=read(entry.snapshot_path);assert.equal(hash(bytes),entry.sha256,'historical-source.module-drift');return bytes.toString('utf8');
 }
 return Object.freeze({verifyBinding,moduleSource,verifyFreeze:()=>freeze.files.map(verifyBinding)});
}
