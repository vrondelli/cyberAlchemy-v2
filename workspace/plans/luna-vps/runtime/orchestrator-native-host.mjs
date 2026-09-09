// Private native-fixture host. Open questions: ../NATIVE-TRANSPORT-PLAN.md.
import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';
import {readFileSync, writeFileSync, openSync, closeSync, fsyncSync, renameSync, existsSync, chmodSync, statSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {startPilotHost} from './pilot-host.mjs';
import {compileTask} from './task-contract.mjs';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
export const digest = value => `sha256:${sha(JSON.stringify(canonical(value)))}`;
const fields = (value, keys) => {assert.ok(value && typeof value === 'object' && !Array.isArray(value)); assert.deepEqual(Object.keys(value).sort(), keys.sort());};
function durable(path, value) {
  const temp = `${path}.tmp`, fd = openSync(temp, 'wx', 0o600);
  try {writeFileSync(fd, JSON.stringify(value)); fsyncSync(fd);} finally {closeSync(fd);}
  renameSync(temp, path); const dir = openSync(dirname(path), 'r'); try {fsyncSync(dir);} finally {closeSync(dir);}
}
export async function startOrchestratorNativeHost(config) {
  assert.equal(config.mode, 'fixture', 'NATIVE_HOST_LIVE_DISABLED');
  const task = compileTask(config.task);
  const profileDigest = `sha256:${sha(readFileSync(resolve(config.candidate, 'pilot-profile.json')))}`;
  const candidateDigest = `sha256:${sha(readFileSync(resolve(config.candidate, 'MANIFEST.json')))}`;
  assert.equal(candidateDigest, `sha256:${config.manifest_sha256}`);
  const socketPath = resolve(config.runtime, 'orchestrator.sock'), tokenPath = resolve(config.runtime, 'orchestrator-token');
  const recordPath = resolve(config.state, 'orchestrator-envelope.json');
  assert.ok(!existsSync(socketPath) && !existsSync(recordPath) && !existsSync(tokenPath), 'NATIVE_HOST_EXISTING_STATE_REQUIRES_INSPECTION');
  if (existsSync(config.runtime)) assert.equal(statSync(config.runtime).mode & 0o077, 0, 'NATIVE_HOST_PRIVATE_DIRECTORY_REQUIRED');
  const pilot = await startPilotHost(config, {taskContract: task});
  assert.equal(statSync(config.runtime).mode & 0o077, 0, 'NATIVE_HOST_PRIVATE_DIRECTORY_REQUIRED');
  const token = randomBytes(32).toString('hex'); writeFileSync(tokenPath, token, {mode:0o600, flag:'wx'});
  let record = null, stopped = false, pending = null, deadlineTimer;
  const sockets = new Set();
  const snapshot = () => ({schema_version:'are-native-status/v1', request_digest:record?.request_digest ?? null,
    status:record?.status ?? 'ready', result:record?.result ?? null});
  function validate(request) {
    fields(request, ['schema_version','run_key','graph_digest','command','identity','fencing_token','deadline_unix_ms','binding','task_digest','budget']);
    assert.equal(request.schema_version, 'are-text-native-request/v1');
    fields(request.binding, ['execution_mode','candidate_digest','profile_digest','task']);
    assert.equal(request.binding.execution_mode, 'native-fixture');
    assert.equal(request.binding.candidate_digest, candidateDigest, 'NATIVE_CANDIDATE_MISMATCH');
    assert.equal(request.binding.profile_digest, profileDigest, 'NATIVE_PROFILE_MISMATCH');
    assert.deepEqual(request.binding.task, task.task); assert.equal(request.task_digest, task.digest);
    fields(request.identity, ['semantic_work_id','run_id','attempt_id']);
    for (const id of Object.values(request.identity)) assert.match(id, /^[A-Za-z0-9_.-]{1,160}$/);
    assert.equal(request.run_key, digest(request.identity).slice(7), 'NATIVE_RUN_IDENTITY_MISMATCH');
    assert.match(request.run_key, /^[a-f0-9]{64}$/); assert.match(request.graph_digest, /^sha256:[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(request.fencing_token) && request.fencing_token > 0);
    assert.ok(Number.isSafeInteger(request.deadline_unix_ms) && request.deadline_unix_ms > Date.now() && request.deadline_unix_ms <= Date.now()+120000);
    fields(request.command, ['command_id','node_id','contract','role_id','attempt','input']);
    assert.equal(request.command.contract, 'are-codex-text/v1'); assert.equal(request.command.node_id, 'text');
    assert.equal(request.command.role_id,'text-worker'); assert.equal(request.command.attempt,1);
    assert.match(request.command.command_id, /^sha256:[a-f0-9]{64}$/);
    assert.deepEqual(request.command.input, {static:request.binding, dependencies:[]});
    const dagId=`are-text-${task.task.task_id}`;
    const graph={dag_id:dagId,work_kind:'are-native-fixture',deadline_seconds:60,max_parallelism:1,
      nodes:[{node_id:'text',contract:'are-codex-text/v1',role_id:'text-worker',depends_on:[],release:{mode:'root'},max_attempts:1,static_input:request.binding}]};
    assert.equal(request.graph_digest,digest(graph),'NATIVE_GRAPH_MISMATCH');
    assert.equal(request.command.command_id,digest({dag_id:dagId,node_id:'text',attempt:1,input:request.command.input}),'NATIVE_COMMAND_MISMATCH');
    assert.deepEqual(request.budget, {model:'gpt-5.6-luna',max_model_calls:1,max_output_tokens:512,tools_enabled:false,fixture_provider_calls:1});
  }
  async function cancel() {
    if (record?.status === 'running') {
      record.status = 'cancelled'; durable(recordPath, record); clearTimeout(deadlineTimer);
      await pilot.close(); stopped = true;
    }
  }
  const server = createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket)); socket.on('error', () => {});
    const chunks=[]; let size=0, handled=false;
    const timer=setTimeout(()=>socket.destroy(),2000); socket.on('close',()=>clearTimeout(timer));
    socket.on('data', async chunk => {
      if (handled) return; size+=chunk.length; if(size>65536) return socket.destroy(); chunks.push(chunk);
      const bytes=Buffer.concat(chunks); if(!bytes.includes(10))return; handled=true;
      try {
        const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
        const req=JSON.parse(text);
        fields(req, req.op==='start' ? ['op','auth','request','request_digest'] : ['op','auth','request_digest']);
        const provided=Buffer.from(typeof req.auth==='string'?req.auth:'');
        assert.ok(provided.length===token.length && timingSafeEqual(provided,Buffer.from(token)),'NATIVE_AUTH_REQUIRED');
        assert.ok(['start','status','cancel'].includes(req.op),'NATIVE_OPERATION_INVALID');
        if(req.op==='start') {
          assert.equal(req.request_digest,digest(req.request),'NATIVE_REQUEST_DIGEST_MISMATCH');
          if(record) {assert.equal(record.request_digest,req.request_digest,'NATIVE_REQUEST_CONFLICT');}
          else {
            assert.ok(!stopped); validate(req.request);
            record={schema_version:'are-native-host-attempt/v1',request_digest:req.request_digest,request:req.request,status:'running',result:null};
            durable(recordPath,record);
            deadlineTimer=setTimeout(()=>{void cancel().catch(()=>{});},req.request.deadline_unix_ms-Date.now());
            pending=pilot.runTask(task.task.task_id,task.digest).then(result=>{
              if(record.status!=='running')return;
              assert.ok(result.verified && result.status==='passed');
              record.result=result;record.status='succeeded';durable(recordPath,record);clearTimeout(deadlineTimer);
            }).catch(()=>{if(record.status==='running'){record.status='uncertain';durable(recordPath,record);clearTimeout(deadlineTimer);}});
          }
        } else {
          assert.ok(record && record.request_digest===req.request_digest,'NATIVE_REQUEST_CONFLICT');
          if(req.op==='cancel') await cancel();
        }
        socket.end(JSON.stringify({ok:true,...snapshot()})+'\n');
      } catch {socket.end(JSON.stringify({ok:false,error:'NATIVE_REQUEST_REJECTED'})+'\n');}
    });
  });
  try {
    await new Promise((ok,fail)=>{server.once('error',fail);server.listen(socketPath,ok);});chmodSync(socketPath,0o600);
  } catch(error) {await pilot.close();throw error;}
  return {socketPath,tokenPath,profileDigest,candidateDigest,snapshot,
    async close(){clearTimeout(deadlineTimer);await cancel();await pilot.close();await pending;
      for(const socket of sockets)socket.destroy();await new Promise(ok=>server.close(ok));}};
}
