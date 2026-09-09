import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,symlinkSync,unlinkSync,existsSync,rmSync,openSync,writeSync,fsyncSync,closeSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {handle} from '../continuity-v1/adapter.mjs';
import {openTransport} from '../transport-v1/transport.mjs';
import {createRpcClient,exchange} from '../transport-v1/rpc-client.mjs';
import {grade} from './grade.mjs';
const out=fileURLToPath(new URL('.',import.meta.url));
const bin='/mnt/c/Users/vlad_/.codex/bin/wsl/fea8d57830aac904/codex';
const runLock=openSync(join(out,'RUN-LOCK'),'wx',0o600);writeSync(runLock,'One attempt only; never automatically rerun.\n');fsyncSync(runLock);closeSync(runLock);
const ws=mkdtempSync(join(tmpdir(),'are-transport-canary-')),home=join(ws,'codex-home');mkdirSync(home,{mode:0o700});
let child,client,fatal=null,thread=null;const notes=[],methods=[];
const report={status:'PREFLIGHT',model:'gpt-5.6-luna',effort:'low',service_tier:'default',turn_limit:2,turns_reserved:0,turns:[],activation:false,auth_type:null,scope:'Transport model visibility; local preference and compaction trigger are fixtures'};
const save=()=>writeFileSync(join(out,'RESULT.json'),JSON.stringify(report,null,2)+'\n');
const reserve=()=>{if(report.turns_reserved>=2)throw Error('turn-budget-exhausted');report.turns_reserved++;const fd=openSync(join(out,'TURN-COUNT.json'),'w',0o600);try{writeSync(fd,JSON.stringify({reserved_turns:report.turns_reserved,limit:2})+'\n');fsyncSync(fd);}finally{closeSync(fd);}save();};
const prompt='Explain caching briefly. Return only a JSON object with explanation and source_digest. For source_digest, return the exact source_digest from scoped user preference data, or "absent" if none is present. Do not use tools.';
async function rpc(id,method,params){
 if(!['initialize','account/read','model/list','hooks/list','thread/start','turn/start','thread/inject_items'].includes(method))throw Error('method-forbidden');
 if(method==='turn/start')reserve();methods.push(method);
 const r=await client.request({id,method,params});if(r.error)throw Error(method+': '+JSON.stringify(r.error));return r.result;
}
async function runTurn(number){
 const offset=notes.length;
 const started=await rpc('model-'+number,'turn/start',{threadId:thread,model:'gpt-5.6-luna',effort:'low',serviceTierForTurn:'default',input:[{type:'text',text:prompt}],clientUserMessageId:'transport-canary-'+number});
 const turnId=started.turn.id,deadline=Date.now()+90000;let completed;
 while(!completed){if(fatal)throw fatal;if(Date.now()>deadline)throw Error('turn-completion-timeout-no-retry');completed=notes.slice(offset).find(n=>n.method==='turn/completed'&&n.params?.turn?.id===turnId);if(!completed)await new Promise(resolve=>setTimeout(resolve,100));}
 const response=notes.slice(offset).filter(n=>n.method==='item/completed'&&n.params?.turnId===turnId&&n.params.item?.type==='agentMessage').map(n=>n.params.item.text??'').join('\n');
 const row={number,turn_id:turnId,status:completed.params.turn.status,prompt,response};report.turns.push(row);save();
 if(row.status!=='completed')throw Error('turn-not-completed:'+row.status);
 console.log(JSON.stringify({turn:number,status:row.status,response}));return row;
}
try{
 symlinkSync('/mnt/c/Users/vlad_/.codex/auth.json',join(home,'auth.json'));
 writeFileSync(join(home,'config.toml'),'model="gpt-5.6-luna"\nmodel_reasoning_effort="low"\nservice_tier="default"\n');
 const env={...process.env,CODEX_HOME:home};for(const key of Object.keys(env))if(/API_KEY|AUTH_TOKEN|ACCESS_TOKEN/.test(key))delete env[key];
 child=spawn(bin,['app-server'],{cwd:ws,env,stdio:['pipe','pipe','ignore']});
 client=createRpcClient(child,{timeoutMs:30000,onNotification:message=>{
  if(message.id!==undefined){fatal=Error('unexpected-server-request');throw fatal;}
  notes.push(message);
  if(message.method==='item/started'&&!['userMessage','agentMessage','reasoning','contextCompaction'].includes(message.params?.item?.type)){fatal=Error('model-tool-or-unsupported-item:'+message.params?.item?.type);throw fatal;}
 }});
 await rpc('init','initialize',{clientInfo:{name:'are_transport_canary',version:'0.1'},capabilities:{experimentalApi:true}});client.notify({method:'initialized'});
 const account=await rpc('account','account/read',{refreshToken:false});report.auth_type=account.account?.type;if(report.auth_type!=='chatgpt')throw Error('chatgpt-login-required');
 const models=await rpc('models','model/list',{includeHidden:true});if(!models.data.some(m=>m.model==='gpt-5.6-luna'))throw Error('luna-unavailable');
 const hooks=await rpc('hooks','hooks/list',{cwds:[ws]});
 function commands(value){if(Array.isArray(value))return value.flatMap(commands);if(value&&typeof value==='object')return Object.entries(value).flatMap(([k,v])=>k==='command'&&typeof v==='string'?[v]:commands(v));return [];}
 if(commands(hooks).length)throw Error('unexpected-isolated-hooks');report.hook_commands=0;
 const started=await rpc('thread','thread/start',{model:'gpt-5.6-luna',allowProviderModelFallback:false,cwd:ws,approvalPolicy:'never',sandbox:'read-only',historyMode:'legacy',experimentalRawEvents:true,baseInstructions:'You are a text-only canary assistant. Never use tools, browse, delegate or read files. Reply in at most 100 words. Follow current requests and scoped preference guidance. When asked for source_digest, copy it only from provided scoped user preference data; otherwise return absent. Return valid JSON.',config:{model_reasoning_effort:'low',service_tier:'default'}});
 thread=started.thread.id;report.thread_id=thread;report.actual_model=started.model;if(started.model!=='gpt-5.6-luna')throw Error('wrong-model');save();
 const baseline=await runTurn(1);report.baseline=grade(baseline.response,'absent');if(!report.baseline.ok)throw Error('baseline-provenance-not-absent');save();
 const c={mode:'isolated-prototype',session_id:thread,cwd:ws,transcript_path:started.thread.path,participant_ref:'canary:chatgpt-user',product_ref:'canary:are-transport',log_path:join(ws,'are-ledger')};
 const local=(kind,turn,extra)=>handle(c,{session_id:thread,cwd:ws,transcript_path:c.transcript_path,hook_event_name:kind,turn_id:turn,...extra});
 local('UserPromptSubmit',baseline.turn_id,{prompt});local('Stop',baseline.turn_id,{stop_hook_active:false,last_assistant_message:baseline.response});
 local('UserPromptSubmit','fixture-mode',{prompt:'/are mode apply-scoped'});
 local('UserPromptSubmit','fixture-preference',{prompt:'From now on, include examples.'});
 const transport=openTransport({config:c,journalPath:join(ws,'transport-ledger')});
 const proposed=transport.notify({method:'item/completed',params:{threadId:thread,turnId:'fixture-preference',item:{type:'contextCompaction',id:'fixture-compaction'},completedAtMs:Date.now()}});
 const context=proposed.request.params.items[0].content[0].text;
 const expected=JSON.parse(context.split('\n').slice(1).join('\n'))[0].source_digest;
 if(prompt.includes(expected)||baseline.response.includes(expected))throw Error('provenance-contamination');
 report.injected_context=context;report.expected_digest=expected;save();
 const guarded={request:async request=>{if(request.method!=='thread/inject_items'||request.params.threadId!==thread)throw Error('unexpected-injection-request');methods.push(request.method);return client.request(request);}};
 report.host_acceptance=await exchange(transport,guarded);if(report.host_acceptance.status!=='host-accepted')throw Error('injection-not-accepted');save();
 const observed=await runTurn(2);report.model_visibility=grade(observed.response,expected);if(!report.model_visibility.ok)throw Error('model-did-not-report-injected-provenance');
 report.status='PASS_BOUNDED_MODEL_VISIBILITY';report.claim_ceiling='Exact injected ARE provenance observed in Luna output; not automatic native compaction/steering, capability learning or reliability benefit';save();
}catch(error){report.status=report.turns_reserved?'FAIL':'BLOCKED_PREFLIGHT';report.error=error.message;process.exitCode=1;console.log(JSON.stringify({status:report.status,error:report.error}));}
finally{
 client?.close();
 if(child&&child.exitCode===null){const done=once(child,'exit');child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),3000);await done;clearTimeout(timer);}
 const auth=join(home,'auth.json');if(existsSync(auth))unlinkSync(auth);
 report.temporary_auth_reference_removed=!existsSync(auth);report.process_stopped=true;report.methods=methods;
 const selected=notes.filter(n=>['turn/completed','thread/tokenUsage/updated','item/completed'].includes(n.method));
 writeFileSync(join(out,'EVENTS.json'),JSON.stringify(selected,null,2)+'\n');
 for(const [file,name] of [['are-ledger','ARE-LEDGER.jsonl'],['transport-ledger','TRANSPORT-LEDGER.jsonl']])if(existsSync(join(ws,file)))writeFileSync(join(out,name),readFileSync(join(ws,file)));
 const usages=notes.filter(n=>n.method==='thread/tokenUsage/updated');report.token_usage=usages.at(-1)?.params?.tokenUsage??null;
 save();rmSync(ws,{recursive:true,force:true});
 console.log(JSON.stringify({status:report.status,turns_reserved:report.turns_reserved,model_visibility:report.model_visibility?.ok,process_stopped:report.process_stopped,token_usage:report.token_usage}));
}
