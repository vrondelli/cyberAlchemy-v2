import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGlmClient, MODEL, hash} from './transport.mjs';
import {runGlmAgent, projectInspectionProgress} from './agent.mjs';
import {validateCalls} from './tools.mjs';
import {projectRecentObservations} from './retention.mjs';
import {parseConfig, runConfiguredGlm} from './cli.mjs';
import {createReadOnlyToolRuntime} from '../read-only-tools.mjs';
import {snapshotTree} from '../verifier.mjs';
import {createSecretReference, createSecretProviderRegistry, createInjectedSecretProvider} from '../secret-provider.mjs';

const tc = (id = 'call1', name = 'read-file', args = {path: 'a.mjs'}) => ({id, type: 'function', function: {name, arguments: JSON.stringify(args)}});
const reply = (message, finish_reason = 'stop', usage = {}) => ({model: MODEL, choices: [{message: {role: 'assistant', ...message}, finish_reason}], usage: {prompt_tokens: 100, completion_tokens: 20, ...usage}});

async function setup(t, handler = null, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'are-glm-test-')); const root = join(dir,'repo'); mkdirSync(root);
  writeFileSync(join(root,'a.mjs'), 'export const a=1;\n');
  const base = snapshotTree(root);
  const candidate = {schema_version:'are.patch-set-candidate/v1', expected_base_tree_sha256:base.tree_sha256, changes:[{operation:'replace-file',path:'a.mjs',expected_file_sha256:base.files['a.mjs'],utf8:'export const a=2;\n'}], rationale:'test',authority_effect:'none'};
  const requests = [];
  const server = createServer(async (req,res) => {
    const chunks=[]; for await (const c of req) chunks.push(c);
    const body=JSON.parse(Buffer.concat(chunks)); requests.push({path:req.url,body,auth:req.headers.authorization});
    res.setHeader('content-type','application/json');
    const value=await handler?.({req,res,body,requests,candidate});
    if (res.writableEnded || res.destroyed) return;
    if (value === 'stall') return;
    res.end(JSON.stringify(value ?? (req.url.endsWith('/tokenizer') ? {usage:{prompt_tokens:100}} : reply({content:JSON.stringify(candidate)}))));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  t.after(async()=>{server.closeAllConnections(); await new Promise(r=>server.close(r)); rmSync(dir,{recursive:true,force:true});});
  const origin=`http://127.0.0.1:${server.address().port}`;
  const clientOpts={chat_endpoint:origin+'/chat/completions',tokenizer_endpoint:origin+'/tokenizer',...extra};
  const client=createGlmClient(clientOpts);
  const input={run_id:'test',request:'Change a to 2',fixture_root:root,client,observation_allowlist:['a.mjs'],mutation_allowlist:['a.mjs'],verification_command:[],
    tool_runtime:createReadOnlyToolRuntime({repository_root:root,observation_allowlist:['a.mjs']}), tool_policy:{allow:['read-file','read-context-evidence']},
    context_recycling:{directory:join(dir,'state'),context_limit:10000,recycle_at:9000,safety_margin:1000,state:{objective:'Change a to 2',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['test']}}};
  return {input,requests,candidate,root,dir,clientOpts};
}


// Real loopback HTTP; no paid calls. Temporary state is removed after each test.
test('fresh-client resumes preserve the run-wide tokenizer ceiling and all receipts', async t => {
 const x=await setup(t,({req,body,requests})=>{
  if(req.url.endsWith('/tokenizer'))return {usage:{prompt_tokens:body.messages.length>2?7000:100}};
  return reply({tool_calls:[tc('call-'+requests.filter(r=>r.path.endsWith('/chat/completions')).length)]},'tool_calls');
 },{maximum_requests:3});
 const results=[];
 for(let step=1;step<=3;step++) results.push(await runGlmAgent({...x.input,client:createGlmClient(x.clientOpts),retention_policy:'recent-observations-v1',pause_after_steps:step}));
 assert.deepEqual(results.map(r=>r.status),['PAUSED','PAUSED','BLOCK']);
 assert.deepEqual(results[2].reason_codes,['glm.tokenizer-limit']);
 assert.equal(x.requests.filter(r=>r.path.endsWith('/tokenizer')).length,6);
 assert.equal(x.requests.filter(r=>r.path.endsWith('/chat/completions')).length,2);
 assert.equal(results[2].receipts.length,8);
 const repeated=await runGlmAgent({...x.input,client:createGlmClient(x.clientOpts),retention_policy:'recent-observations-v1'});
 assert.deepEqual(repeated.reason_codes,['glm.tokenizer-limit']);
 assert.equal(x.requests.length,8);
});

for(const fresh of [false,true]) test(`idle pause restores receipts without duplication (fresh client: ${fresh})`,async t=>{
 const x=await setup(t,({req,requests})=>req.url.endsWith('/chat/completions') && requests.filter(r=>r.path.endsWith('/chat/completions')).length===1?reply({tool_calls:[tc()]},'tool_calls'):undefined);
 const paused=await runGlmAgent({...x.input,pause_after_steps:1});
 const old=structuredClone(paused.receipts);
 const result=await runGlmAgent({...x.input,client:fresh?createGlmClient(x.clientOpts):x.input.client});
 assert.equal(result.status,'AWAITING_APPROVAL');
 assert.deepEqual(result.receipts.slice(0,old.length),old);
 assert.equal(result.receipts.length,x.requests.length);
});

for(const failure of ['invalid-count','timeout']) test(`pre-dispatch tokenizer ${failure} poisons fresh-client resume`,async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/tokenizer')?(failure==='timeout'?'stall':{usage:{}}):undefined,{timeout_ms:30});
 const result=await runGlmAgent(x.input);
 assert.equal(result.status,'BLOCK');
 assert.equal(result.receipts.length,1);
 const ledger=JSON.parse(readFileSync(join(x.dir,'state','glm-transport-ledger.json'),'utf8'));
 assert.equal(ledger.phase,'failed'); assert.equal(ledger.tokenizer_calls,1);
 const count=x.requests.length;
 const resumed=await runGlmAgent({...x.input,client:createGlmClient(x.clientOpts)});
 assert.deepEqual(resumed.reason_codes,['glm.ledger-uncertain-or-failed']);
 assert.equal(x.requests.length,count);
});

