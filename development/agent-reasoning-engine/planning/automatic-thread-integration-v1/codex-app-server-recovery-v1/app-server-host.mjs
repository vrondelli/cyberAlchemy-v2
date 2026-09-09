import {spawn} from 'node:child_process';
import {EventEmitter} from 'node:events';
import {readFileSync, mkdirSync, createReadStream} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID, createHash} from 'node:crypto';
import {createAppServerRpcClient} from '../../../../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/src/rpc-client.mjs';
import {openStore, digest, clone, need} from '../codex-host-recovery-v1/store.mjs';
import {startDecisionService} from '../codex-host-policy-v1/decision-service.mjs';

// Linux process identity distinguishes PID reuse and treats zombies as already fenced.
export function processIdentity(pid) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    if (['Z','X'].includes(fields[0])) return null;
    return {pid, start:fields[19], boot:readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim()};
  } catch (error) {if (error.code === 'ENOENT') return null; throw error;}
}
const terminal = turn => turn?.status === 'completed' && Number.isSafeInteger(turn.completedAt) && turn.itemsView === 'full';
const marker = operation => `ARE_OPERATION:${operation.operation_id}:${digest(operation)}`;
const hasMarker = (turn, operation) => turn.items?.some(item => item.type === 'userMessage' && item.content?.some(x => x.type === 'text' && x.text === marker(operation)));

/** Offline Linux candidate: one writer, one owned app-server, full persisted histories.
 * Unknown dispatch is never retried. A restart fences the previous process before reads.
 * Policy counts are synthetic fixtures, not a live tokenizer or a production bound. */
