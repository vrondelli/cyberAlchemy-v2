#!/usr/bin/env node
// Fresh source-only seal. Open Questions: G01-DEFECTS4J-CALLER-R4-PROTOCOL.md.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-java-r3.mjs';
import {productionPath} from './screen-defects4j-production-candidates-r1.mjs';
import {retainedFrames,sourceWindow} from './screen-defects4j-caller-context-r1.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error(m);};
const manifestSha='40a2de6ad161ea0ce054477637c961c6da74da187ff6363df957b3212f9a298b';
const viewSha='e6183fc0cec1dd7e40ce848179c9a78d1c0d59e112455ed67a167b9fea813bc4';
const [manifestPath,viewPath,metadata,trees,worktreeSha,output]=process.argv.slice(2);
need(process.argv.length===8&&!existsSync(output),'args or output exists');
const mb=readFileSync(manifestPath),vb=readFileSync(viewPath),wb=readFileSync(join(trees,'WORKTREE-RECEIPT.json'));
need(sha(mb)===manifestSha&&sha(vb)===viewSha&&sha(wb)===worktreeSha,'input drift');
const manifest=JSON.parse(mb),views=new Map(JSON.parse(vb).cases.map(c=>[c.case_id,c]));
const worktrees=new Map(JSON.parse(wb).cases.map(c=>[c.case_id,c]));
need(manifest.cases.length===30&&views.size===30&&worktrees.size===30,'denominator');
const harness=['org.junit.','junit.','java.','javax.','sun.','jdk.','org.apache.tools.ant.','org.gradle.'];
const cases=[];
for(const c of manifest.cases){
  const root=join(trees,c.case_id+'-checkout');need(resolve(root)===resolve(worktrees.get(c.case_id).worktree),'root drift');
  const raw=readFileSync(join(metadata,'framework','projects',c.project,'trigger_tests',String(c.bug_id)));
  need(sha(raw)===c.trace_sha256,'trace drift');
  const first=raw.toString('utf8').split('\n--- ',1)[0];need(first.startsWith('--- '),'failure header');
  const lines=first.split(/\r?\n/);
  const frames=lines.filter(l=>{const m=l.match(/^\s*at\s+([^\s(]+)\(([^():]+\.java):(\d+)\)/);return m&&!harness.some(h=>m[1].startsWith(h));}).slice(0,8).map(l=>l.trim());
  const query=lines.slice(0,2).concat(frames).join('\n')+'\n';need(sha(query)===views.get(c.case_id).view_sha256,'view drift');
  const engine=createRankedSourceAcquisition({root,base_commit:c.buggy_revision,problem_statement:query,maximum_index_bytes:256*1024*1024,mode:'trace-text',allow_projection:false});
  const paths=execFileSync('git',['-C',root,'ls-files','-z'],{encoding:'utf8'}).split('\0').filter(p=>p.endsWith('.java')).sort();
  const original=engine.rankAll(query);need(!original.partial_index&&original.ranked_files.length===paths.length,'incomplete original');
  const observations=[],observed=new Set();
  for(const frame of retainedFrames(query))for(const path of paths.filter(p=>p===frame.suffix||p.endsWith('/'+frame.suffix)).sort()){
    if(observations.length>=3||observed.has(path))continue;
    const source=readFileSync(join(root,path)),sl=source.toString('utf8').split(/\r?\n/);
    if(frame.line<1||frame.line>sl.length)continue;
    observed.add(path);observations.push({path,trace_line:frame.line,source_sha256:sha(source),...sourceWindow(sl,frame.line)});
  }
  const expanded=query+'\nCaller source observations:\n'+observations.map(o=>`${o.path}:${o.start_line}\n${o.utf8}`).join('\n');
  const caller=engine.rankAll(expanded);need(!caller.partial_index&&caller.ranked_files.length===paths.length,'incomplete caller');
  cases.push({...c,query,trace_view_sha256:sha(query),expanded_query:expanded,expanded_query_sha256:sha(expanded),observations,candidate_count:paths.length,
    java_source_projection_sha256:sha(paths.map(p=>`${p}\t${sha(readFileSync(join(root,p)))}\n`).join('')),
    indexed_bytes:original.indexed_bytes,partial_index:false,omitted_files:original.omitted_files,
    ranked_files_top20:original.ranked_files.slice(0,20),production_ranked_files_top20:original.ranked_files.filter(productionPath).slice(0,20),caller_production_top20:caller.ranked_files.filter(productionPath).slice(0,20)});
  process.stdout.write(JSON.stringify({case_id:c.case_id,observations:observations.length,indexed_files:paths.length})+'\n');
}
const result={schema:'are.defects4j-caller-are-r4/v1',gold_opened:false,cases,manifest_sha256:manifestSha,view_sha256:viewSha,worktree_sha256:worktreeSha,
  implementation_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),ranker_sha256:sha(readFileSync(new URL('./ranked-source-acquisition-java-r3.mjs',import.meta.url))),selector_sha256:sha(readFileSync(new URL('./screen-defects4j-production-candidates-r1.mjs',import.meta.url))),caller_window_sha256:sha(readFileSync(new URL('./screen-defects4j-caller-context-r1.mjs',import.meta.url)))};
const bytes=JSON.stringify(result,null,2)+'\n';writeFileSync(output,bytes,{flag:'wx',mode:0o600});process.stdout.write(JSON.stringify({cases:30,sha256:sha(bytes)})+'\n');
