#!/usr/bin/env node
// Source-only exposed development. Open Questions: G01-DEFECTS4J-32-R3-RESULT.md.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-java-r3.mjs';
import {productionPath} from './screen-defects4j-production-candidates-r1.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
export function retainedFrames(query) {
  return [...query.matchAll(/^\s*at\s+([^\s(]+)\(([^():]+\.java):(\d+)\)/gm)].map(m=>({
    suffix:m[1].slice(0,m[1].lastIndexOf('.')).split('$')[0].replaceAll('.','/')+'.java',
    line:Number(m[3])}));
}
export function sourceWindow(lines,line) {
  const start=Math.max(0,line-21);
  return {start_line:start+1,utf8:lines.slice(start,line+20).join('\n').slice(0,1200)};
}
function main() {
  const [packetRoot,trees,outputArg]=process.argv.slice(2);
  if(!packetRoot||!trees||!outputArg)throw Error('args: packet-root trees output');
  const output=resolve(outputArg);if(existsSync(output))throw Error('output exists');
  const bytes=readFileSync(join(packetRoot,'PACKETS.jsonl'));
  if(sha(bytes)!=='2ef2d9726c8b7117053b0c2fae945c62f210ff919309801db2b439a20a5dc139')throw Error('packet drift');
  const packets=bytes.toString().trimEnd().split('\n').map(JSON.parse);
  if(packets.length!==32)throw Error('denominator');
  const cases=[];
  for(const p of packets) {
    const query=p.prompt.split('Failure:\n')[1].split('\nCandidates:\n')[0];
    const root=join(trees,p.case_id+'-checkout');
    const engine=createRankedSourceAcquisition({root,base_commit:p.buggy_revision,problem_statement:query,
      maximum_index_bytes:256*1024*1024,mode:'trace-text',allow_projection:false});
    const paths=execFileSync('git',['-C',root,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(x=>x.endsWith('.java'));
    const observations=[];const observed=new Set();
    for(const frame of retainedFrames(query)) {
      const matches=paths.filter(x=>x===frame.suffix||x.endsWith('/'+frame.suffix)).sort();
      for(const path of matches) {
        if(observations.length>=3||observed.has(path))continue;
        const source=readFileSync(join(root,path));const lines=source.toString('utf8').split(/\r?\n/);
        if(frame.line<1||frame.line>lines.length)continue;
        const window=sourceWindow(lines,frame.line);
        observed.add(path);observations.push({path,trace_line:frame.line,source_sha256:sha(source),...window});
      }
    }
    const expanded=query+'\nCaller source observations:\n'+observations.map(o=>`${o.path}:${o.start_line}\n${o.utf8}`).join('\n');
    const ranking=engine.rankAll(expanded);if(ranking.partial_index)throw Error('partial index');
    const production=ranking.ranked_files.filter(productionPath);
    const original=p.candidates.map(c=>c.path);
    const added=production.slice(0,10).filter(x=>!original.includes(x)).slice(0,4);
    const candidates=[...new Set([...original,...added])].sort();
    cases.push({case_id:p.case_id,project:p.project,buggy_revision:p.buggy_revision,
      original_candidates:original,candidates,added_candidates:added,
      caller_production_top20:production.slice(0,20),observations,expanded_query_sha256:sha(expanded),
      expanded_query_bytes:Buffer.byteLength(expanded),indexed_files:ranking.indexed_files});
    process.stdout.write(JSON.stringify({case_id:p.case_id,observations:observations.length,added:added.length})+'\n');
  }
  writeFileSync(output,JSON.stringify({schema:'are.defects4j-caller-context-screen/v1',
    posture:'exposed development source-only seal; not accuracy, confirmation or superiority',
    packets_sha256:sha(bytes),implementation_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),
    policy:'first3 tracked caller observations, +/-20 lines capped1200 chars each; production top10 expanded-query BM25 adds at most4 missing paths to unchanged r3 union',
    cases},null,2)+'\n',{flag:'wx',mode:0o600});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
