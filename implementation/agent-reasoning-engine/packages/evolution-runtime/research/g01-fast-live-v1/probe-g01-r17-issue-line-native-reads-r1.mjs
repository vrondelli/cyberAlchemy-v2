// Gold-blind issue-cited line anchors delivered through ContextBench read_file.
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
const outputRoot=join(archive,'g01-r17-issue-line-native-read-probe-r1-20261004');
const sha=x=>createHash('sha256').update(x).digest('hex');
const digest=path=>sha(readFileSync(path));
const need=(x,why)=>{if(!x)throw Error(`issue-line-native.${why}`);};
const extensions='(?:py|go|js|jsx|ts|tsx|java|rs|c|cc|cpp|h|hpp)';

function anchors(issue,path,totalLines){
  const name=path.split('/').at(-1);
  const matches=[];
  const patterns=[
    ['traceback',new RegExp(`File ["']([^"']+\\.${extensions})["'], line (\\d+)`,'gi')],
    ['url-line',new RegExp(`([A-Za-z0-9_./-]+\\.${extensions})#L(\\d+)(?:-L?(\\d+))?`,'gi')],
    ['path-line',new RegExp(`([A-Za-z0-9_./-]+\\.${extensions}):(\\d+)`,'gi')]
  ];
  for(const [kind,pattern] of patterns){
    for(const match of issue.matchAll(pattern)){
      if(match[1].split('/').at(-1).toLowerCase()!==name.toLowerCase())continue;
      const line=Number(match[2]);
      if(!Number.isSafeInteger(line)||line<1||line>totalLines)continue;
      if(!matches.some(x=>Math.abs(x.line-line)<=8))matches.push({kind,line});
    }
  }
  return matches.slice(-3);
}

async function main(){
  need(!existsSync(outputRoot),'prior-output');
  need(digest(packetsPath)===packetsSha&&digest(sealPath)===sealSha&&
    digest(definitionPath)===definitionSha,'input-drift');
  const packets=JSON.parse(readFileSync(packetsPath,'utf8')).ordered_packets;
  const selections=JSON.parse(readFileSync(sealPath,'utf8')).rows;
  const tasks=JSON.parse(readFileSync(definitionPath,'utf8')).ordered_tasks;
  need(packets.length===4&&selections.length===4&&
    packets.every((p,i)=>p.ordinal===i+19&&selections[i].ordinal===p.ordinal),'cohort-shape');
  const rows=[];
  for(let i=0;i<4;i++){
    const packet=packets[i],selected=selections[i],task=tasks[packet.ordinal-1];
    const repo=join(coldRoot,`task-${String(packet.ordinal).padStart(2,'0')}`);
    need(task.instance_id===packet.instance_id&&task.base_commit===
      execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),'commit-drift');
    const path=selected.selected_paths[0];
    need(selected.selected_paths.length===1,'selection-shape');
    const candidate=packet.candidates.find(c=>c.path===path);
    need(candidate,'candidate-drift');
    const blob=execFileSync('git',['-C',repo,'show',`${task.base_commit}:${path}`],
      {maxBuffer:4*1024*1024});
    need(blob.length===candidate.bytes,'source-size-drift');
    const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(blob);
    const totalLines=text.endsWith('\n')?text.split('\n').length-1:text.split('\n').length;
    let cited=anchors(packet.issue,path,totalLines);
    if(!cited.length)cited=[{kind:'fallback-first-code-window',line:candidate.code_windows[0]?.line??1}];
    const snapshots=[];
    const execute=createRepositoryTools({root:repo,base_commit:task.base_commit,
      record_source:s=>snapshots.push(s)});
    const reads=[];
    for(const anchor of cited){
      const args={path,revision:'base',start_line:Math.max(1,anchor.line-6),line_count:12};
      const result=await execute('read_file',args);
      need(result.ok===true&&result.output.source_revision==='base'&&
        result.output.base_commit===task.base_commit&&
        result.output.source_sha256===sha(blob),'native-read-failed');
      reads.push({anchor_kind:anchor.kind,anchor_line:anchor.line,
        start_line:result.output.start_line,end_line:result.output.end_line,
        byte_count:result.output.byte_count,output_sha256:sha(JSON.stringify(result.output)),
        source_sha256:result.output.source_sha256});
    }
    need(reads.length>=1&&reads.length<=3&&snapshots.length===reads.length&&
      reads.reduce((n,r)=>n+r.end_line-r.start_line+1,0)<=36,'read-budget');
    rows.push({ordinal:packet.ordinal,repo:packet.repo,path,
      base_commit:task.base_commit,reads,snapshot_count:snapshots.length});
  }
  const receipt={schema_version:'g01.r17-issue-line-native-read-probe-r1/v1',
    posture:'source-only-exposed-native-delivery-no-gold-model-or-score',
    input_sha256:{packets:packetsSha,selections:sealSha,definition:definitionSha},
    script_sha256:digest(fileURLToPath(import.meta.url)),
    policy:{anchor_sources:['traceback','url-line','path-line'],
      selected_path_basename_match:true,maximum_anchors_per_file:3,
      lines_per_read:12,maximum_lines_per_task:36,
      fallback:'first sealed code window',
      advancement_gate:{all_4_tasks_with_gold_line_overlap:true}},
    rows,claim_ceiling:'Native source-line delivery only; no live episode, native Span-F1, independent result or superiority.'};
  mkdirSync(outputRoot,{mode:0o700});
  const data=`${JSON.stringify(receipt,null,2)}\n`;
  writeFileSync(join(outputRoot,'READ-PROBE.json'),data,{flag:'wx',mode:0o600});
  process.stdout.write(`${JSON.stringify({tasks:rows.length,reads:rows.reduce((n,r)=>n+r.reads.length,0),
    cited_tasks:rows.filter(r=>r.reads.some(x=>x.anchor_kind!=='fallback-first-code-window')).length,
    sha256:sha(data)})}\n`);
}
await main();
