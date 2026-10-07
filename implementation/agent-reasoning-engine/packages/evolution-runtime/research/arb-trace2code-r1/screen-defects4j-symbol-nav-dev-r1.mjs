#!/usr/bin/env node
// Exposed source-only screen. Open Questions: G01-DEFECTS4J-SYMBOL-NAV-DEV-R1.md.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {buildTypeLinks,navigateTypes} from './java-type-links-dev-r1.mjs';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-java-r3.mjs';
import {productionPath} from './screen-defects4j-production-candidates-r1.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
export function queryViews(expanded,observations){
  const trace=expanded.split('\nCaller source observations:\n')[0];
  const lines=trace.trimEnd().split('\n');
  return [...new Set([expanded,trace,lines[1]??lines[0],...observations.map(o=>`${o.path}:${o.start_line}\n${o.utf8}`)].filter(q=>q.trim()))];
}
export function fuseViews(ranks){
  const scores=new Map();
  for(const rank of ranks)for(const [i,p] of rank.slice(0,50).entries())scores.set(p,(scores.get(p)??0)+1/(60+i+1));
  return [...scores].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'en')).map(r=>r[0]);
}
export function additions(ranking,base,maximum=4){return ranking.filter(p=>!base.includes(p)).slice(0,maximum);}
function main(){
  const output=resolve(process.argv[2]);if(process.argv.length!==3||existsSync(output))throw Error('args or existing output');
  const base='/home/vlad_/are-benchmark-archive';
  const cohorts=[{name:'r3',root:join(base,'defects4j-caller-dev-r1'),trees:join(base,'defects4j-buggy-source-32-r3'),sha:'e1636fad114813142c1b2b2a281db29a0de34433457725cf0a4b95e709b46f59',count:32},
    {name:'r4',root:join(base,'defects4j-caller-r4'),trees:join(base,'defects4j-buggy-source-30-r4'),sha:'9cf325c8e3cf2c805214e8f48572e20432860d4ab65f17576ecb7cae91ca99dd',count:30}];
  const cases=[];
  for(const cohort of cohorts){
    const bytes=readFileSync(join(cohort.root,'PACKETS.jsonl'));if(sha(bytes)!==cohort.sha)throw Error('packet drift');
    const packets=bytes.toString().trimEnd().split('\n').map(JSON.parse);if(packets.length!==cohort.count)throw Error('denominator');
    for(const p of packets){
      const query=p.prompt.split('Failure:\n')[1].split('\nCandidates:\n')[0];
      if(sha(query)!==p.expanded_query_sha256)throw Error('query drift');
      const root=join(cohort.trees,p.case_id+'-checkout');
      for(const o of p.caller_observations)if(sha(readFileSync(join(root,o.path)))!==o.source_sha256)throw Error('caller drift');
      const engine=createRankedSourceAcquisition({root,base_commit:p.buggy_revision,problem_statement:query,maximum_index_bytes:256*1024*1024,mode:'trace-text',allow_projection:false});
      const ranking=engine.rankAll(query);if(ranking.partial_index)throw Error('partial index');
      const expandedRanking=ranking.ranked_files.filter(productionPath);
      const paths=execFileSync('git',['-C',root,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(x=>x.endsWith('.java')).sort();
      if(paths.length!==ranking.indexed_files)throw Error('corpus mismatch');
      const sources=paths.map(path=>{const raw=readFileSync(join(root,path));return {path,text:raw.toString('utf8'),source_sha256:sha(raw)};});
      const sourceProjection=sha(sources.map(d=>`${d.path}\t${d.source_sha256}\n`).join(''));
      const referencePath=join(cohort.trees,cohort.name==='r3'?'SEALED-ARE-JAVA.json':'SEALED-CALLER-ARE.json');
      const referenceBytes=readFileSync(referencePath);
      const referenceSha=cohort.name==='r3'?'80a80e4d83155c59cd6f97676a272090201dc8292e949b36ad4e807306f2a20e':'0062b3d8e0a3e81584a2adb75732647e64dddd10ea7d8531a8e729ecd1ae3751';
      if(sha(referenceBytes)!==referenceSha)throw Error('reference drift');
      const reference=JSON.parse(referenceBytes).cases.find(c=>c.case_id===p.case_id);
      if(reference.java_source_projection_sha256!==sourceProjection)throw Error('source projection drift');
      const graph=buildTypeLinks(sources);
      const seeds=[...new Set([...p.caller_observations.map(o=>o.path),...expandedRanking.slice(0,5)])];
      const nav=navigateTypes(graph,seeds);
      const queryRank=new Map(expandedRanking.map((path,i)=>[path,i]));
      const multi=[...nav.scores].filter(([path])=>productionPath(path)).sort((a,b)=>b[1]-a[1]||(queryRank.get(a[0])??1e9)-(queryRank.get(b[0])??1e9)||a[0].localeCompare(b[0],'en')).map(r=>r[0]);
      const original=p.candidates.map(c=>c.path);
      const ranks=[expandedRanking];
      const added=additions(multi.slice(0,20),original);
      const controlAdded=additions(ranks[0],original,added.length);if(controlAdded.length!==added.length)throw Error('unmatched width');
      cases.push({cohort:cohort.name,case_id:p.case_id,project:p.project,buggy_revision:p.buggy_revision,query_sha256:sha(query),source_projection_sha256:sourceProjection,seeds,graph_files:graph.files,graph_edges:graph.edge_count,graph_sha256:sha(JSON.stringify([...graph.edges].map(([from,to])=>[from,[...to].sort()]))),added_witnesses:Object.fromEntries(added.map(path=>[path,nav.witnesses.get(path)])),base_candidates:original,added_candidates:added,candidates:[...new Set([...original,...added])].sort(),control_added:controlAdded,control_candidates:[...new Set([...original,...controlAdded])].sort(),multiview_ranked_files_top20:multi.slice(0,20),expanded_query_ranked_files_top20:ranks[0].slice(0,20)});
      process.stdout.write(JSON.stringify({cohort:cohort.name,case_id:p.case_id,graph_edges:graph.edge_count,added:added.length})+'\n');
    }
  }
  const result={schema:'are.defects4j-symbol-navigation-development-screen/v1',posture:'exposed source-only development seal; no labels or provider calls by generator',cases,cohort_packet_sha256:Object.fromEntries(cohorts.map(c=>[c.name,c.sha])),implementation_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),symbol_linker_sha256:sha(readFileSync(new URL('./java-type-links-dev-r1.mjs',import.meta.url))),ranker_sha256:sha(readFileSync(new URL('./ranked-source-acquisition-java-r3.mjs',import.meta.url))),policy:'first20000Unicode Java chars, package/import/basename type-reference graph; seeds are caller observations plus expanded-query production top5; weighted .75out/.25in degree-normalized two-hop propagation, seed1/(ordinal+1), depth2half; graph top20 adds<=4 missing paths; matched expanded-query width control; preserve base union'};
  const bytes=JSON.stringify(result,null,2)+'\n';writeFileSync(output,bytes,{flag:'wx',mode:0o600});process.stdout.write(JSON.stringify({cases:cases.length,sha256:sha(bytes)})+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();

