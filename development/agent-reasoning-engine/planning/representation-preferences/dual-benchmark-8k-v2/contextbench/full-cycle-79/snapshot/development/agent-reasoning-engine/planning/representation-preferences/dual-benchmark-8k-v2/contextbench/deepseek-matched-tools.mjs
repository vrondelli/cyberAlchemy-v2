// Shared repository capabilities through DSH's native tool registry.
// Execution records are not proof of model delivery. See DEEPSEEK-MATCHED-TOOLS.md.
import {createRepositoryTools,tools as repositoryTools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {attachObservationHandles,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {encodeToolPayload,PAYLOAD_ENCODING} from './tool-payload-codec.mjs';
const need=(v,m)=>{if(!v)throw Error('dsh-matched-tools.'+m);};
export function createMatchedRepositoryTools({root,base_commit,persist,payload_encoding=null}){
 need(payload_encoding===null||payload_encoding===PAYLOAD_ENCODING,'payload-encoding');
 need(typeof persist==='function','persistence-required');
 let busy=false,poisoned=false,sequence=0;const seen=new Set(),records=[];
 const save=record=>{try{const result=persist(structuredClone(record));need(!result||typeof result.then!=='function','synchronous-persistence-required');records.push(structuredClone(record));}catch(e){poisoned=true;throw e;}};
 const executeNative=createRepositoryTools({root,base_commit,record_source:snapshot=>save({kind:'source-snapshot',snapshot})});
 const definitions=repositoryTools.map(({function:tool})=>({
  ...structuredClone(tool),
  output:{schema:{type:'object'},render:(_args,value)=>[{type:'text',text:stable(payload_encoding===PAYLOAD_ENCODING?encodeToolPayload({tool:tool.name,result:value}).payload:value)}]},
  isConcurrencySafe:()=>false,
  async execute(args,exec){
   need(!poisoned,'poisoned');need(!busy,'overlapping-call');
   need(exec&&typeof exec.callId==='string'&&exec.callId.length>0&&exec.signal instanceof AbortSignal,'execution-identity');
   need(!exec.signal.aborted,'cancelled');need(!seen.has(exec.callId),'duplicate-call-id');
   busy=true;seen.add(exec.callId);
   const call={id:exec.callId,type:'function',function:{name:tool.name,arguments:stable(args)}},index=sequence++;
   try{
    save({kind:'tool-intent',index,call});
    const output=attachObservationHandles(call,await executeNative(tool.name,structuredClone(args)));
    save({kind:'tool-result',index,call,output,delivery_confirmed:false,cancelled_after_execution:exec.signal.aborted});
    need(!exec.signal.aborted,'cancelled-after-execution');
    return output;
   }catch(error){poisoned=true;throw error;}finally{busy=false;}
  }
 }));
 return {definitions,snapshot:()=>({poisoned,busy,records:structuredClone(records)}),
  register(ctx){need(ctx?.tools&&typeof ctx.tools.register==='function','registry');const disposers=[];try{for(const definition of definitions)disposers.push(ctx.tools.register(definition));}catch(e){for(const dispose of disposers.reverse())dispose();throw e;}return ()=>{for(const dispose of disposers.reverse())dispose();};}};
}
