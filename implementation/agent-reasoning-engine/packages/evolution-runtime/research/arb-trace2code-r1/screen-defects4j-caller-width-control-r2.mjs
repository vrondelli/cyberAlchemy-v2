#!/usr/bin/env node
// Source-only matched-width development control. Open Questions: G01-DEFECTS4J-32-R3-RESULT.md.
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-java-r3.mjs';
import {productionPath} from './screen-defects4j-production-candidates-r1.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const [root,trees,output]=process.argv.slice(2);
if(!root||!trees||!output||existsSync(output))throw Error('args or output exists');
const source=readFileSync(join(root,'CALLER-CONTEXT-SCREEN-R1.json'));
if(sha(source)!=='50ffdfc6a02194388c73ed3022f25d511c5dbc8f734a60d107e44a83bb0a23b0')throw Error('caller seal drift');
const caller=JSON.parse(source);const byCaller=new Map(caller.cases.map(c=>[c.case_id,c]));
const packetBytes=readFileSync(join(root,'PACKETS.jsonl'));
if(sha(packetBytes)!==caller.packets_sha256)throw Error('packet drift');
const packets=packetBytes.toString().trimEnd().split('\n').map(JSON.parse);
if(packets.length!==32||byCaller.size!==32)throw Error('denominator');
const cases=[];
for(const p of packets){
  const query=p.prompt.split('Failure:\n')[1].split('\nCandidates:\n')[0]+'\nCaller source observations:\n';
  const engine=createRankedSourceAcquisition({root:join(trees,p.case_id+'-checkout'),base_commit:p.buggy_revision,
    problem_statement:query,maximum_index_bytes:256*1024*1024,mode:'trace-text',allow_projection:false});
  const production=engine.rankAll(query).ranked_files.filter(productionPath);
  const c=byCaller.get(p.case_id),original=p.candidates.map(c=>c.path);
  const added=production.filter(path=>!original.includes(path)).slice(0,c.added_candidates.length);
  const candidates=[...new Set([...original,...added])].sort();
  if(candidates.length!==c.candidates.length)throw Error('width mismatch');
  const anchorChecks=c.observations.map(o=>{
    const lines=readFileSync(join(trees,p.case_id+'-checkout',o.path),'utf8').split(/\r?\n/);
    return o.utf8.split('\n')[o.trace_line-o.start_line]===lines[o.trace_line-1];
  });
  cases.push({case_id:p.case_id,original_candidates:original,candidates,added_candidates:added,
    caller_production_top20:production.slice(0,20),caller_observation_anchor_checks:anchorChecks});
  process.stdout.write(JSON.stringify({case_id:p.case_id,added:added.length})+'\n');
}
writeFileSync(output,JSON.stringify({schema:'are.defects4j-caller-width-control-r2/v1',
  posture:'exposed source-only matched-width control, original query plus identical observation-header boilerplate only; not model accuracy',
  packets_sha256:sha(packetBytes),caller_screen_sha256:sha(source),
  policy:'add header-controlled original-query production-ranked missing paths, same per-case added count as caller screen',
  observations:cases.flatMap(c=>c.caller_observation_anchor_checks).length,
  incomplete_anchors:cases.flatMap(c=>c.caller_observation_anchor_checks).filter(x=>!x).length,
  cases},null,2)+'\n',{flag:'wx',mode:0o600});
