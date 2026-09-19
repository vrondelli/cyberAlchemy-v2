import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {createHistoricalSourceOverlay} from './historical-source-overlay.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
function fixture(t){
 const root=mkdtempSync(join(tmpdir(),'historical-overlay-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const original=join(root,'original.mjs'),snapshot=join(root,'snapshot.mjs'),dep=join(root,'dep.mjs'),freeze=join(root,'freeze.json'),recovery=join(root,'recovery.json');
 const before="import {value} from './dep.mjs';export const result=value+1;\n",after='export const result=900;\n';
 writeFileSync(original,after);writeFileSync(snapshot,before);writeFileSync(dep,'export const value=41;\n');
 const files=[{path:original,sha256:hash(before)},{path:dep,sha256:hash(readFileSync(dep))}];writeFileSync(freeze,JSON.stringify({files}));
 const manifest={schema:'are.exact-historical-source-recovery/v1',freeze_ref:freeze,freeze_sha256:hash(readFileSync(freeze)),entries:[{original_path:original,snapshot_path:snapshot,sha256:hash(before)}]};
 const save=()=>{writeFileSync(recovery,JSON.stringify(manifest));return {repository_root:root,recovery_path:recovery,recovery_sha256:hash(readFileSync(recovery))};};
 return {root,original,snapshot,dep,freeze,recovery,files,manifest,save,args:save(),after};
}
test('isolated original bytes verify while current file remains unchanged',t=>{
 const f=fixture(t),o=createHistoricalSourceOverlay(f.args);assert.equal(o.verifyFreeze().filter(x=>x.substituted).length,1);
 assert.match(o.moduleSource(f.original),/value\+1/);assert.equal(o.moduleSource(f.dep),null);assert.equal(readFileSync(f.original,'utf8'),f.after);
});
test('actual Node loader selects exact historical code and resolves its relative imports',t=>{
 const f=fixture(t),loader=new URL('./historical-source-loader.mjs',import.meta.url).href;
 const script="import {register} from 'node:module';register("+JSON.stringify(loader)+",{data:"+JSON.stringify(f.args)+"});const m=await import("+JSON.stringify(pathToFileURL(f.original).href)+");if(m.result!==42)throw Error('wrong module');console.log(m.result);";
 assert.equal(execFileSync(process.execPath,['--input-type=module','--eval',script],{encoding:'utf8',timeout:10000}).trim(),'42');
 assert.equal(readFileSync(f.original,'utf8'),f.after);
});
test('unknown replacements and conflicting historical pins are denied',t=>{
 const f=fixture(t);f.manifest.entries[0].original_path=join(f.root,'unknown.mjs');assert.throws(()=>createHistoricalSourceOverlay(f.save()),/original-pin/);
});
test('tampered snapshots, manifest drift and non-overridden dependency drift fail closed',t=>{
 for(const kind of ['snapshot','manifest','dependency']){
 const f=fixture(t),o=createHistoricalSourceOverlay(f.args);
 writeFileSync(kind==='snapshot'?f.snapshot:kind==='manifest'?f.recovery:f.dep,'tampered');
 assert.throws(()=>o.verifyFreeze(),/drift/);
 if(kind==='snapshot')assert.throws(()=>o.moduleSource(f.original),/module-drift/);
 }
});
test('recovery and freeze pins are checked before use',t=>{
 const f=fixture(t);assert.throws(()=>createHistoricalSourceOverlay({...f.args,recovery_sha256:'0'.repeat(64)}),/recovery-pin/);
 writeFileSync(f.freeze,'{}');assert.throws(()=>createHistoricalSourceOverlay(f.args),/freeze-pin/);
});