export async function openAppServerHost({directory, binary, provider, fault = async () => {}, onServer = () => {}}) {
  const url = new URL(provider);
  need(url.protocol === 'http:' && url.hostname === '127.0.0.1' && !url.username && !url.password && !url.search && !url.hash, 'offline-provider-required');
  provider = url.href;
  const store = await openStore(resolve(directory,'routing'));
  const peers = new Map();
  let child, rpc, exited;
  try {
    const binaryHash = createHash('sha256');
    for await (const chunk of createReadStream(binary)) binaryHash.update(chunk);
    const binding = digest({binary_digest:binaryHash.digest('hex'), provider, adapter_digest:createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex'), profile:'offline-two-answers-v1'});
    let journal = store.load() ?? {version:1,binding,lease:null,routes:{},operations:{}};
    need(journal.version === 1 && journal.binding === binding,'host-binding-drift');
    if (journal.lease) need(digest(processIdentity(journal.lease.pid)) !== digest(journal.lease), 'previous-server-still-live');
    const epoch = randomUUID();
    const save = () => store.save(journal);
    const isolatedHome = resolve(directory,'home');
    mkdirSync(isolatedHome,{recursive:true,mode:0o700});
    const failure = new EventEmitter();
    child = spawn(binary,['--disable-plugin-startup-tasks-for-tests','-c','model_provider="offline"','-c','model="gpt-5.1"',
      '-c',`model_providers.offline={name="Offline",base_url="${provider}",wire_api="responses",requires_openai_auth=false,request_max_retries=0,stream_max_retries=0}`,
      '-c','analytics.enabled=false','-c','feedback.enabled=false'],{
      cwd:isolatedHome, env:{PATH:process.env.PATH,HOME:isolatedHome,CODEX_HOME:isolatedHome,RUST_LOG:'error',CODEX_APP_SERVER_DISABLE_MANAGED_CONFIG:'1'},stdio:['pipe','pipe','pipe']});
    let stderr = '';
    child.stderr.on('data', chunk => {stderr = (stderr + chunk).slice(-12000);});
    exited = new Promise(resolveExit => {child.once('exit',(code,signal) => {failure.emit('failure',Error(`app-server exited ${code}/${signal}: ${stderr}`)); resolveExit();}); child.once('error',error => {failure.emit('failure',error);resolveExit();});});
    const ready = new Promise((ok,bad) => {child.once('spawn',ok);child.once('error',bad);});
    rpc = createAppServerRpcClient({transport:{input:child.stdin,output:child.stdout,ready,failure,close(){child.stdin.end();}},request_timeout_ms:30000,completion_timeout_ms:30000});
    await ready;
    journal.lease = processIdentity(child.pid); need(journal.lease,'server-identity-required'); save();
    onServer(journal.lease);
    await rpc.initialize({clientInfo:{name:'are_offline_recovery',version:'1'},capabilities:{experimentalApi:true}});
    await rpc.notify('initialized');
    const routeFor = operation => {
      const route = Object.values(journal.routes).find(x => x.context_id === operation.context_id);
      need(route && route.generation === operation.generation && route.capsule.capsule_digest === operation.capsule_digest, 'route-binding');
      return route;
    };
    const result = (operation,status,extra={}) => ({operation_id:operation.operation_id,context_id:operation.context_id,generation:operation.generation,status,evidence_ref:`app-server:${operation.context_id}:${operation.operation_id}:${status}`,...extra});
    const finish = (operation,turn) => {
      need(terminal(turn) && hasMarker(turn,operation),'native-completion-binding');
      const receipt = result(operation,'completed',{result:turn.items.filter(x => x.type === 'agentMessage').map(x => x.text).join('\n'),turn_id:turn.id});
      journal.operations[operation.operation_id] = {operation:clone(operation),receipt}; save(); return clone(receipt);
    };
    const inspectOperation = operation => {
      routeFor(operation);
      const saved = journal.operations[operation.operation_id];
      if (saved) need(digest(saved.operation) === digest(operation),'operation-binding-drift');
      return saved;
    };
    const lookup = async operation => {
      const saved = inspectOperation(operation);
      if (saved?.receipt) return clone(saved.receipt);
      if (!saved) return result(operation,'recycle',{provider_sent:false,effects_started:false});
      const response = await rpc.request('thread/read',{threadId:operation.context_id,includeTurns:true}).catch(() => null);
      if (!response?.thread || response.thread.id !== operation.context_id) return result(operation,'unknown');
      const matches = response.thread.turns.filter(turn => hasMarker(turn,operation));
      if (matches.length === 1 && terminal(matches[0]) && (!saved.turn_id || matches[0].id === saved.turn_id)) return finish(operation,matches[0]);
      return result(operation,'unknown');
    };
    return {
      adapter_id:'are-real-app-server-recovery-v1', rpc,
      snapshot:() => clone(journal),
      async open(request) {
        need(Buffer.byteLength(JSON.stringify(request.capsule)) <= 3500,'offline-capsule-limit');
        let route = journal.routes[request.handover_id];
        if (route) need(route.request_digest === digest(request),'handover-binding-drift');
        else {
          const scope = `are:${request.handover_id}`;
          const peer = await startDecisionService({scope,state_digest:request.capsule.source_state_digest,checkpoint_ref:request.handover_id,maximum_output_tokens:32,profiles:{'gpt-5.1':{
            measurement_ref:'synthetic-offline-fixture',limit_ref:'offline-150k',compaction_limit:150000,recycle_at:110000,safety_margin:10000,
            measure_request:({serialized_body}) => 60000 + 30000 * JSON.parse(serialized_body).input.filter(x => x.role === 'assistant').length}}});
          peers.set(request.handover_id,peer);
          const response = await rpc.request('thread/start',{model:'gpt-5.1',modelProvider:'offline',cwd:isolatedHome,approvalPolicy:'never',sandbox:'read-only',ephemeral:false,historyMode:'legacy',
            baseInstructions:'Offline recovery fixture. Return one short answer. Do not use tools.',
            developerInstructions:JSON.stringify(request.capsule),
            config:{experimental_context_gate:{endpoint:peer.endpoint,scope,maximum_output_tokens:32},model_auto_compact_token_limit:150000}});
          route = {...clone(request),request_digest:digest(request),context_id:response.thread.id,epoch,sealed:false};
          journal.routes[request.handover_id] = route; save();
          await fault('route-saved');
        }
        return {context_id:route.context_id,generation:route.generation,capsule_digest:route.capsule.capsule_digest,handover_id:request.handover_id,fresh_history:true,restored:true,evidence_ref:`app-server-route:${request.handover_id}`};
      },
      lookup,
      async step(operation) {
        const route = routeFor(operation);
        need(!route.sealed,'route-sealed');
        if (inspectOperation(operation)) return lookup(operation);
        if (route.epoch !== epoch) return result(operation,'recycle',{provider_sent:false,effects_started:false});
        need(operation.item.kind === 'provider','offline-provider-operation-only');
        const peer = peers.get(route.handover_id);
        const before = peer.snapshot().length;
        journal.operations[operation.operation_id] = {operation:clone(operation)}; save();
        await fault('dispatch-intent');
        const started = await rpc.request('turn/start',{threadId:route.context_id,input:[{type:'text',text:marker(operation),text_elements:[]}]});
        journal.operations[operation.operation_id].turn_id = started.turn.id; save();
        await fault('turn-started');
        const completed = await rpc.waitForNotification(x => x.method === 'turn/completed' && x.params?.threadId === route.context_id && x.params?.turn?.id === started.turn.id);
        // Read the persisted full view; completion notifications can omit item bodies.
        const view = await rpc.request('thread/read',{threadId:route.context_id,includeTurns:true});
        const turn = view.thread.turns.find(x => x.id === started.turn.id);
        await fault('native-completed');
        if (terminal(turn) && completed.params.turn.status === 'completed') return finish(operation,turn);
        const decisions = peer.snapshot().slice(before);
        if (decisions.length === 1 && decisions[0].action === 'recycle' && turn?.status === 'failed') {
          const receipt = result(operation,'recycle',{provider_sent:false,effects_started:false});
          journal.operations[operation.operation_id].receipt = receipt; save(); return clone(receipt);
        }
        return result(operation,'unknown');
      },
      async seal(context) {
        const route = routeFor(context);
        const uncertain = Object.values(journal.operations).filter(x => x.operation.context_id === context.context_id && !x.receipt).length;
        if (!uncertain) {route.sealed = true; save(); await peers.get(route.handover_id)?.close(); peers.delete(route.handover_id);}
        return {...context,sealed:!uncertain,pending:uncertain,uncertain,evidence_ref:`app-server-seal:${context.context_id}`};
      },
      async close() {
        for (const peer of peers.values()) await peer.close();
        await rpc.close(); child.stdin.end();
        const timer = setTimeout(() => child.kill('SIGTERM'),5000);
        try {await exited;} finally {clearTimeout(timer); await store.close();}
      }
    };
  } catch(error) {
    for (const peer of peers.values()) await peer.close();
    if (child) {child.kill('SIGTERM'); await exited;}
    await store.close(); throw error;
  }
}