test('attempt is durably pending before either HTTP request arrives',async t=>{
 let x;
 x=await setup(t,({req})=>{
  const ledger=JSON.parse(readFileSync(join(x.dir,'state','glm-transport-ledger.json'),'utf8'));
  assert.equal(ledger.phase,req.url.endsWith('/tokenizer')?'tokenizer-pending':'model-pending');
 });
 assert.equal((await runGlmAgent(x.input)).status,'AWAITING_APPROVAL');
});

for(const damage of ['missing','corrupt','pending','binding']) test(`resume blocks ${damage} accounting before network`,async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?reply({tool_calls:[tc()]},'tool_calls'):undefined);
 assert.equal((await runGlmAgent({...x.input,pause_after_steps:1})).status,'PAUSED');
 const path=join(x.dir,'state','glm-transport-ledger.json');
 const {ledger_digest,...body}=JSON.parse(readFileSync(path,'utf8'));
 if(damage==='missing')unlinkSync(path);
 else if(damage==='corrupt')writeFileSync(path,'{');
 else {
  if(damage==='pending')body.phase='tokenizer-pending';
  else body.binding='0'.repeat(64);
  writeFileSync(path,JSON.stringify({...body,ledger_digest:hash(body)}));
 }
 const count=x.requests.length;
 const result=await runGlmAgent({...x.input,client:createGlmClient(x.clientOpts)});
 assert.deepEqual(result.reason_codes,[{missing:'glm.ledger-missing',corrupt:'glm.ledger-integrity',pending:'glm.ledger-uncertain-or-failed',binding:'glm.ledger-binding-drift'}[damage]]);
 assert.equal(x.requests.length,count);
});

test('one client cannot be rebound to a different run ledger',async t=>{
 const x=await setup(t,({req})=>req.url.endsWith('/chat/completions')?reply({tool_calls:[tc()]},'tool_calls'):undefined);
 assert.equal((await runGlmAgent({...x.input,pause_after_steps:1})).status,'PAUSED');
 assert.throws(()=>x.input.client.bindRunLedger({directory:join(x.dir,'state'),binding:'0'.repeat(64)}),/ledger-rebind-forbidden/);
});
