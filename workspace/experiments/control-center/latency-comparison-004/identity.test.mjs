import test from 'node:test';
import assert from 'node:assert/strict';
import {processIdentity,verifyProcess,sha} from './process-identity.mjs';
import {readFileSync} from 'node:fs';
test('reads the current Linux process executable and stable start identity',()=>{
  const a=processIdentity(process.pid),b=processIdentity(process.pid);
  assert.equal(verifyProcess(a,b,{path:a.executable,sha256:sha(readFileSync(process.execPath))}),true);
});
test('changed PID, start time, boot, path or bytes fail closed',()=>{
  const a=processIdentity(process.pid),expected={path:a.executable,sha256:a.binary_sha256};
  for(const key of Object.keys(a))assert.equal(verifyProcess(a,{...a,[key]:'wrong'},expected),false);
  assert.throws(()=>processIdentity(-1));
});
