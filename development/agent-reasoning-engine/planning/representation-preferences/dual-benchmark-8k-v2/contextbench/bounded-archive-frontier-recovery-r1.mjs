// Immutable archived read recovery. Open questions: BOUNDED-ARCHIVE-FRONTIER-R1.md.
import {createHash} from 'node:crypto';
import {stable,observationMaterial,observationItems as nativeItems,attachObservationHandles as nativeHandles} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
export const recoveryName='recover_archived_read';
export const recoveryTool={type:'function',function:{name:recoveryName,description:'Read exact original source bytes from an immutable tool-output archive, even after working-tree edits. Use the digest and observation index in deferred.archive_recovery; optional path/range fields narrow and verify the read.',parameters:{type:'object',additionalProperties:false,required:['archive_sha256','observation_index'],properties:{archive_sha256:{type:'string',pattern:'^[a-f0-9]{64}$'},observation_index:{type:'integer',minimum:0,maximum:29},path:{type:'string',minLength:1},revision:{enum:['base','current']},start_line:{type:'integer',minimum:1},line_count:{type:'integer',minimum:1,maximum:100}}}}};
export function observationItems(call,result){
 if(call.function?.name!==recoveryName)return nativeItems(call,result);
 if(result?.ok!==true)return [];
 const args=JSON.parse(call.function.arguments),origin=result.archive_origin;
 if(!origin||origin.archive_sha256!==args.archive_sha256||origin.observation_index!==args.observation_index)throw Error('recovery.origin-binding');
 return [{tool_call_id:call.id,o:result.output}];
}
export function attachObservationHandles(call,result){
 if(call.function?.name!==recoveryName)return nativeHandles(call,result);
 const items=observationItems(call,result);if(!items.length)return result;
 const o=items[0].o,id=hash(observationMaterial(call.id,o));return {...result,output:{...o,read_id:id,retrieval_handle:'observed-read:'+id}};
}
export function recoverArchivedRead({archive,args}){
 try{
  const compact=['archive_sha256','observation_index'],full=Object.keys(recoveryTool.function.parameters.properties).sort();
  const supplied=Object.keys(args??{}).sort().join(',');
  const isCompact=supplied===compact.join(','),isFull=supplied===full.join(',');
  if(!args||(!isCompact&&!isFull)||!(/^[a-f0-9]{64}$/.test(args.archive_sha256))||!Number.isSafeInteger(args.observation_index)||args.observation_index<0||args.observation_index>29||
    (isFull&&(!Number.isSafeInteger(args.start_line)||args.start_line<1||!Number.isSafeInteger(args.line_count)||args.line_count<1||args.line_count>100)))throw Error('arguments');
  const {call,result}=archive.outputByDigest(args.archive_sha256);
  if(result.ok!==true)throw Error('unsuccessful-original');
  const items=observationItems(call,result),o=items[args.observation_index]?.o;
  if(!o||isFull&&(o.path!==args.path||o.source_revision!==args.revision||args.start_line<o.start_line||args.start_line>o.end_line))throw Error('source-range');
  const start=isCompact?o.start_line:args.start_line;
  const end=Math.min(o.end_line,start+(isCompact?100:args.line_count)-1),utf8=o.utf8.split('\n').slice(start-o.start_line,end-o.start_line+1).join('\n');
  const output={...o,start_line:start,end_line:end,utf8,byte_count:Buffer.byteLength(utf8)};delete output.read_id;delete output.retrieval_handle;
  return {ok:true,output,archive_origin:{archive_sha256:args.archive_sha256,observation_index:args.observation_index},source_status:'immutable bytes from original read; current revision label refers to that read time'};
 }catch(error){return {ok:false,error:'archive-recovery.'+error.message};}
}
