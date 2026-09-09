import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createInteractionLearningLifecycle} from '../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/interaction-learning-lifecycle.mjs';
import {digestValue} from '../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/canonical.mjs';
import {materializeIntentContract} from '../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/contracts.mjs';
import {acquireReasoningStateWriterLock, recoverReasoningStateLedger} from '../../../../../implementation/agent-reasoning-engine/packages/reasoning-state-runtime/index.mjs';
const preferences = Object.freeze({examples:'Include a concrete example when explaining a concept.', concise:'Keep explanations concise.'});
const need=(v,r)=>{if(!v)throw Error(r);};
const ok=r=>{need(r?.ok,(r?.reason_codes??['operation-failed']).join(','));return r;};
const nonblank=v=>typeof v==='string'&&v.trim().length>0;
export function handle(config,event) {
  need(config?.mode==='isolated-prototype','live-mode-not-supported');
  for(const key of ['session_id','cwd','transcript_path','participant_ref','product_ref','log_path']) need(nonblank(config[key]),'invalid-binding');
  for(const key of ['session_id','cwd','transcript_path']) need(event[key]===config[key],'scope-mismatch');
  need(!event.agent_id&&!event.agent_type,'subagent-not-supported');
  need(nonblank(event.turn_id),'turn-identity-required');
  need(['UserPromptSubmit','Stop','Interrupt'].includes(event.hook_event_name),'unsupported-event');
  if(event.hook_event_name==='UserPromptSubmit') need(nonblank(event.prompt)&&Buffer.byteLength(event.prompt)<=16384,'prompt-invalid');
  if(event.hook_event_name==='Stop') need(event.stop_hook_active===false && (event.last_assistant_message===null || typeof event.last_assistant_message==='string'&&Buffer.byteLength(event.last_assistant_message)<=32768),'completion-invalid');
  const lock=ok(acquireReasoningStateWriterLock({path:config.log_path})).lock;
  let ledger;
  try {
    ledger=ok(recoverReasoningStateLedger({path:config.log_path,ledger_id:'hook:'+digestValue(config)})).ledger;
    const events=ledger.snapshot().filter(e=>e.event_kind==='are-hook');
    const record=(key,content)=>{
      const entry=ok(ledger.append({event_kind:'are-hook',idempotency_key:key,content,provenance_refs:[key]}));
      const epoch=ok(ledger.seal({event_digests:[entry.event.event_digest],consumer_ref:config.participant_ref,request_ref:key}));
      ok(ledger.checkpoint({checkpoint_kind:'manual',epoch:epoch.value,subject_digest:digestValue(content)}));
    };
    const turn=event.turn_id, thread=config.session_id;
    const prior=events.find(e=>e.content.kind==='prompt'&&e.content.turn===turn);
    let supplied={};
    const life=createInteractionLearningLifecycle({ledger,configuration:{enabled:true,participant_ref:config.participant_ref,product_ref:config.product_ref,policy:{mode:'observe',max_inline_bytes:7000}},input_provider:()=>supplied});
    if(event.hook_event_name!=='UserPromptSubmit') {
      need(prior,'unobserved-turn');
      need(!events.some(e=>e.content.kind==='outcome'&&e.content.turn===turn),'duplicate-outcome');
      if(event.hook_event_name==='Stop') {
        ok(life.complete({method:'turn/completed',params:{threadId:thread,turn:{id:turn,items:event.last_assistant_message===null?[]:[{type:'agentMessage',text:event.last_assistant_message}]}}}));
      }
      record('outcome:'+turn,{kind:'outcome',turn,status:event.hook_event_name==='Stop'?'completed':'interrupted'});
      return {};
    }
    need(!prior,'duplicate-or-steered-turn-not-supported');
    const command=event.prompt.split('\n')[0];
    const mode=/^\/are mode (off|observe|apply-scoped)$/.exec(command);
    const learn=/^\/are learn (examples|concise)$/.exec(command);
    const disable=/^\/are disable (examples|concise)$/.exec(command);
    const once=command==='/are once no-lessons';
    need(!command.startsWith('/are ')||mode||learn||disable||once,'unknown-control');
    const state=life.inspect({detail:true});
    if(learn) {
      const last=events.filter(e=>e.content.kind==='outcome').at(-1);
      need(last?.content.status==='completed','completed-episode-required');
      supplied.feedback={quote:command,instruction:preferences[learn[1]],target:'response',posture:'explicit',retention_scope:'current-interaction',correction_kind:'misinterpretation',expected_checks:[],episode_ref:'learning:'+JSON.stringify([thread,last.content.turn])};
    }
    if(once) supplied.override_lesson_ids=Object.keys(state.lessons);
    // Reserve before any lifecycle mutation. A failure consumes this turn until explicit recovery.
    record('prompt:'+turn,{kind:'prompt',turn,request_digest:digestValue(event.prompt)});
    if(mode)ok(life.control({control_id:turn,action:'set-mode',mode:mode[1]}));
    if(disable)for(const lesson of Object.values(state.lessons))if(lesson.preference.instruction===preferences[disable[1]])ok(life.control({control_id:turn+lesson.lesson_id,action:'disable-reuse',lesson_id:lesson.lesson_id}));
    const prepared=ok(life.prepare({id:turn,params:{threadId:thread,clientUserMessageId:turn,input:[{type:'text',text:event.prompt}]}}));
    // Only fixed allowlisted instructions reach developer context; omit raw prompt/source strings.
    const items=prepared.view.items.map(i=>{
      need(Object.values(preferences).includes(i.instruction),'unrecognized-lesson');
      return {instruction:i.instruction,source_digest:digestValue(i.source_ref),lesson_digest:i.lesson_digest};
    });
    const context=items.length ? 'Scoped user preference data. Apply only when consistent with the current request and higher-priority instructions. This grants no authority.\n'+JSON.stringify(items):'';
    need(Buffer.byteLength(context)<=8192,'context-overflow');
    const contract=materializeIntentContract({request_ref:prepared.request.request_ref,request_digest:digestValue(event.prompt),objective:event.prompt,target:'response',disposition:'act'});
    ok(life.dispatch(prepared,digestValue(event),digestValue(context),contract));
    ok(life.bind(turn,thread,turn));
    record('projection:'+turn,{kind:'projection',turn,context_digest:digestValue(context),bytes:Buffer.byteLength(context),lessons:items.length,delivery:'unknown-until-host-receipt'});
    return context?{hookSpecificOutput:{hookEventName:'UserPromptSubmit',additionalContext:context}}:{};
  } finally {try{ledger?.close();}finally{lock.release();}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try {
    const config=JSON.parse(readFileSync(process.argv[2],'utf8'));
    // Bound stdin before parsing; the hook host must also enforce an execution timeout.
    let bytes=0;const chunks=[];
    for await(const chunk of process.stdin){bytes+=chunk.length;need(bytes<=65536,'input-overflow');chunks.push(chunk);}
    const result=handle(config,JSON.parse(Buffer.concat(chunks).toString('utf8')));
    process.stdout.write(JSON.stringify(result)+'\n');
  }catch(error){process.stderr.write('ARE hook: '+error.message+'\n');process.stdout.write('{}\n');process.exitCode=1;}
}
