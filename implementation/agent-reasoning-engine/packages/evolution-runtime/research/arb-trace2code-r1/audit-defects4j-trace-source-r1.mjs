#!/usr/bin/env node
// Exposed source-only compatibility audit; no gold/patch/fixed-source reads.
// Open Questions: G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {maskNonCode} from './java-type-links-dev-r1.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
export function frameReferences(trace){
  return [...trace.matchAll(/^\s*at\s+([^\s(]+)\(([^():]+\.java):(\d+)\)/gm)].map(m=>{
    const dot=m[1].lastIndexOf('.');return {suffix:m[1].slice(0,dot).split('$')[0].replaceAll('.','/')+'.java',method:m[1].slice(dot+1),trace_line:Number(m[3])};
  });
}
export function inspectFrame(text,frame){
  const lines=text.split(/\r?\n/);
  if(lines.at(-1)==='')lines.pop();
  const method=frame.method.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return {source_lines:lines.length,line_in_range:frame.trace_line>=1&&frame.trace_line<=lines.length,
    method_token_present:frame.method==='<init>'?null:new RegExp('\\b'+method+'\\s*\\(').test(maskNonCode(text)),
    line_binding_status:'range check only; in-range does not prove trace/source correspondence'};
}
function main(){
  const output=resolve(process.argv[2]);if(process.argv.length!==3||existsSync(output))throw Error('args or output exists');
  const base='/home/vlad_/are-benchmark-archive';
  const cohorts=[{name:'r3',root:join(base,'defects4j-caller-dev-r1'),trees:join(base,'defects4j-buggy-source-32-r3'),sha:'e1636fad114813142c1b2b2a281db29a0de34433457725cf0a4b95e709b46f59',count:32},
    {name:'r4',root:join(base,'defects4j-caller-r4'),trees:join(base,'defects4j-buggy-source-30-r4'),sha:'9cf325c8e3cf2c805214e8f48572e20432860d4ab65f17576ecb7cae91ca99dd',count:30}];
  const cases=[];
  for(const cohort of cohorts){
    const bytes=readFileSync(join(cohort.root,'PACKETS.jsonl'));if(sha(bytes)!==cohort.sha)throw Error('packet drift');
    const packets=bytes.toString().trimEnd().split('\n').map(JSON.parse);if(packets.length!==cohort.count)throw Error('count');
    for(const p of packets){
      const root=join(cohort.trees,p.case_id+'-checkout');
      if(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==p.buggy_revision)throw Error('head drift');
      if(execFileSync('git',['-C',root,'status','--porcelain=v1'],{encoding:'utf8'}).trim())throw Error('dirty');
      const paths=execFileSync('git',['-C',root,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(x=>x.endsWith('.java'));
      const expanded=p.prompt.split('Failure:\n')[1].split('\nCandidates:\n')[0];if(sha(expanded)!==p.expanded_query_sha256)throw Error('query drift');
      const trace=expanded.split('\nCaller source observations:\n')[0];
      const frames=frameReferences(trace).map(f=>({frame:f,matches:paths.filter(path=>path===f.suffix||path.endsWith('/'+f.suffix)).map(path=>{
        const source=readFileSync(join(root,path));return {path,source_sha256:sha(source),...inspectFrame(source.toString('utf8'),f)};
      })}));
      cases.push({cohort:cohort.name,case_id:p.case_id,buggy_revision:p.buggy_revision,frames});
    }
  }
  const all=cases.flatMap(c=>c.frames.flatMap(f=>f.matches));
  const result={schema:'are.defects4j-trace-source-compatibility-audit/v1',posture:'source-only exposed audit; no gold/patch/fixed-source reads; token presence and line range are not compiler bindings',cases,cohort_packet_sha256:Object.fromEntries(cohorts.map(c=>[c.name,c.sha])),implementation_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),frames:cases.reduce((n,c)=>n+c.frames.length,0),matched_frame_files:all.length,out_of_range_matches:all.filter(f=>!f.line_in_range).length,absent_method_token_matches:all.filter(f=>f.method_token_present===false).length,cases_with_out_of_range:cases.filter(c=>c.frames.some(f=>f.matches.some(m=>!m.line_in_range))).map(c=>c.case_id)};
  const bytes=JSON.stringify(result,null,2)+'\n';writeFileSync(output,bytes,{flag:'wx',mode:0o600});process.stdout.write(JSON.stringify({cases:cases.length,frames:result.frames,matched_frame_files:result.matched_frame_files,out_of_range_matches:result.out_of_range_matches,absent_method_token_matches:result.absent_method_token_matches,cases_with_out_of_range:result.cases_with_out_of_range,sha256:sha(bytes)})+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
