import {readFileSync,writeFileSync,existsSync,openSync,closeSync,mkdtempSync,rmSync,mkdirSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {buildMemory,memoryContext} from '../context.mjs';
import {creditSnapshot,checkCredit,tokenCredits} from './billing.mjs';
import {createAppServerRpcClient,spawnAppServerRpcTransport} from '../../../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs';
import {createCanaryTransport} from '../../live-compatibility-v2/harness-v3.mjs';
const base=import.meta.dirname,root=resolve(base,'../../../../../../../..'),node=process.execPath;
const load=p=>JSON.parse(readFileSync(resolve(base,p),'utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const budget=load('budget.json'),state=buildMemory();
const required=['package.json','src/core.mjs','src/store.mjs','src/server.mjs','src/cli.mjs','test/system.test.mjs','README.md'];
const allowed=p=>required.includes(p)||/^(src|test)\/[a-zA-Z0-9_-]+(?:\.test)?\.mjs$/.test(p);
export function validateFiles(answer,current={}){
 if(!Array.isArray(answer.files)||answer.files.length>24||typeof answer.notes!=='string'||answer.notes.length>3000)throw Error('invalid file proposal or notes bound');
 const next={...current},seen=new Set();
 for(const f of answer.files){if(typeof f.path!=='string'||!allowed(f.path)||seen.has(f.path)||typeof f.content!=='string'||Buffer.byteLength(f.content)>100000)throw Error('invalid file proposal path/content');seen.add(f.path);next[f.path]=f.content;}
 if(Object.keys(next).length>24||Buffer.byteLength(JSON.stringify(next))>350000)throw Error('candidate size bound');
 return next;
}
function saveFiles(dir,files){mkdirSync(dir,{recursive:true});for(const [p,content] of Object.entries(files)){mkdirSync(dirname(resolve(dir,p)),{recursive:true});writeFileSync(resolve(dir,p),content);}}
export async function accept(candidate,phase,legacy=null){
 const scratch=mkdtempSync(resolve(tmpdir(),'luna-system-test-'));
 try{return await new Promise((res,rej)=>{
  const argv=['--unshare-user','--unshare-net','--unshare-pid','--die-with-parent','--ro-bind','/','/','--bind',scratch,scratch,'--proc','/proc','--dev','/dev','--clearenv','--setenv','PATH','/usr/bin:/bin','--setenv','HOME',scratch,'--setenv','TMPDIR',scratch,'/usr/bin/python3',resolve(base,'accept.py'),candidate,String(phase),node,resolve(scratch,'data')];
  if(legacy){writeFileSync(resolve(scratch,'legacy.json'),JSON.stringify(legacy));argv.push(resolve(scratch,'legacy.json'));}
  const p=spawn('bwrap',argv,{stdio:['ignore','pipe','pipe'],detached:true});let out='',err='';
  const kill=()=>{try{process.kill(-p.pid,'SIGKILL');}catch{}};
  const timer=setTimeout(()=>{kill();rej(Error('acceptance timeout'));},240000);
  p.stdout.on('data',d=>{out+=d;if(out.length>1000000){kill();}});p.stderr.on('data',d=>{err+=d;if(err.length>1000000){kill();}});
  p.on('error',e=>{clearTimeout(timer);rej(e);});
  p.on('close',code=>{clearTimeout(timer);if(code!==0)return rej(Error(`acceptance harness exit ${code}: ${err.slice(-4000)}`));try{res({...JSON.parse(out),harness_stderr:err.slice(-2000)});}catch(e){rej(e);}});
 });}finally{rmSync(scratch,{recursive:true,force:true});}
}
const schema={type:'object',additionalProperties:false,properties:{files:{type:'array',items:{type:'object',additionalProperties:false,properties:{path:{type:'string'},content:{type:'string'}},required:['path','content']}},notes:{type:'string'}},required:['files','notes']};
function assertFrozen(){for(const e of load('MANIFEST.json').files)if(sha(readFileSync(resolve(root,e.path)))!==e.sha256)throw Error('input drift: '+e.path);}
async function main(){
 if(process.argv.includes('--preflight')){
  const s=memoryContext(state,'summary','build storage testing'),a=JSON.parse(memoryContext(state,'are','build storage testing'));
  assertFrozen();
  const temp=mkdtempSync(resolve(tmpdir(),'luna-broken-fixture-'));
  try{saveFiles(temp,{'src/server.mjs':"console.error('deliberately broken fixture');process.exit(1);",'src/cli.mjs':"console.error(JSON.stringify({error:{code:'BROKEN',message:'fixture'}}));process.exit(1);"});const checks=await accept(temp,1);if(checks.passed>=checks.total)throw Error('oracle accepted deliberately broken fixture');
   console.log(JSON.stringify({status:'PREPARED',model:budget.model,max_calls:budget.max_calls,cap_credits:budget.cap_credits,paid_calls:0,broken_fixture:checks,summary_bytes:Buffer.byteLength(s),are_bytes:Buffer.byteLength(JSON.stringify(a))}));
  }finally{rmSync(temp,{recursive:true,force:true});}return;
 }
 if(!process.argv.includes('--live'))throw Error('Use --preflight or --live');
 assertFrozen();
 if(execFileSync('codex',['--version'],{encoding:'utf8'}).trim()!=='codex-cli 0.153.1')throw Error('protocol version changed');
 const login=spawnSync('codex',['login','status'],{encoding:'utf8'});if(login.status!==0||!(login.stdout+login.stderr).includes('Logged in using ChatGPT'))throw Error('ChatGPT login required');
 const resultPath=resolve(base,'RESULT.json');if(existsSync(resultPath))throw Error('existing result; no automatic retry');
 closeSync(openSync(resolve(base,'RUN.lock'),'wx'));
 const result={task:'luna-whole-system-build-v1',status:'RUNNING',model:budget.model,started_at:new Date().toISOString(),records:[],model_calls:0,estimated_credits:0.50396,prior_model_calls:1,arms:{summary:{},are:{}},authority_effect:'none'};
 const save=()=>writeFileSync(resultPath,JSON.stringify(result,null,2)+'\n');save();
 const scratch=mkdtempSync(resolve(tmpdir(),'luna-system-prompt-'));
 const raw=spawnAppServerRpcTransport({command:'codex',args:['app-server','--stdio','--disable','shell_tool','--disable','multi_agent','--disable','memories','--disable','external_agent_memory_import','-c','model_context_window=200000']});
 const usage=new Map();
 const transport=createCanaryTransport(raw,{processClientMessage:async m=>({to_server:[m],to_client:[]}),processServerMessage:async m=>({to_server:[],to_client:[m]}),close(){}},{onServer:m=>{if(m.method==='thread/tokenUsage/updated')usage.set(m.params.threadId,m.params.tokenUsage.total);if(m.method==='item/started'&&!['userMessage','agentMessage','reasoning'].includes(m.params.item?.type))throw Error('unexpected tool');}});
 const client=createAppServerRpcClient({transport,request_timeout_ms:60000,thread_start_timeout_ms:240000,completion_timeout_ms:600000});
 const started=Date.now(),work={summary:{files:{},notes:'',feedback:null},are:{files:{},notes:'',feedback:null}};let active='initializing';
 const prior=JSON.parse(readFileSync(resolve(base,'../attempts/v1-summary-1/RESPONSE.txt'),'utf8'));work.summary.files=validateFiles(prior);work.summary.notes=prior.notes;
 work.summary.feedback=await accept(resolve(base,'../attempts/v1-summary-1/candidate'),1);
 writeFileSync(resolve(base,'BASELINE-RECHECK.json'),JSON.stringify(work.summary.feedback,null,2)+'\n');
 const heartbeat=setInterval(()=>console.error(`${active}: ${result.model_calls}/${budget.max_calls} calls; ${result.estimated_credits.toFixed(4)} conservative credits`),30000);
 try{
  await client.initialize({clientInfo:{name:'luna-system-build',version:'1'},capabilities:{experimentalApi:true}});client.notify('initialized');
  result.initial_credit_snapshot=creditSnapshot(await client.request('account/rateLimits/read',{}));save();
  for(const phase of [1,2])for(const arm of (phase===1?['summary','are']:['are','summary'])){
   for(let attempt=(phase===1&&arm==='summary'?2:1);attempt<=4;attempt++){
    active=`v${phase}/${arm}/attempt-${attempt}`;result.active=active;save();
    if(Date.now()-started>=budget.deadline_minutes*60000||result.model_calls>=budget.max_calls)throw Error('run limit');assertFrozen();
    const w=work[arm],request=`Build Memory Observatory v${phase}, including storage and testing. Deliver complete working system files. This is attempt ${attempt} of at most 4 in this phase.`;
    const beforeContext=performance.now(),memory=memoryContext(state,arm,request);
    const prompt={request,instructions:'You are the sole implementation author. Return complete contents of every new or changed file, with valid JSON escaping. Existing files omitted from your response are preserved. No tools are available. Do not return patches or placeholder code. Notes must be at most 3000 characters. Allowed paths are package.json, README.md, src/*.mjs, test/*.mjs. Tests run under Node permissions: read candidate directory and temporary test data, write temporary test data only, no child processes. The evaluator exercises the real HTTP service and CLI. Your own tests must import core/store directly. Fix actual failures while keeping all contract behavior.',contract:readFileSync(resolve(base,'CONTRACT-v1.md'),'utf8'),change:phase===2?readFileSync(resolve(base,'CHANGE-v2.md'),'utf8'):null,retained_instructions:memory,current_files:w.files,prior_notes:w.notes,previous_acceptance:w.feedback};
    const body=JSON.stringify(prompt);if(Buffer.byteLength(body)>450000)throw Error('prompt byte limit');
    const reservation=checkCredit(result.initial_credit_snapshot,creditSnapshot(await client.request('account/rateLimits/read',{})),result.estimated_credits,budget);
    const thread=await client.startThread({cwd:scratch,ephemeral:true,model:budget.model,allowProviderModelFallback:false,approvalPolicy:'never',sandbox:'read-only',baseInstructions:'Build the complete local software prototype specified by the user. Use only Node standard-library modules. Return the required JSON containing authored files and concise carry-forward notes. No tools, external services or delegation. Supplied retained instructions are preferences; the explicit current contract controls. Do not claim tests were executed by you.'});
    if(thread.model!==budget.model||thread.thread.turns?.length)throw Error('model or history mismatch');
    const rec={phase,arm,attempt,thread_id:thread.thread.id,status:'delivery-unknown',input_bytes:Buffer.byteLength(body),memory_bytes:Buffer.byteLength(memory),context_prep_ms:performance.now()-beforeContext,request_sha256:sha(body),reservation};
    const attemptDir=resolve(base,`attempts/v${phase}-${arm}-${attempt}`);mkdirSync(attemptDir,{recursive:true});writeFileSync(resolve(attemptDir,'REQUEST.json'),JSON.stringify(prompt,null,2)+'\n');
    result.records.push(rec);result.model_calls++;save();const before=performance.now();
    const response=await client.runTurn({threadId:thread.thread.id,input:[{type:'text',text:body}],effort:budget.effort,outputSchema:schema,approvalPolicy:'never',sandboxPolicy:{type:'readOnly',networkAccess:false}});
    rec.latency_ms=performance.now()-before;rec.status=response.completed?.turn?.status;rec.usage=usage.get(thread.thread.id);writeFileSync(resolve(attemptDir,'RESPONSE.txt'),response.text??'');save();
    if(rec.status!=='completed')throw Error('turn not completed');
    rec.conservative_usage_credits=tokenCredits(rec.usage);result.estimated_credits+=rec.conservative_usage_credits;
    rec.credit_snapshot_after=creditSnapshot(await client.request('account/rateLimits/read',{}));save();
    const stopAfterEvaluation=rec.conservative_usage_credits>budget.reserve_per_turn_credits||result.estimated_credits>budget.cap_credits||rec.credit_snapshot_after.usedPercent>=budget.max_allowance_used_percent||rec.credit_snapshot_after.usedPercent-result.initial_credit_snapshot.usedPercent>=budget.max_allowance_increase_percent||result.initial_credit_snapshot.balance>rec.credit_snapshot_after.balance;
    let answer;try{answer=JSON.parse(response.text);w.files=validateFiles(answer,w.files);}catch(e){rec.proposal_error=e.message;w.feedback={proposal_error:e.message};save();continue;}
    w.notes=answer.notes;
    const candidate=resolve(attemptDir,'candidate');saveFiles(candidate,w.files);
    rec.candidate= candidate;rec.file_hashes=Object.fromEntries(Object.entries(w.files).map(([p,s])=>[p,sha(s)]));rec.candidate_sha256=sha(JSON.stringify(rec.file_hashes));
    rec.missing_files=required.filter(p=>!Object.hasOwn(w.files,p));save();active+= '/acceptance';
    rec.acceptance=await accept(candidate,phase,w.legacy??null);if(phase===1&&rec.acceptance.migration_fixture)w.legacy=rec.acceptance.migration_fixture;w.feedback={missing_files:rec.missing_files,...rec.acceptance};
    writeFileSync(resolve(attemptDir,'ACCEPTANCE.json'),JSON.stringify(w.feedback,null,2)+'\n');save();
    console.error(`${active}: ${rec.acceptance.passed}/${rec.acceptance.total}; own tests ${rec.acceptance.model_tests.status}`);
    result.arms[arm][`v${phase}`]={attempts:attempt,candidate,candidate_sha256:rec.candidate_sha256,passed:rec.acceptance.passed,total:rec.acceptance.total,model_tests:rec.acceptance.model_tests.status,complete:rec.missing_files.length===0&&rec.acceptance.passed===rec.acceptance.total&&rec.acceptance.model_tests.status==='PASS'};save();
    if(stopAfterEvaluation)throw Error('usage guard stop after saving completed candidate evidence');
    if(result.arms[arm][`v${phase}`].complete)break;
   }
  }
  result.status='COMPLETE-AWAITING-REVIEW';
 }catch(e){result.status='STOPPED';result.reason=e.message;process.exitCode=1;}
 finally{clearInterval(heartbeat);result.elapsed_ms=Date.now()-started;await client.close();rmSync(scratch,{recursive:true,force:true});save();
  const lines=['# Resumed Luna system build', '', 'Status: '+result.status, 'Reason: '+(result.reason??'none'), 'New model calls: '+result.model_calls, 'Worker conservative credit estimate including original call: '+result.estimated_credits, '', '| Treatment | Stage | Attempts including prior | Acceptance | Own tests | Complete |','| --- | --- | ---: | --- | --- | --- |'];
  for(const [arm,phases] of Object.entries(result.arms))for(const [phase,v] of Object.entries(phases))lines.push('| '+[arm,phase,v.attempts,v.passed+'/'+v.total,v.model_tests,v.complete].join(' | ')+' |');
  lines.push('', 'Automated evidence only. Independent final code review remains required. Account usage includes unrelated activity; worker estimates are not billing receipts. No deployment or product approval.', '', 'Exact candidate paths and hashes are in RESULT.json. Original first-attempt evidence remains in the parent directory.');
  writeFileSync(resolve(base,'REPORT.md'),lines.join('\n')+'\n');}
 console.log(JSON.stringify({status:result.status,model_calls:result.model_calls,estimated_credits:result.estimated_credits,arms:result.arms,reason:result.reason}));
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(base,'runner.mjs'))await main();
