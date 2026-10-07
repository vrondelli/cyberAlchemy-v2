// Matched canonical source-only development. No labels, trusted history or providers.
// Open Questions: G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyProjection,exposedPackets} from './materialize-canonical-exposed-r1.mjs';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-java-canonical-r1.mjs';
import {productionPath} from './screen-defects4j-production-candidates-r1.mjs';
import {sourceWindow} from './screen-defects4j-caller-context-r1.mjs';
import {frameReferences,inspectFrame} from './audit-defects4j-trace-source-r1.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function stackRank(frames){
  const production=path=>{const parts=path.toLowerCase().split('/'),name=parts.at(-1);return path.endsWith('.java')&&!parts.slice(0,-1).some(p=>['test','tests'].includes(p))&&!name.startsWith('test')&&!name.endsWith('test.java')&&!name.endsWith('testcase.java');};
  const preference=path=>{const parts=path.split('/');return [parts.includes('main')?0:parts.includes('src')?1:2,parts.some(p=>['gen','generated','example','examples'].includes(p))?1:0,parts.length,path.length,path];};
  const compare=(a,b)=>{const x=preference(a),y=preference(b);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return x[i]<y[i]?-1:1;return 0;};
  const result=[];for(const {matches} of frames)for(const {path} of [...matches].filter(m=>production(m.path)).sort((a,b)=>compare(a.path,b.path)))if(!result.includes(path))result.push(path);
  return result.slice(0,8);
}
export function callerContext(trace,projection,corpus){
  const observations=[],skipped=[],seen=new Set();
  const frames=frameReferences(trace).map(frame=>({frame,matches:projection.sources.filter(s=>s.path===frame.suffix||s.path.endsWith('/'+frame.suffix)).map(s=>{
    const text=readFileSync(join(corpus,s.path),'utf8');return {path:s.path,source_sha256:s.sha256,...inspectFrame(text,frame)};
  })}));
  for(const {frame,matches} of frames)for(const m of [...matches].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)){
    if(observations.length>=3||seen.has(m.path))continue;
    if(!m.line_in_range){skipped.push({path:m.path,reason:'trace-line-out-of-range'});continue;}
    const lines=readFileSync(join(corpus,m.path),'utf8').split(/\r?\n/);
    const window=sourceWindow(lines,frame.trace_line);
    const offset=lines.slice(window.start_line-1,frame.trace_line-1).join('\n').length+(frame.trace_line>window.start_line?1:0);
    if(offset>=window.utf8.length){skipped.push({path:m.path,reason:'trace-line-outside-capped-window'});continue;}
    seen.add(m.path);observations.push({path:m.path,trace_line:frame.trace_line,source_sha256:m.source_sha256,...window});
  }
  const expanded=trace+'\nCaller source observations:\n'+observations.map(o=>`${o.path}:${o.start_line}\n${o.utf8}`).join('\n');
  return {observations,skipped,frames,expanded};
}
function main(){
  const stage='/home/vlad_/are-benchmark-archive/defects4j-canonical-exposed-r1';
  const fixtureBytes=readFileSync(join(stage,'FIXTURES.json'));const fixtures=JSON.parse(fixtureBytes);
  if(fixtures.expected!==62||fixtures.complete!==62||fixtures.failed!==0||fixtures.cases.length!==62)throw Error('incomplete fixture census');
  const inputs=exposedPackets();const started=Date.now();const cases=[];
  for(const f of fixtures.cases){
    const p=inputs.find(x=>x.case_id===f.case_id);if(!p||p.trace!==f.trace||p.packet_sha256!==f.packet_sha256)throw Error('input drift');
    const proof=verifyProjection(f.projection_root);if(proof.projection_receipt_sha256!==f.projection_receipt_sha256)throw Error('fixture drift');
    const projection=JSON.parse(readFileSync(join(f.projection_root,'RECEIPT.json')));const corpus=join(f.projection_root,'corpus');
    const context=callerContext(p.trace,projection,corpus);
    const ranker=createRankedSourceAcquisition({root:corpus,base_commit:projection.buggy_commit,source_manifest:join(f.projection_root,'RECEIPT.json'),problem_statement:p.trace,maximum_index_bytes:256*1024*1024,mode:'trace-text'});
    const original=ranker.rankAll(p.trace),caller=ranker.rankAll(context.expanded);
    if(original.partial_index||caller.partial_index||original.indexed_files!==projection.source_count)throw Error('partial corpus');
    const stack=stackRank(context.frames);
    const text_projection_sha256=sha(projection.sources.map(s=>`${s.path}\t${sha([...readFileSync(join(corpus,s.path),'utf8')].slice(0,20000).join(''))}\n`).join(''));
    cases.push({cohort:p.cohort,case_id:p.case_id,project:p.project,bug:p.bug,projection_root:f.projection_root,projection_receipt_sha256:f.projection_receipt_sha256,source_tree_sha256:projection.source_tree_sha256,text_projection_sha256,source_count:projection.source_count,
      query:p.trace,query_sha256:sha(p.trace),expanded_query:context.expanded,expanded_query_sha256:sha(context.expanded),observations:context.observations,skipped_observations:context.skipped,frames:context.frames,
      are_original:original.ranked_files.slice(0,20),are_production:original.ranked_files.filter(productionPath).slice(0,20),are_caller:caller.ranked_files.filter(productionPath).slice(0,20),stack:stack.slice(0,8)});
    console.log(JSON.stringify({case_id:p.case_id,observations:context.observations.length,source_count:projection.source_count,finished:cases.length}));
  }
  const result={schema:'are.canonical-source-development-screen/v1',posture:'all62 exposed cases; source-only rankings, not accuracy or superiority',fixtures_sha256:sha(fixtureBytes),cases,elapsed_s:(Date.now()-started)/1000,
    policy:'unchanged first3 distinct caller Java files, trace +/-20 lines capped1200UTF16 chars; explicitly reject capped windows that miss trace anchor; same 20kUnicode source projection and unchanged java-r3 BM25 scoring; production selector unchanged; all source includes tests for shared candidate/IDF corpus',
    implementation_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),ranker_sha256:sha(readFileSync(new URL('./ranked-source-acquisition-java-canonical-r1.mjs',import.meta.url))),gold_read_by_generator:false,open_questions_owner:'G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md'};
  const bytes=JSON.stringify(result,null,2)+'\n';writeFileSync(join(stage,'ARE-SCREEN.json'),bytes,{flag:'wx',mode:0o600});console.log(JSON.stringify({terminal:true,cases:62,receipt_sha256:sha(bytes)}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
