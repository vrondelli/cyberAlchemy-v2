import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../development/agent-reasoning-engine/codex-integration');

test('interactive client and live canary refuse missing Codex configuration before starting a session',()=>{
  const env={...process.env};delete env.CODEX_BINARY;
  for(const file of ['client/interactive.mjs','scripts/canary.mjs']){
    const result=spawnSync(process.execPath,[resolve(root,file)],{env,encoding:'utf8',timeout:10000});
    assert.equal(result.status,1,result.stderr);
    assert.match(result.stderr,/CODEX_BINARY/);
    assert.equal(result.stdout,'');
  }
});
test('interactive client refuses a missing upstream flag value',()=>{
  const result=spawnSync(process.execPath,[resolve(root,'client/interactive.mjs'),'--upstream','--cwd','/tmp'],{encoding:'utf8',timeout:10000});
  assert.equal(result.status,1);
  assert.match(result.stderr,/Provide --upstream/);
});
test('Python validator refuses an invalid explicit Node executable before writing validation evidence',()=>{
  const result=spawnSync('python3',[resolve(root,'continuous-construction-task-loop/scripts/validate.py')],{env:{...process.env,NODE_BINARY:'/nonexistent/keld-test-node'},encoding:'utf8',timeout:10000});
  assert.equal(result.status,1);
  assert.match(result.stderr,/Node executable unavailable/);
  assert.equal(result.stdout,'');
});
