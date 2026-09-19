// Scripted qualification evidence, never model delivery. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import {createHash} from 'node:crypto';
import {runSourceIndex} from './ranked-source-index-service-r1.mjs';
import {createRankedReadAdapter,validateRankedReadResult} from './schema-agreement-tool-r1.mjs';
import {createRepositoryTools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('ranked-representative.'+m);};
export function representativeQuery(problem_statement){
 need(typeof problem_statement==='string'&&problem_statement.trim().length>0&&Buffer.from(problem_statement).toString('utf8')===problem_statement,'task-text');
 let query='',bytes=0;
 for(const char of problem_statement){const size=Buffer.byteLength(char);if(bytes+size>4096)break;query+=char;bytes+=size;}
 need(query.trim().length>0,'query-empty');return query;
}
export async function buildRepresentativeRankedSource({task,repoRoot,source_index,signal,before_index}){
 need(signal instanceof AbortSignal&&!signal.aborted&&typeof before_index==='function','admission');
 const query=representativeQuery(task.problem_statement);
 need(source_index?.schema==='are.ranked-source-worker/v1'&&source_index.base_commit===task.base_commit&&/^[a-f0-9]{64}$/.test(source_index.index_digest),'source-index');
 need(await before_index()===true,'storage');
 const indexed=await runSourceIndex({repository:repoRoot,base_commit:task.base_commit,query,signal});
 need(indexed.value.index_digest===source_index.index_digest,'index-drift');
 const sources=new Map(),snapshots=[];
 const native=createRepositoryTools({root:repoRoot,base_commit:task.base_commit,record_source:s=>{sources.set(s.path,s.utf8);snapshots.push(s);}});
 const args={query,mode:'ranked',revision:'base',path_prefix:'',offset:0,limit:5};
 const call={id:'qualification-ranked-'+hash(stable({instance_id:task.instance_id,query})).slice(0,24),type:'function',function:{name:'search',arguments:stable(args)}};
 const hints=indexed.value.query_result,expected=indexed.expected;
 const execute=createRankedReadAdapter({native,source_hints:{expected,query:async value=>{need(value===query,'query-drift');return hints;}},snapshot:async(path,sha)=>{need(hash(sources.get(path)??'')===sha,'snapshot');return sources.get(path);}});
 const result=await execute(call,args),evidence={call,result,hints,expected,sources};
 validateRankedReadResult({...evidence,args});
 need(await before_index()===true,'post-storage');
 return {evidence,snapshots,provenance:{schema:'are.ranked-representative-source/v1',task_text_sha256:hash(task.problem_statement),query_sha256:hash(stable({query})),query_policy:'UTF-8 prefix of task problem_statement, at most 4096 bytes',index_digest:expected.index_digest,settlement:indexed.settlement,python_settlement:indexed.python_settlement,model_calls:0,provider_calls:0,model_generated:false,delivery:'unconfirmed'}};
}
