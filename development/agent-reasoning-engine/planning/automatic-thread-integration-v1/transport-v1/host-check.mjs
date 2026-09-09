import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {handle} from '../continuity-v1/adapter.mjs';
import {openTransport} from './transport.mjs';
import {createRpcClient,exchange} from './rpc-client.mjs';
const out=fileURLToPath(new URL('.',import.meta.url));
const bin='/mnt/c/Users/vlad_/.codex/bin/wsl/fea8d57830aac904/codex';
const ws=mkdtempSync(join(tmpdir(),'are-transport-host-')),home=join(ws,'home');mkdirSync(home,{mode:0o700});
let providerCalls=0,child,client;const methods=[],notes=[];
const server=createServer((req,res)=>{providerCalls++;req.resume();res.writeHead(400,{'content-type':'application/json'});res.end('{"error":{"message":"model calls forbidden in host acceptance check"}}');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const result={model_calls:0,credentials_used:false,turn_start_calls:0,provider:'rejecting loopback',scope:'real host injection acceptance; synthetic ARE compaction source; no native model compaction or steering acceptance claimed'};
try{
 writeFileSync(join(home,'config.toml'),`model="fixture-model"\nmodel_provider="fixture"\n[model_providers.fixture]\nname="Rejecting fixture"\nbase_url="http://127.0.0.1:${server.address().port}/v1"\nwire_api="responses"\nrequires_openai_auth=false\nrequest_max_retries=0\nstream_max_retries=0\n`);
 const env={...process.env,CODEX_HOME:home};for(const key of Object.keys(env))if(/API_KEY|AUTH_TOKEN|ACCESS_TOKEN/.test(key))delete env[key];
 child=spawn(bin,['app-server'],{cwd:ws,env,stdio:['pipe','pipe','ignore']});
 client=createRpcClient(child,{timeoutMs:15000,onNotification:m=>notes.push(m.method??'server-request')});
 const call=async(id,method,params)=>{if(!['initialize','thread/start','thread/read','thread/inject_items'].includes(method))throw Error('method-forbidden');methods.push(method);const r=await client.request({id,method,params});if(r.error)throw Error(JSON.stringify(r.error));return r.result;};
 await call('init','initialize',{clientInfo:{name:'are_transport_acceptance',version:'0.1'},capabilities:{experimentalApi:true}});client.notify({method:'initialized'});
 const started=await call('start','thread/start',{cwd:ws,model:'fixture-model',modelProvider:'fixture',sandbox:'read-only',approvalPolicy:'never',baseInstructions:'Isolated host acceptance fixture; no model generation.'});
 const thread=started.thread.id;result.thread_id=thread;
 const c={mode:'isolated-prototype',session_id:thread,cwd:ws,transcript_path:join(ws,'fixture-transcript'),participant_ref:'fixture-user',product_ref:'fixture-product',log_path:join(ws,'are-ledger')};
 const local=(kind,turn,extra)=>handle(c,{session_id:thread,cwd:ws,transcript_path:c.transcript_path,hook_event_name:kind,turn_id:turn,...extra});
 local('UserPromptSubmit','fixture-1',{prompt:'/are mode apply-scoped'});local('Stop','fixture-1',{stop_hook_active:false,last_assistant_message:'Synthetic fixture.'});
 local('UserPromptSubmit','fixture-2',{prompt:'From now on, use plain language.'});local('Stop','fixture-2',{stop_hook_active:false,last_assistant_message:'Synthetic fixture.'});
 local('UserPromptSubmit','fixture-active',{prompt:'Synthetic current request.'});
 const transport=openTransport({config:c,journalPath:join(ws,'transport-ledger')});
 const proposal=transport.notify({method:'item/completed',params:{threadId:thread,turnId:'fixture-active',item:{type:'contextCompaction',id:'fixture-compaction'},completedAtMs:1}});
 const exact=proposal.request.params.items[0].content[0].text;
 const guardedClient={request:async request=>{if(request.method!=='thread/inject_items'||request.params.threadId!==thread)throw Error('unexpected-transport-request');methods.push(request.method);return client.request(request);}};
 result.injection=await exchange(transport,guardedClient);
 const read=await call('read','thread/read',{threadId:thread,includeTurns:true});result.read_back_succeeded=Boolean(read.thread);
 const files=[];function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.jsonl'))files.push(p);}}walk(home);
 result.persisted_exact_context=files.some(path=>readFileSync(path,'utf8').split('\n').some(line=>{try{return JSON.stringify(JSON.parse(line)).includes(JSON.stringify(exact).slice(1,-1));}catch{return false;}}));
 result.transport_phase=transport.inspect().phase;result.model_observed=false;
 if(result.injection.status!=='host-accepted'||!result.persisted_exact_context)throw Error('acceptance-or-persistence-not-proven');
 result.status='PASS';
}catch(error){result.status='FAIL';result.error=error.message;process.exitCode=1;}
finally{
 client?.close();
 if(child&&child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),3000);await done;clearTimeout(timer);}
 await new Promise(resolve=>server.close(resolve));
 result.provider_requests=providerCalls;result.process_stopped=true;result.methods=methods;result.notifications=notes;
 if(providerCalls!==0){result.status='FAIL';result.error='unexpected-provider-request';process.exitCode=1;}
 writeFileSync(join(out,'HOST-RESULT.json'),JSON.stringify(result,null,2)+'\n');
 rmSync(ws,{recursive:true,force:true});
 console.log(JSON.stringify(result));
}
