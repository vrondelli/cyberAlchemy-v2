// Focused existing seam probes; source-only. Open questions: RESULT.md.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {planProjectInstantiation} from '../../../../../impl/cli/src/generation/project-instantiation.ts';
import {publishProjectInstantiationForTest} from '../../../../../impl/cli/src/generation/publish-project.ts';
const source=path.resolve(import.meta.dirname,'../../../../../impl/cli/fixtures/input-roots/canonical-project');
function fixture(t:any){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'r09-safety-hooks-'));
  fs.writeFileSync(path.join(root,'unrelated'),'preserve');
  t.after(()=>{try{assert.equal(fs.readFileSync(path.join(root,'unrelated'),'utf8'),'preserve');}finally{fs.rmSync(root,{recursive:true,force:true});}});
  return {root,target:path.join(root,'target'),plan:planProjectInstantiation(source,['typescript'])};
}
test('R09-P05 legacy project exclusive claim preserves competing empty target identity',t=>{
  const f=fixture(t);let before:fs.Stats|undefined;
  assert.throws(()=>publishProjectInstantiationForTest(f.plan,f.target,{before_claim:(_stage,target)=>{fs.mkdirSync(target);before=fs.lstatSync(target);}}),/already exists/);
  const after=fs.lstatSync(f.target);assert.ok(before);assert.deepEqual([after.dev,after.ino],[before.dev,before.ino]);
  assert.deepEqual(fs.readdirSync(f.target),[]);assert.deepEqual(fs.readdirSync(f.root).sort(),['target','unrelated']);
});
test('R09-P06 interruption after receipt preserves foreign artifact and sentinel without cleaning public target',t=>{
  const f=fixture(t),artifact=path.join(f.target,f.plan.artifacts[0]!.relative_path);
  assert.throws(()=>publishProjectInstantiationForTest(f.plan,f.target,{after_receipt:()=>{
    fs.unlinkSync(artifact);fs.writeFileSync(artifact,'foreign replacement');
    fs.writeFileSync(path.join(f.target,'foreign-sentinel'),'owner');throw Error('R09 after receipt interruption');
  }}),/R09 after receipt interruption/);
  assert.equal(fs.readFileSync(artifact,'utf8'),'foreign replacement');
  assert.equal(fs.readFileSync(path.join(f.target,'foreign-sentinel'),'utf8'),'owner');
  assert.deepEqual(fs.readdirSync(f.root).sort(),['target','unrelated']);
  assert.ok(fs.readdirSync(f.target).some(n=>n.startsWith('.domainspec-project-claim-')),'incomplete target remains visible');
});
