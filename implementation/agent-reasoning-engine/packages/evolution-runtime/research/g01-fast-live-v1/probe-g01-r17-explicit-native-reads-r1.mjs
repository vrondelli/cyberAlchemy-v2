// Source-only replay of sealed G01 chooser paths through native read_file.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRepositoryTools} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';

const archive='/home/vlad_/are-benchmark-archive';
const packetsPath=join(archive,'g01-r17-explicit-file-chooser-exposed-r1-20261004/PACKETS.json');
const packetsSha='1ac6069a4125c315e956c2f1abff9ba0ebd4b281d7e37132c52f321cb9d58148';
const sealPath=join(archive,'g01-r17-explicit-file-chooser-exposed-r1-20261004/SEALED-RESPONSES.json');
const sealSha='66bd577b61a5be337a7306a568b5b60dbee1651aca888ce2a5792b2204dd8da8';
const definitionPath=join(archive,'g01-product-replication-input-r16-r2/DEFINITION.json');
const definitionSha='2f18ee18104c4826d06a5aeaa89a29e9e04b4204e0dbdb5908d514fc492f212e';
const coldRoot=join(archive,'g01-r16-r2-single-checkout-residency-r1/checkout-cold-20261004');
const outRoot=join(archive,'g01-r17-explicit-native-read-probe-r1-20261004');
const outPath=join(outRoot,'READ-PROBE.json');
const sha=x=>createHash('sha256').update(x).digest('hex');
const digest=path=>sha(readFileSync(path));
const need=(x,why)=>{if(!x)throw Error(`explicit-native-read.${why}`);};
const load=path=>JSON.parse(readFileSync(path,'utf8'));

async function main(){
  need(!existsSync(outRoot),'prior-output');
  need(digest(packetsPath)===packetsSha&&digest(sealPath)===sealSha&&
    digest(definitionPath)===definitionSha,'input-drift');
  const packets=load(packetsPath).ordered_packets;
  const selections=load(sealPath).rows;
  const tasks=load(definitionPath).ordered_tasks;
  need(packets.length===4&&selections.length===4&&
    packets.every((p,i)=>p.ordinal===i+19&&selections[i].ordinal===p.ordinal),'cohort-shape');
  const rows=[];
  for(let i=0;i<4;i++){
    const packet=packets[i],selected=selections[i],task=tasks[packet.ordinal-1];
    const repo=join(coldRoot,`task-${String(packet.ordinal).padStart(2,'0')}`);
    need(task.instance_id===packet.instance_id&&task.base_commit===
      execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),'commit-drift');
    const snapshots=[];
    const execute=createRepositoryTools({root:repo,base_commit:task.base_commit,
      record_source:s=>snapshots.push(s)});
    const eligible=new Map(packet.candidates.map(c=>[c.path,c]));
    need(selected.selected_paths.length===1&&eligible.has(selected.selected_paths[0]),'selection-drift');
    const path=selected.selected_paths[0],candidate=eligible.get(path);
    const anchor=candidate.code_windows[0]?.line??1;
    const args={path,revision:'base',start_line:Math.max(1,anchor-3),line_count:12};
    const read=await execute('read_file',args);
    need(read.ok===true&&read.output.path===path&&
      read.output.source_revision==='base'&&read.output.base_commit===task.base_commit&&
      snapshots.length===1&&snapshots[0].path===path,'native-read-failed');
    const blob=execFileSync('git',['-C',repo,'show',`${task.base_commit}:${path}`],
      {maxBuffer:4*1024*1024});
    need(read.output.source_sha256===sha(blob)&&candidate.bytes===blob.length&&
      read.output.byte_count===Buffer.byteLength(read.output.utf8),'content-drift');
    rows.push({ordinal:packet.ordinal,repo:packet.repo,path,
      call_sha256:sha(JSON.stringify(args)),output_sha256:sha(JSON.stringify(read.output)),
      source_sha256:read.output.source_sha256,start_line:read.output.start_line,
      end_line:read.output.end_line,byte_count:read.output.byte_count,
      snapshot_count:snapshots.length});
  }
  const receipt={schema_version:'g01.r17-explicit-native-read-probe-r1/v1',
    posture:'source-only-exposed-native-delivery-no-model-or-score',
    input_sha256:{packets:packetsSha,selections:sealSha,definition:definitionSha},
    script_sha256:digest(fileURLToPath(import.meta.url)),rows,
    native_reads:rows.length,read_failures:0,
    claim_ceiling:'Native base read reachability only; no live episode, native F1, all-in cost, independent result or superiority.'};
  mkdirSync(outRoot,{mode:0o700});
  const data=`${JSON.stringify(receipt,null,2)}\n`;
  writeFileSync(outPath,data,{flag:'wx',mode:0o600});
  process.stdout.write(`${JSON.stringify({native_reads:rows.length,read_failures:0,sha256:sha(data)})}\n`);
}
await main();
