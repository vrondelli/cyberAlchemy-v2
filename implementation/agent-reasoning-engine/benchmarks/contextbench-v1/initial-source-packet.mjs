// Bounded pinned-base evidence delivered before the first model dispatch.
// The ordinary capture/receipt binder, not this helper, confirms delivery.
import {createHash} from 'node:crypto';
import {attachObservationHandles,stable} from './delivery.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
const generatedPath=path=>/(?:_grpc\.pb\.go|\.pb\.go|\.min\.js|\.generated\.[a-z0-9]+)$/i.test(path);

export function selectInitialSourceHints(hints,focused_hints=[]){
  if(!Array.isArray(hints)||!Array.isArray(focused_hints)||focused_hints.length>6)throw Error('source-packet.invalid-hints');
  const chosen=[],seen=new Set();
  const add=(hint,packet_role)=>{
    if(!hint||typeof hint.path!=='string'||seen.has(hint.path))return;
    if(!Number.isSafeInteger(hint.start_line)||hint.start_line<1)return;
    chosen.push({...hint,packet_role});seen.add(hint.path);
  };
  for(const hint of hints){if(chosen.length>=3)break;if(!generatedPath(hint?.path??''))add(hint,'ranked');}
  for(const hint of hints)if(['sibling','contract'].includes(hint.kind)&&chosen.length<6)add(hint,'neighbor');
  for(const hint of focused_hints)add(hint,'focused');
  return chosen;
}

export async function prepareInitialSourcePacket({hints,focused_hints=[],execute_tool}){
  if(typeof execute_tool!=='function')throw Error('source-packet.invalid-tool');
  const selected=selectInitialSourceHints(hints,focused_hints);
  if(!selected.length||selected.length>12)throw Error('source-packet.invalid-selection');
  const calls=[],results=[],receipt=[];let deliveredBytes=0;
  for(const [index,hint] of selected.entries()){
    const args={path:hint.path,start_line:Math.max(1,hint.start_line-8),line_count:50,revision:'base'};
    const call={id:`initial-source-${hint.packet_role}-${index}-${digest(stable(args)).slice(0,16)}`,type:'function',function:{name:'read_file',arguments:stable(args)}};
    const result=attachObservationHandles(call,await execute_tool('read_file',args));
    if(result?.ok!==true||result.output?.source_revision!=='base')throw Error('source-packet.read-failed:'+hint.path);
    deliveredBytes+=Buffer.byteLength(result.output.utf8);
    if(deliveredBytes>49152)throw Error('source-packet.byte-limit');
    calls.push(call);
    results.push({role:'tool',tool_call_id:call.id,content:stable(result)});
    receipt.push({path:result.output.path,packet_role:hint.packet_role,start_line:result.output.start_line,end_line:result.output.end_line,
      read_id:result.output.read_id,source_sha256:result.output.source_sha256,bytes:Buffer.byteLength(result.output.utf8)});
  }
  return {exchange:[{role:'assistant',content:'',tool_calls:calls},...results],receipt,
    source_bytes:deliveredBytes,selection_rule:'top-three-ranked-plus-up-to-three-neighbors-plus-up-to-six-focused-reads'};
}
