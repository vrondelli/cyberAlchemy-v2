import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {loadInput,sha,verifyRegistration} from '../adapter.mjs';
import {buildView,renderHtml} from '../view.mjs';
import {verifySaved} from '../verify.mjs';
import {digest,canonicalJson} from '../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
import {transitionResearchWork,replayResearchWork} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/src/research-work.mjs';
const root=fileURLToPath(new URL('../../../../../../',import.meta.url));
export const sourceSpecs=[
  ['clock','cyberAlchemy-v2/workspace/runtime/src/performance.ts',['performance.now()','finally','recordPerformanceSample']],
  ['connect','cyberAlchemy-v2/workspace/runtime/src/features/chat/are-chat-bridge.ts',['chat-cold-ipc-handshake','requestAnimationFrame','chat_connect','chat_replay','const startedAt = Date.now()']],
  ['native','cyberAlchemy-v2/essays/development/agent-runtime/implementation/desktop/src-tauri/src/main.rs',['chat_supervisor.prewarm(&chat_configuration)','get_or_try_init','process.events.bind(on_event)','process.events.replay()','async fn read_snapshot']],
  ['bridge','cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/client/desktop-bridge.mjs',['emittedAtMs: Date.now()','const started = await session.start','emit("session.ready"']],
  ['session','cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/client/session.mjs',['async start(','this.child = spawn','this.request("initialize"','this.request("thread/start"']],
  ['paint','cyberAlchemy-v2/workspace/runtime/src/features/chat/ChatSurface.tsx',['const oldest = Math.min','const recordedAt = Date.now()','chat.delta-to-projection','chat.delta-to-paint','const frame = requestAnimationFrame']],
];
export const sourceRead=path=>readFileSync(resolve(root,path),'utf8');
const check=(ok,why)=>{if(!ok)throw Error('latency-inspect.'+why);};
export function deriveReport(bindings=JSON.parse(readFileSync(new URL('./sources.json',import.meta.url))),read=sourceRead) {
  check(canonicalJson(bindings.map(b=>[b.id,b.path]))===canonicalJson(sourceSpecs.map(([id,path])=>[id,path])),'coverage');
  const sources=sourceSpecs.map(([id,path,selectors],i)=>{
    const bytes=read(path);check(sha(bytes)===bindings[i].sha256,'source-drift:'+id);
    return {id,path,sha256:bindings[i].sha256,selectors:selectors.map(selector=>{
      const offset=bytes.indexOf(selector);check(offset>=0,'selector-missing:'+id);
      return {selector,line:bytes.slice(0,offset).split('\n').length};
    })};
  });
  const boundaries=[
    {id:'handshake',source_refs:['clock','connect','native'],clock:'frontend performance.now',
      interval:'Before status invoke through its response and a subsequent requestAnimationFrame callback.',
      conclusion:'Not pure IPC latency: the metric includes frame scheduling. Status checks process-cell presence, not upstream readiness.',
      missing:['status IPC round trip separately','post-status animation-frame wait separately']},
    {id:'connect',source_refs:['clock','connect','native'],clock:'frontend performance.now',
      interval:'chat_connect invoke through response, including native supervisor acquisition, mutex acquisition and event binding.',
      conclusion:'Native setup already attempts prewarm. Cold process spawn is a fallback if the cell is empty; connect latency alone does not establish that it occurred.',
      missing:['prewarm success or failure receipt','handler entry/exit','mutex wait','fallback spawn duration']},
    {id:'upstream-ready',source_refs:['native','bridge','session'],clock:'No phase durations recorded by these functions',
      interval:'Native bridge spawn, Node startup/imports, proxy spawn, initialize response, thread/start response, session.ready emission.',
      conclusion:'These are distinct phases without per-phase timing in the inspected functions; no attribution of the measured delay to one phase is justified.',
      missing:['bridge entry time','proxy launch duration','initialize round trip','thread/start round trip']},
    {id:'replay',source_refs:['clock','connect','native'],clock:'frontend performance.now',
      interval:'chat_replay invoke through response after binding; buffered events can be delivered during replay.',
      conclusion:'Receiving session.ready can reflect buffered delivery, not the instant upstream became ready.',
      missing:['ready emission/receive correlation','buffer residence time','replayed event count with timing']},
    {id:'connect-to-ready',source_refs:['connect','bridge'],clock:'frontend Date.now at start and receive',
      interval:'startAreChatControlPlane call through receipt of session.ready.',
      conclusion:'Starts after native setup prewarm; not full cold desktop launch-to-ready. Wall-clock adjustments can affect elapsed time.',
      missing:['native launch-to-visible-ready duration','monotonic frontend start-to-receive companion span']},
    {id:'projection',source_refs:['paint','bridge'],clock:'Node Date.now emission to frontend Date.now projection',
      interval:'Oldest batched delta emission through direct textContent update and projection timestamp.',
      conclusion:'Cross-process wall-clock subtraction includes delivery and batching. It is not isolated DOM work; no cross-process monotonic origin is established.',
      missing:['correlated process-local monotonic spans','separate receive-to-flush and DOM update spans']},
    {id:'paint',source_refs:['paint'],clock:'Node Date.now emission to frontend Date.now rAF callback',
      interval:'Oldest delta emission through animation-frame callback scheduled after projection.',
      conclusion:'A requestAnimationFrame callback is the recorded boundary, not proof of pixels presented. Projection timestamp is taken before conditional scrolling.',
      missing:['layout/scroll cost','actual presentation evidence if required by a future contract']},
  ];
  const material={schema_version:'workspace.timing-boundary-report/v1',task_id:'latency.inspect',
    evidence_kind:'source-inspection-not-runtime-measurement',sources,boundaries,
    causal_conclusion:'not_evaluable',historical_host:'CC006 rejected for memory pressure; retained measurements cannot establish repair benefit.',
    clock_policy:'Use process-local monotonic spans and correlation IDs; never subtract unrelated monotonic origins. Keep existing metrics/budgets unchanged.',
    next_task:'latency.hypothesize',authority_effect:'none',open_questions_ref:'README.md#open-questions'};
  return {...material,report_digest:digest(material)};
}
export function verifyReport(report,bindings,read) {
  try{return canonicalJson(report)===canonicalJson(deriveReport(bindings,read));}catch{return false;}
}
export function buildProgress(report=deriveReport()) {
  check(verifySaved().ok,'predecessor-drift');check(verifyReport(report),'report-invalid');
  const prior=buildView(loadInput()), plan=prior.view.plan, registrations=[prior.registration];
  const verify_evidence=b=>{
    if(b.task_id==='evidence.inspect')return prior.verify_evidence(b);
    const ok=b.plan_digest===plan.plan_digest && b.task_id==='latency.inspect'
      && b.validator_ref==='workspace.research-evidence/v1' && b.criterion_id==='timing-boundary-report'
      && b.artifact_ref==='workspace-timing-report:'+report.report_digest && b.artifact_digest===digest(report)
      && verifyReport(report);
    return {ok,binding:b};
  };
  const args={plan,registrations,verify_registration:verifyRegistration,verify_evidence};
  const running=transitionResearchWork({...args,state:prior.view.state,expected_state_digest:prior.view.state.state_digest,
    event:{event_id:'latency-inspect-start-001',task_id:'latency.inspect',action:'start'}});
  const state=transitionResearchWork({...args,state:running,expected_state_digest:running.state_digest,
    event:{event_id:'latency-inspect-complete-001',task_id:'latency.inspect',action:'complete',evidence:[{
      criterion_id:'timing-boundary-report',artifact_ref:'workspace-timing-report:'+report.report_digest,artifact_digest:digest(report)}]}});
  check(canonicalJson(replayResearchWork({...args,events:state.events}))===canonicalJson(state),'replay');
  const {view_digest:previous_view_digest,...previous}=prior.view;
  const material={...previous,state,previous_view_digest,timing_report:report};
  const view={...material,view_digest:digest(material)};
  return {view,report,verify_evidence,html:renderHtml(view)};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const {view,report,html}=buildProgress();
  if(process.argv[2]==='--check-saved'){
    check(readFileSync(new URL('./report.json',import.meta.url),'utf8')===JSON.stringify(report,null,2)+'\n','saved-report-drift');
    check(readFileSync(new URL('./progress.json',import.meta.url),'utf8')===JSON.stringify(view,null,2)+'\n','saved-progress-drift');
    check(readFileSync(new URL('./view.html',import.meta.url),'utf8')===html,'saved-view-drift');
    console.log(JSON.stringify({ok:true,report_digest:report.report_digest,frontier:view.state.frontier,authority_effect:'none'},null,2));
  }else{check(process.argv.length===2,'unsupported-argument');console.log(JSON.stringify({report,view},null,2));}
}
