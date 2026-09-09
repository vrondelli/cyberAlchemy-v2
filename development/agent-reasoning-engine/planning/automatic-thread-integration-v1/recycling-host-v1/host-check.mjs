import {spawn} from 'node:child_process';import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,resolve,sep} from 'node:path';import {once} from 'node:events';import {fileURLToPath} from 'node:url';
import {createRpcClient} from '../transport-v1/rpc-client.mjs';
import {stateCapsule} from '../recycling-v1/recycling.mjs';
import {strictHostClient,inspectBudget,stageFreshContext} from './host-adapter.mjs';
const out=fileURLToPath(new URL('.',import.meta.url)),ws=mkdtempSync(join(tmpdir(),'are-recycle-host-')),home=join(ws,'home');mkdirSync(home,{mode:0o700});
let child,raw,providerCalls=0;const methods=[];
const server=createServer((req,res)=>{providerCalls++;req.resume();res.writeHead(400,{'content-type':'application/json'});res.end('{"error":{"message":"no inference allowed"}}');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const report={model_calls:0,credentials_used:false,cutover:false};
try{
 writeFileSync(join(home,'config.toml'),`model="fixture"\nmodel_provider="fixture"\nmodel_auto_compact_token_limit=100000\nmodel_auto_compact_token_limit_scope="total"\n[model_providers.fixture]\nname="Rejecting fixture"\nbase_url="http://127.0.0.1:${server.address().port}/v1"\nwire_api="responses"\nrequires_openai_auth=false\nrequest_max_retries=0\nstream_max_retries=0\n`);
 const env={...process.env,CODEX_HOME:home};for(const k of Object.keys(env))if(/API_KEY|AUTH_TOKEN|ACCESS_TOKEN/.test(k))delete env[k];
 child=spawn('/mnt/c/Users/vlad_/.codex/bin/wsl/fea8d57830aac904/codex',['app-server'],{cwd:ws,env,stdio:['pipe','pipe','ignore']});raw=createRpcClient(child,{timeoutMs:15000});
 const client=strictHostClient({request:message=>{methods.push(message.method);return raw.request(message);}});
 const call=async(id,method,params)=>{const r=await client.request({id,method,params});if(r.error)throw Error(JSON.stringify(r.error));return r.result;};
 await call('init','initialize',{clientInfo:{name:'are_recycle_host','version':'0.1'},capabilities:{experimentalApi:true}});raw.notify({method:'initialized'});
 const config=await call('config','config/read',{cwd:ws,includeLayers:false});report.budget=inspectBudget(config.config,null);
 const params={cwd:ws,model:'fixture',modelProvider:'fixture',sandbox:'read-only',approvalPolicy:'never',baseInstructions:'Isolated context staging fixture; do not generate.'};
 const source=await call('old','thread/start',params);
 const oldText='Old transient context marker; do not carry this raw history.';
 await call('old-data','thread/inject_items',{threadId:source.thread.id,items:[{type:'message',role:'developer',content:[{type:'input_text',text:oldText}]}]});
 const capsule=stateCapsule({task_id:'same-logical-task',checkpoint_ref:'fixture-checkpoint',state:{objective:'Continue the agreed task',constraints:['No deployment'],completed:['Fixture test passed'],pending:['Integrate component'],facts:['Schema v1'],lessons:['Use concrete examples'],evidence_refs:['fixture-evidence:1']}});
 const staged=await stageFreshContext(client,{capsule,source_context_id:source.thread.id,thread_params:params});
 const path=resolve(staged.rollout_path);if(!path.startsWith(resolve(home)+sep))throw Error('unexpected-rollout-scope');
 const lines=readFileSync(path,'utf8').split('\n').filter(Boolean).map(JSON.parse);
 const strings=[];function collect(v){if(typeof v==='string')strings.push(v);else if(Array.isArray(v))v.forEach(collect);else if(v&&typeof v==='object')Object.values(v).forEach(collect);}lines.forEach(collect);
 report.exact_capsule_persisted=strings.includes(staged.injected_text);report.old_raw_context_absent=!strings.includes(oldText);report.fresh_context_id=staged.fresh_context_id;report.source_context_id=source.thread.id;report.distinct_contexts=staged.fresh_context_id!==source.thread.id;
 report.blocked_methods=[];for(const method of ['turn/start','turn/steer','thread/queue/start','thread/compact/start','review/start','thread/realtime/start']){try{await client.request({id:'blocked:'+method,method,params:{threadId:staged.fresh_context_id}});throw Error('generation-gate-bypass');}catch(e){if(e.message!=='generation-or-unknown-method-blocked')throw e;report.blocked_methods.push(method);}}
 if(!report.exact_capsule_persisted||!report.old_raw_context_absent||!report.distinct_contexts)throw Error('fresh-capsule-verification-failed');
 report.status='PASS_STAGING_AND_REFUSAL';report.live_recycling_enforcement='BLOCKED_MISSING_PROVIDER_STEP_GATE';
}catch(e){report.status='FAIL';report.error=e.message;process.exitCode=1;}
finally{raw?.close();if(child&&child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),3000);await done;clearTimeout(timer);}await new Promise(r=>server.close(r));report.provider_requests=providerCalls;report.process_stopped=true;report.methods_sent=methods;if(providerCalls){report.status='FAIL';report.error='unexpected-provider-request';process.exitCode=1;}writeFileSync(join(out,'HOST-RESULT.json'),JSON.stringify(report,null,2)+'\n');rmSync(ws,{recursive:true,force:true});console.log(JSON.stringify(report));}
