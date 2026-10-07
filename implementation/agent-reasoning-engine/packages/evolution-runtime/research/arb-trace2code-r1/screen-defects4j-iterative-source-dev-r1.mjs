#!/usr/bin/env node
// Exposed source-only screen. Open Questions: G01-DEFECTS4J-ITERATIVE-SOURCE-DEV-R1.md.
import {createHash} from 'node:crypto';
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
export function retrievalSnippet(text,query){
  const lines=[...text].slice(0,20000).join('').split(/\r?\n/);
  const terms=new Set(query.toLowerCase().match(/[a-z_][a-z_0-9]{2,}/g)??[]);
  let best=0,bestScore=-1;
  for(let start=0;start<lines.length;start+=10){
    const window=lines.slice(start,start+20).join('\n');
    const score=new Set((window.toLowerCase().match(/[a-z_][a-z_0-9]{2,}/g)??[]).filter(t=>terms.has(t))).size;
    if(score>bestScore){best=start;bestScore=score;}
  }
  return {start_line:best+1,utf8:lines.slice(best,best+20).join('\n').slice(0,1200)};
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
      const views=queryViews(query,p.caller_observations);
      const ranks=views.map(q=>{const r=engine.rankAll(q);if(r.partial_index)throw Error('partial index');return r.ranked_files.filter(productionPath);});
      const seeds=fuseViews(ranks).slice(0,3);
      const retrieved=seeds.map(path=>{
        const source=readFileSync(join(root,path));
        return {path,source_sha256:sha(source),...retrievalSnippet(source.toString('utf8'),query)};
      });
      const feedback=query+'\nRetrieved source observations:\n'+retrieved.map(o=>`${o.path}:${o.start_line}\n${o.utf8}`).join('\n');
      const feedbackRanking=engine.rankAll(feedback);if(feedbackRanking.partial_index)throw Error('partial feedback');
      const multi=fuseViews([...ranks,feedbackRanking.ranked_files.filter(productionPath)]);
      const original=p.candidates.map(c=>c.path);
      const added=additions(multi.slice(0,20),original);
      const controlAdded=additions(ranks[0],original,added.length);if(controlAdded.length!==added.length)throw Error('unmatched width');
      cases.push({cohort:cohort.name,case_id:p.case_id,project:p.project,buggy_revision:p.buggy_revision,query_view_sha256:views.map(sha),feedback_query_sha256:sha(feedback),retrieved_observations:retrieved,base_candidates:original,added_candidates:added,candidates:[...new Set([...original,...added])].sort(),control_added:controlAdded,control_candidates:[...new Set([...original,...controlAdded])].sort(),multiview_ranked_files_top20:multi.slice(0,20),expanded_query_ranked_files_top20:ranks[0].slice(0,20)});
      process.stdout.write(JSON.stringify({cohort:cohort.name,case_id:p.case_id,views:views.length,added:added.length})+'\n');
    }
  }
  const result={schema:'are.defects4j-iterative-source-development-screen/v1',posture:'exposed source-only development seal; no labels or provider calls by generator',cases,cohort_packet_sha256:Object.fromEntries(cohorts.map(c=>[c.name,c.sha])),implementation_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),ranker_sha256:sha(readFileSync(new URL('./ranked-source-acquisition-java-r3.mjs',import.meta.url))),policy:'equal RRF k60 over multi-view production top50 plus one feedback-query ranking; feedback uses top3 multi-view seeds, each20line/stride10 query-overlap window capped1200chars from first20000Unicode source chars; add<=4 missing fused top20 paths; matched expanded-query width control; preserve base union'};
  const bytes=JSON.stringify(result,null,2)+'\n';writeFileSync(output,bytes,{flag:'wx',mode:0o600});process.stdout.write(JSON.stringify({cases:cases.length,sha256:sha(bytes)})+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();

