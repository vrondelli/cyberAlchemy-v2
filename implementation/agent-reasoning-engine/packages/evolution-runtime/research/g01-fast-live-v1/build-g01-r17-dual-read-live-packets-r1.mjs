// Source-only packets of two actual ContextBench read_file deliveries per exposed task.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRepositoryTools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';

const archive='/home/vlad_/are-benchmark-archive';
const dualPath=join(archive,'g01-r17-explicit-dual-view-r2-20261004/SOURCE-SEAL.json');
const dualSha='67ca94bc226e424aa50d57adbf8f91727e490f1538c7f9c0e189285a057ad892';
const packetsPath=join(archive,'g01-r17-explicit-file-chooser-exposed-r1-20261004/PACKETS.json');
const packetsSha='1ac6069a4125c315e956c2f1abff9ba0ebd4b281d7e37132c52f321cb9d58148';
const definitionPath=join(archive,'g01-product-replication-input-r16-r2/DEFINITION.json');
const definitionSha='2f18ee18104c4826d06a5aeaa89a29e9e04b4204e0dbdb5908d514fc492f212e';
const coldRoot=join(archive,'g01-r16-r2-single-checkout-residency-r1/checkout-cold-20261004');
const outputRoot=join(archive,'g01-r17-dual-read-live-packets-r1-20261004');
const sha=x=>createHash('sha256').update(x).digest('hex');
const digest=path=>sha(readFileSync(path));
const load=path=>JSON.parse(readFileSync(path,'utf8'));
const need=(ok,why)=>{if(!ok)throw Error(`g01-dual-read-packets.${why}`);};

async function main(){
  need(!existsSync(outputRoot)&&digest(dualPath)===dualSha&&
    digest(packetsPath)===packetsSha&&digest(definitionPath)===definitionSha,'input-drift');
  const dual=load(dualPath).rows;
  const packets=load(packetsPath).ordered_packets;
  const tasks=load(definitionPath).ordered_tasks;
  need(dual.length===4&&packets.length===4&&dual.every((r,i)=>r.ordinal===i+19&&
    packets[i].ordinal===r.ordinal),'cohort-drift');
  const rows=[];
  for(let i=0;i<4;i++){
    const row=dual[i],packet=packets[i],task=tasks[row.ordinal-1];
    const repo=join(coldRoot,`task-${String(row.ordinal).padStart(2,'0')}`);
    need(task.instance_id===packet.instance_id&&row.repo===packet.repo&&
      execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim()===task.base_commit,
      'task-identity-drift');
    const snapshots=[];
    const execute=createRepositoryTools({root:repo,base_commit:task.base_commit,
      record_source:s=>snapshots.push(s)});
    const views=[];
    for(let j=0;j<2;j++){
      const range=row.ranges[j];
      const args={path:row.path,revision:'base',start_line:range.start_line,
        line_count:range.end_line-range.start_line+1};
      const result=await execute('read_file',args);
      need(result.ok===true&&result.output.start_line===range.start_line&&
        result.output.end_line===range.end_line&&
        result.output.source_sha256===range.source_sha256&&
        sha(JSON.stringify(result.output))===range.native_output_sha256,'native-delivery-drift');
      views.push({id:j+1,kind:range.kind,start_line:range.start_line,
        end_line:range.end_line,utf8:result.output.utf8,
        native_output_sha256:range.native_output_sha256,
        source_sha256:range.source_sha256});
    }
    need(snapshots.length===2&&views.every(v=>v.utf8.length>0),'snapshot-drift');
    rows.push({ordinal:row.ordinal,instance_id:packet.instance_id,repo:row.repo,
      commit:task.base_commit,path:row.path,issue:packet.issue,views,
      maximum_final_views:2});
  }
  const result={schema_version:'g01.r17-dual-read-live-packets-r1/v1',
    posture:'exposed-source-only-native-delivery-before-model-or-gold',
    input_sha256:{dual:dualSha,packets:packetsSha,definition:definitionSha},
    script_sha256:digest(fileURLToPath(import.meta.url)),ordered_packets:rows,
    claim_ceiling:'Two real native reads per exposed task, no model selection or score yet.'};
  mkdirSync(outputRoot,{mode:0o700});
  const data=`${JSON.stringify(result,null,2)}\n`;
  writeFileSync(join(outputRoot,'PACKETS.json'),data,{flag:'wx',mode:0o600});
  process.stdout.write(`${JSON.stringify({tasks:rows.length,reads:8,
    bytes:Buffer.byteLength(data),sha256:sha(data)})}\n`);
}
await main();
